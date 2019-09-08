import * as assert from 'assert';
import { describe, it } from 'mocha';

import { StateDescriptionMap } from "../source/create";
import { Context, State, Switch } from "../source/state";
import { modify, StateModificationMap } from "../source/modify";


async function noop(context:Context, next:Switch<Context>) : Promise<State<Context>> {
	return next.default(context);
}


describe("modify", () => {
	it ("should insert specified actions", () => {
		const states:StateDescriptionMap<Context> = {
			start : {
				transform : noop,
				targets : [{ id : 'end' }]
			},
			end : {
				transform : noop,
				targets : [{ id : '' }]
			}
		};

		const mod:StateModificationMap<Context> = {
			insert : {
				before: 'end',
				transform: noop,
				targets: [{id: 'end'}]
			}
		};

		assert.deepStrictEqual(modify(states, mod), {
			start : {
				transform : noop,
				targets : [{ id : 'insert' }]
			},
			insert : {
				transform : noop,
				targets : [{ id : 'end' }]
			},
			end : {
				transform : noop,
				targets : [{ id : ''}]
			}
		});
	});

	it("should append specified actions", () => {
		const states:StateDescriptionMap<Context> = {
			start : {
				transform : noop,
				targets : [{ id : 'default' }, { id : 'fail', name : 'boom' }]
			}
		};

		const mod:StateModificationMap<Context> = {
			append : {
				after : 'start',
				at : 'fail',
				transform : noop,
				targets : [{ id : 'end' }]
			}
		};

		assert.deepStrictEqual(modify(states, mod), {
			start : {
				transform : noop,
				targets : [{ id : 'default' }, { id : 'append', name : 'boom' }]
			},
			append : {
				transform : noop,
				targets : [{ id : 'end' }]
			}
		});
	});

	it("should replace specified actions", () => {
		const states:StateDescriptionMap<Context> = {
			start : {
				transform : noop,
				targets : [{ id : 'end' }]
			},
			end : {
				transform : noop,
				targets : [{ id : '' }]
			}
		};

		const mod:StateModificationMap<Context> = {
			end : {
				transform : noop,
				targets : [{ id : 'foo' }]
			}
		};

		assert.deepStrictEqual(modify(states, mod), {
			start : {
				transform : noop,
				targets : [{ id : 'end' }]
			},
			end : {
				transform : noop,
				targets : [{ id : 'foo' }]
			}
		});
	});

	it("should add specified actions", () => {
		const states:StateDescriptionMap<Context> = {
			start : {
				transform : noop,
				targets : [{ id : 'end' }]
			}
		};

		const mod:StateModificationMap<Context> = {
			add : {
				transform : noop,
				targets : [{ id : 'start' }]
			}
		};

		assert.deepStrictEqual(modify(states, mod), {
			start : {
				transform : noop,
				targets : [{ id : 'end' }]
			},
			add : {
				transform : noop,
				targets : [{ id : 'start' }]
			}
		});
	});

	it("should remove specified actions", () => {
		const states:StateDescriptionMap<Context> = {
			start : {
				transform : noop,
				targets : [{ id : 'end' }]
			},
			end : {
				transform : noop,
				targets : [{ id : '' }]
			}
		};

		const mod:StateModificationMap<Context> = {
			end : null
		};

		assert.deepStrictEqual(modify(states, mod), {
			start : {
				transform : noop,
				targets : [{ id : 'end' }]
			}
		});
	});
});
