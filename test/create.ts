import * as assert from 'assert';
import { describe, it } from "mocha";

import { Switch, Context } from "../source/state";
import * as builder from '../source/create';
import { Transition } from "../source/transition";


const noop = async (context:Context, next:Switch<Context>) => next.success(context);


describe('createTransitionMap', () => {
	it("should produce a basic TransitionMap", () => {
		const res = builder.createTransitionMap({
			start : {
				transform : noop,
				targets : [{ id : 'end' }]
			}
		});

		assert(res.has('start'));

		const step = res.get('start') as Transition<Context>;
		const context = { foo : 1 };

		assert('transform' in step);
		assert(step.transform === noop);
		assert('switch' in step);
		assert.deepStrictEqual(step.switch.default(context), {
			id : 'end',
			context
		});
		assert.deepStrictEqual(step.switch.success(context), {
			id : 'end',
			context
		});
	});

	it("should produce a TransitionMap with named targets", () => {
		const res = builder.createTransitionMap({
			start : {
				transform : noop,
				targets : [{
					id : 'end_ok',
					name : 'success'
				}, {
					id : 'end_oh_no',
					name : 'failure'
				}]
			}
		});

		assert(res.has('start'));

		const step = res.get('start') as Transition<Context>;
		const context = { foo : 1 };

		assert.deepStrictEqual(step.switch.named('success', context), {
			id : 'end_ok',
			context
		});
		assert.deepStrictEqual(step.switch.named('failure', context), {
			id : 'end_oh_no',
			context
		});

		assert.throws(() => {
			step.switch.named('bad', context);
		}, new Error('no named transition \'bad\' in [success,failure]'));
	});

	it('should produce a TransitionMap with failure targets', () => {
		const res = builder.createTransitionMap({
			start : {
				transform : noop,
				targets : [{ id : 'yay' }, { id : 'nay' }]
			}
		});

		const step = res.get('start') as Transition<Context>;
		const context = { foo : 1 };

		assert.deepStrictEqual(step.switch.failure(context), {
			id : 'nay',
			context
		});
	});

	it('should require at least one exit in declared states', () => {
		assert.throws(() => {
			builder.createTransitionMap({
				start : {
					transform : noop,
					targets : []
				}
			});
		}, new Error('state not exitable'));
	});
});
