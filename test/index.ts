import * as assert from 'assert';
import { describe, it } from 'mocha';

import * as transition from '../source/traverse';
import * as create from '../source/create';
import * as modify from '../source/modify';
import states from '../source/index';

describe('states', () => {
	it('should expose bind*', () => {
		assert.strictEqual(states.bindStateToState, transition.bindStateToState);
		assert.strictEqual(states.bindContextToState, transition.bindContextToState);
		assert.strictEqual(states.bindContextToContext, transition.bindContextToContext);
	});

	it('should expose isErrorState', () => {
		assert.strictEqual(states.isErrorState, transition.isErrorState);
	});

	it('should expose createTransitionMap', () => {
		assert.strictEqual(states.create, create.createTransitionMap);
	});

	it('should expose modifyStateDescriptionMap', () => {
		assert.strictEqual(states.modify, modify.modify);
	});
});
