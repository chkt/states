import { bindStateToState, bindContextToState, bindContextToContext, isErrorState } from './traverse';
import { createTransitionMap as create } from './create';
import { modify } from './modify';


export default {
	create,
	modify,
	bindStateToState,
	bindContextToState,
	bindContextToContext,
	isErrorState
};
