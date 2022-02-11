import Dict = NodeJS.Dict;
import ReadOnlyDict = NodeJS.ReadOnlyDict;
import { Context, State, Switch, createState } from './state';
import { Transition, TransitionMap, transform } from './transition';


export interface StateTarget {
	readonly id : string;
	readonly name? : string;
}

export type StateTargets = StateTarget[];


export interface StateDescription<T extends Context> {
	readonly transform : transform<T>;
	readonly targets : StateTargets;
}

export type StateDescriptionMap<T extends Context> = ReadOnlyDict<StateDescription<T>>;


function getStateAliasError(localNames:ReadOnlyDict<string>, name:string) : Error {
	const names = Object.getOwnPropertyNames(localNames);
	const msg = `no named transition '${
		name }' in [${
		names.slice(0, 7).join(',') }${
		names.length > 7 ? '...' : '' }]`;

	return new Error(msg);
}

function createStateFromName<T extends Context>(
	localNames:ReadOnlyDict<string>,
	name:string,
	context:T
) : State<T> {
	const localName = localNames[name];

	if (localName !== undefined) return createState(localName, context);
	else throw getStateAliasError(localNames, name);
}

function produceSwitch<T extends Context>(
	targetNames:string[],
	localNames:ReadOnlyDict<string>
) : Switch<T> {
	return {
		default : createState.bind<null, string, T[], State<T>>(null, targetNames[0]),
		success : createState.bind<null, string, T[], State<T>>(null, targetNames[0]),
		failure : createState.bind<null, string, T[], State<T>>(null, targetNames[targetNames.length - 1]),
		named : createStateFromName.bind<null, ReadOnlyDict<string>, [string, T], State<T>>(null, localNames)
	};
}


function createTransition<T extends Context>(state:StateDescription<T>) : Transition<T> {
	const ids:string[] = [];
	const names:Dict<string> = {};

	if (state.targets.length < 1) throw new Error(`state not exitable`);

	for (const item of state.targets) {
		ids.push(item.id);

		if (item.name !== undefined) names[item.name] = item.id;
	}

	return {
		transform : state.transform,
		switch : produceSwitch<T>(ids, names)
	};
}

export function createTransitionMap<T extends Context>(states:StateDescriptionMap<T>) : TransitionMap<T> {
	const res:Map<string, Transition<T>> = new Map();

	for (const name in states) {
		if (!Object.prototype.hasOwnProperty.call(states, name)) continue;

		const state = states[name] as StateDescription<T>;

		res.set(name, createTransition(state));
	}

	return res;
}
