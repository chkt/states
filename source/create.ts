import { Hash } from './common';
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

export type StateDescriptionMap<T extends Context> = Hash<StateDescription<T>>;


function getStateAliasError(localNames:Hash<string>, name:string) : Error {
	const names = Object.getOwnPropertyNames(localNames);
	const msg = `no named transition '${
		name }' in [${
		names.slice(0, 7).join(',') }${
		names.length > 7 ? '...' : '' }]`;

	return new Error(msg);
}

function createStateFromName<T extends Context>(
	localNames:Hash<string>,
	name:string,
	context:T
) : State<T> {
	if (name in localNames) return createState(localNames[name], context);
	else throw getStateAliasError(localNames, name);
}

function produceSwitch<T extends Context>(
	targetNames:string[],
	localNames:Hash<string>
) : Switch<T> {
	return {
		default : createState.bind<null, string, T[], State<T>>(null, targetNames[0]),
		success : createState.bind<null, string, T[], State<T>>(null, targetNames[0]),
		failure : createState.bind<null, string, T[], State<T>>(null, targetNames[targetNames.length - 1]),
		named : createStateFromName.bind<null, Hash<string>, [string, T], State<T>>(null, localNames)
	};
}


function createTransition<T extends Context>(state:StateDescription<T>) : Transition<T> {
	const ids:string[] = [];
	const names:Hash<string> = {};

	if (state.targets.length < 1) throw new Error(`state not exitable`);

	state.targets.forEach((item:StateTarget) => {
		ids.push(item.id);

		if ('name' in item) names[item.name as string] = item.id;
	});

	return {
		transform : state.transform,
		switch : produceSwitch<T>(ids, names)
	};
}

export function createTransitionMap<T extends Context>(states:StateDescriptionMap<T>) : TransitionMap<T> {
	const res:Map<string, Transition<T>> = new Map();

	for (const name in states) {
		if (!Object.prototype.hasOwnProperty.call(states, name)) continue;

		const state:StateDescription<T> = states[name];

		res.set(name, createTransition(state));
	}

	return res;
}
