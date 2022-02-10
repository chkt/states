import { Context, State, createState } from './state';
import { Transition, TransitionMap } from './transition';


interface ErrorState<T extends Context>
extends State<T> {
	readonly error : Error;
}

interface AsyncIterableIterator<T, R = unknown> extends AsyncIterator<T, R, void> {
	[Symbol.asyncIterator](): AsyncIterableIterator<T, R>;
}


function createErrorState<T extends Context>(state:State<T>, error:Error) : ErrorState<T> {
	return {
		...state,
		error
	};
}

export function isErrorState<T extends Context>(state:State<T>) : state is ErrorState<T> {
	return 'error' in state;
}


function transformContext<T extends Context>(state:Transition<T>, context:T) : Promise<State<T>> {
	return state.transform(context, state.switch);
}

function transitionState<T extends Context>(states:TransitionMap<T>, now:State<T>) : Promise<State<T>> {
	const state = states.get(now.id) as Transition<T>;

	return transformContext(state, now.context);
}

export async function* iterate<T extends Context>(
	states:TransitionMap<T>,
	start:State<T>
) : AsyncIterableIterator<State<T>, State<T>> {
	let now = start;

	while (true) {
		if (!states.has(now.id)) break;

		try {
			now = {
				...await transitionState(states, now),
				path : [ ...now.path, now.id ]
			};
		}
		catch (err) {
			return createErrorState(now, err as Error);
		}

		yield now;
	}

	return now;
}


type stateCallback<T extends Context> = (state:State<T>) => boolean;


const noop = () : boolean => true;

async function traverse<T extends Context>(
	states:TransitionMap<T>,
	start:State<T>,
	onStep:stateCallback<T> = noop
) : Promise<State<T>> {
	const iterator = iterate(states, start);
	let now;

	while (true) {
		const next = await iterator.next();

		now = next.value;

		if (next.done === true || !onStep(now)) break;
	}

	return now;
}


export type stateToState<T extends Context> = (start:State<T>) => Promise<State<T>>;

export function bindStateToState<T extends Context>(states:TransitionMap<T>) : stateToState<T> {
	return (start:State<T>) => traverse(states, start);
}

export type contextToState<T extends Context> = (context:T) => Promise<State<T>>;

export function bindContextToState<T extends Context>(
	states:TransitionMap<T>,
	startId:string
) : contextToState<T> {
	return (context:T) => traverse(states, createState(startId, context));
}

export type contextToContext<T extends Context> = (context:T) => Promise<T>;

export function bindContextToContext<T extends Context>(
	states:TransitionMap<T>,
	startId:string
) : contextToContext<T> {
	return async (context:T) : Promise<T> => {
		const end = await traverse(states, createState(startId, context));

		if (isErrorState(end)) throw end.error;
		else return end.context;
	};
}
