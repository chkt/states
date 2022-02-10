import * as assert from 'assert';
import { describe, it } from 'mocha';
import {
	bindContextToContext,
	bindContextToState,
	bindStateToState,
	iterate
} from '../source/traverse';
import { Context, State, Switch, createState } from '../source/state';
import { createTransitionMap } from '../source/create';


/* eslint-disable @typescript-eslint/no-magic-numbers */
describe('iterate', () => {
	it('should traverse a basic state machine', async () => {
		const states = createTransitionMap({
			start : {
				transform : async (context:Context, next:Switch<Context>) : Promise<State<Context>> => {
					context.foo = 1;

					return next.success(context);
				},
				targets : [{ id : 'end' }]
			}
		});

		const iteration = iterate(states, {
			id : 'start',
			path : [],
			context : {}
		});
		const step1 = await iteration.next();

		assert.strictEqual(step1.done, false);
		assert.deepStrictEqual(step1.value, {
			id : 'end',
			path : [ 'start' ],
			context : { foo : 1 }
		});

		const step2 = await iteration.next();

		assert.strictEqual(step2.done, true);
		assert.deepStrictEqual(step2.value, {
			id : 'end',
			path : [ 'start' ],
			context : { foo : 1 }
		});

		return true;
	});

	it('should traverse multiple states', async () => {
		async function transform(ctx:Context, next:Switch<Context>) : Promise<State<Context>> {
			return next.default(ctx);
		}

		const context = { foo : 1 };
		const states = createTransitionMap({
			first : {
				transform,
				targets : [{ id : 'second' }]
			},
			second : {
				transform,
				targets : [{ id : 'third' }]
			},
			third : {
				transform,
				targets : [{ id : 'end' }]
			}
		});

		const iteration = iterate(states, { context, path : [], id : 'first' });
		let step = await iteration.next();

		assert.strictEqual(step.done, false);
		assert.deepStrictEqual(step.value, {
			id : 'second',
			path : [ 'first' ],
			context
		});

		step = await iteration.next();

		assert.strictEqual(step.done, false);
		assert.deepStrictEqual(step.value, {
			id : 'third',
			path : [ 'first', 'second' ],
			context
		});

		step = await iteration.next();

		assert.strictEqual(step.done, false);
		assert.deepStrictEqual(step.value, {
			id : 'end',
			path : [ 'first', 'second', 'third' ],
			context
		});

		return true;
	});

	it('should traverse the success branch', async () => {
		const states = createTransitionMap({
			start : {
				transform : async (ctx:Context, next:Switch<Context>) => next.success(ctx),
				targets : [{ id : 'ok' }, { id : 'no' }, { id : 'bah' }]
			}
		});

		const context = { foo : 1 };
		const iteration = iterate(states, {
			id : 'start',
			path : [],
			context
		});

		const step = await iteration.next();

		assert.deepStrictEqual(step.value, {
			id : 'ok',
			path : [ 'start' ],
			context
		});

		return true;
	});

	it('should traverse the failure branch', async () => {
		const states = createTransitionMap({
			start : {
				transform : async (ctx:Context, next:Switch<Context>) => next.failure(ctx),
				targets : [{ id : 'ok' }, { id : 'no' }, { id : 'bah' }]
			}
		});

		const context = { foo : 1 };
		const iteration = iterate(states, {
			id : 'start',
			path : [],
			context
		});

		const step = await iteration.next();

		assert.deepStrictEqual(step.value, {
			id : 'bah',
			path : [ 'start' ],
			context
		});
	});

	it('should traverse a named branch', async () => {
		const states = createTransitionMap({
			start : {
				transform : async (ctx:Context, next:Switch<Context>) => next.named('alt', ctx),
				targets : [{ id : 'ok' }, { id : 'no', name : 'alt' }, { id : 'bah' }]
			}
		});

		const context = { foo : 1 };
		const iteration = iterate(states, {
			id : 'start',
			path : [],
			context
		});

		const step = await iteration.next();

		assert.deepStrictEqual(step.value, {
			id : 'no',
			path : [ 'start' ],
			context
		});
	});

	it('should catch errors thrown inside transforms', async () => {
		const error = new Error('bang');
		const states = createTransitionMap({
			start : {
				transform : () => {
					throw error;
				},
				targets : [{ id : 'end' }]
			}
		});

		const context = { foo : 1 };
		const iteration = iterate(states, {
			id : 'start',
			path : [],
			context
		});

		const step = await iteration.next();

		assert.strictEqual(step.done, true);
		assert.deepStrictEqual(step.value, {
			id : 'start',
			path : [],
			context,
			error
		});
	});

	it('should recall all state transitions', async () => {
		const states = createTransitionMap({
			start : {
				transform : async (ctx, next) => next.success(ctx),
				targets : [{ id : 'testValue' }]
			},
			testValue : {
				transform : async (ctx, next) => {
					if (ctx.foo === 2) return next.success(ctx);
					else return next.failure(ctx);
				},
				targets : [{ id : 'end_success' }, { id : 'updateValue' }]
			},
			updateValue : {
				transform : async (ctx, next) => next.success({ ...ctx, foo : 2 }),
				targets : [{ id : 'testValue' }]
			}
		});

		const context = { foo : 1 };
		const iteration = iterate(states, {
			id : 'start',
			path : [],
			context
		});

		for (const expected of [
			{ id : 'testValue', path : [ 'start' ], context : { foo : 1 }},
			{ id : 'updateValue', path : [ 'start', 'testValue' ], context : { foo : 1 }},
			{ id : 'testValue', path : [ 'start', 'testValue', 'updateValue' ], context : { foo : 2 }},
			{ id : 'end_success', path : [ 'start', 'testValue', 'updateValue', 'testValue' ], context : { foo : 2 }}
		]) {
			const step = await iteration.next();

			assert.deepStrictEqual(step.value, expected);
		}
	});
});

describe('bindStateToState', () => {
	it('should return a resolve function', async () => {
		const states = createTransitionMap({
			start : {
				transform : async (context:Context, next:Switch<Context>) : Promise<State<Context>> => {
					if (context.foo === 1) {
						context.bar = 1;

						return next.success(context);
					}
					else if (context.foo === 2) {
						context.bar = 2;

						return next.failure(context);
					}
					else throw new Error('bang');
				},
				targets : [{ id : 'end_success' }, { id : 'end_failure' }]
			}
		});

		const transitions = bindStateToState(states);
		const good = await transitions(createState('start', { foo : 1 }));
		const bad = await transitions(createState('start', { foo : 2 }));
		const ugly = await transitions(createState('start', { foo : 3 }));

		assert.deepStrictEqual(good, {
			id : 'end_success',
			path : [ 'start' ],
			context : { foo : 1, bar : 1 }
		});

		assert.deepStrictEqual(bad, {
			id : 'end_failure',
			path : [ 'start' ],
			context : { foo : 2, bar : 2 }
		});

		assert.deepStrictEqual(ugly, {
			id : 'start',
			path : [],
			context : { foo : 3 },
			error : new Error('bang')
		});
	});
});

describe('bindContextToState', () => {
	it('should return a resolve function', async () => {
		const states = createTransitionMap({
			start : {
				transform : async (context:Context, next:Switch<Context>) : Promise<State<Context>> => {
					switch (context.foo) {
						case 1 : return next.success({ bar : 1 });
						case 2 : return next.failure({ bar : 2 });
						default : throw new Error('bang');
					}
				},
				targets : [{ id : 'end_success' }, { id : 'end_failure' }]
			}
		});

		const transitions = bindContextToState(states, 'start');
		const good = await transitions({ foo : 1 });
		const bad = await transitions({ foo : 2 });
		const ugly = await transitions({ foo : 3 });

		assert.deepStrictEqual(good, {
			id : 'end_success',
			path : [ 'start' ],
			context : { bar : 1 }
		});

		assert.deepStrictEqual(bad, {
			id : 'end_failure',
			path : [ 'start' ],
			context : { bar : 2 }
		});

		assert.deepStrictEqual(ugly, {
			id : 'start',
			path : [],
			context : { foo : 3 },
			error : new Error('bang')
		});
	});
});

describe('bindContextToContext', () => {
	it('should return a resolve function', async () => {
		const states = createTransitionMap({
			start : {
				transform : async (context:Context, next:Switch<Context>) : Promise<State<Context>> => {
					switch (context.foo) {
						case 1 : return next.success({ bar : 1 });
						case 2 : return next.failure({ bar : 2 });
						default : throw new Error('bang');
					}
				},
				targets : [{ id : 'end_success' }, { id : 'end_failure' }]
			}
		});

		const transitions = bindContextToContext(states, 'start');
		const good = await transitions({ foo : 1 });
		const bad = await transitions({ foo : 2 });

		assert.deepStrictEqual(good, { bar : 1 });
		assert.deepStrictEqual(bad, { bar : 2 });

		transitions({ foo : 3 })
			.then(() => assert(false))
			.catch(err => assert.deepStrictEqual(err, new Error('bang')));
	});
});
