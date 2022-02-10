import { Hash } from './common';
import { Context } from './state';
import { StateDescription, StateDescriptionMap, StateTargets } from './create';


interface StateInsertion<T extends Context> {
	readonly id : string;
	readonly desc : StateDescription<T>;
}


function replaceTargets(targets:StateTargets, from:string, to:string) : StateTargets {
	const res:StateTargets = [];

	for (const target of targets) {
		const id = target.id === from ? to : target.id;

		res.push({ ...target, id });
	}

	return res;
}


type transform<T extends Context> = (id:string, item:StateDescription<T>) => StateDescription<T> | null;


function exec<T extends Context>(
	source:StateDescriptionMap<T>,
	fn:transform<T>,
	to?:StateInsertion<T>
) : StateDescriptionMap<T> {
	const map:Hash<StateDescription<T>> = {};

	for (const id in source) {
		if (!Object.prototype.hasOwnProperty.call(source, id)) continue;

		const res = fn(id, source[id]);

		if (res === null) continue;

		map[id] = res;
	}

	if (to !== undefined) {
		if (to.id in map) throw new Error(`duplicate ids ${ to.id }`);

		map[to.id] = to.desc;
	}

	return map;
}


export function insert<T extends Context>(
	source:StateDescriptionMap<T>,
	fromId:string,
	to:StateInsertion<T>
) : StateDescriptionMap<T> {
	const toId = to.id;

	return exec(source, (id, desc) => ({
		...desc,
		targets : replaceTargets(desc.targets, fromId, toId)
	}), {
		...to,
		desc : {
			transform : to.desc.transform,
			targets : to.desc.targets
		}
	});
}

export function append<T extends Context>(
	source:StateDescriptionMap<T>,
	fromId:string,
	fromTarget:string,
	to:StateInsertion<T>
) : StateDescriptionMap<T> {
	const toId = to.id;

	return exec(source, (id, desc) => ({
		...desc,
		targets : id === fromId ? replaceTargets(desc.targets, fromTarget, toId) : desc.targets
	}), {
		id : to.id,
		desc : {
			transform : to.desc.transform,
			targets : to.desc.targets
		}
	});
}

export function set<T extends Context>(
	source:StateDescriptionMap<T>,
	to:StateInsertion<T>
) : StateDescriptionMap<T> {
	const toId = to.id;

	return exec(source, (id, desc) => id === toId ? null : desc, to);
}

export function remove<T extends Context>(
	source:StateDescriptionMap<T>,
	removeId:string
) : StateDescriptionMap<T> {
	return exec(source, (id, desc) => id === removeId ? null : desc);
}


interface InsertAction<T extends Context>
extends StateDescription<T> {
	readonly before : string;
}

interface AppendAction<T extends Context>
extends StateDescription<T> {
	readonly after : string;
	readonly at : string;
}

function isInsertAction<T extends Context>(action:StateDescription<T>) : action is InsertAction<T> {
	return 'before' in action;
}

function isAppendAction<T extends Context>(action:StateDescription<T>) : action is AppendAction<T> {
	return 'after' in action;
}


export type StateModification<T extends Context> = StateDescription<T> | InsertAction<T> | AppendAction<T> | null;
export type StateModificationMap<T extends Context> = Hash<StateModification<T>>;


export function modify<T extends Context>(
	states:StateDescriptionMap<T>,
	actions:StateModificationMap<T>
) : StateDescriptionMap<T> {
	let map = states;

	for (const id in actions) {
		if (!Object.prototype.hasOwnProperty.call(actions, id)) continue;

		const action = actions[id];

		if (action === null) map = remove(map, id);
		else if (isInsertAction(action)) map = insert(map, action.before, { id, desc : action });
		else if (isAppendAction(action)) map = append(map, action.after, action.at, { id, desc : action });
		else map = set(map, { id, desc : action });
	}

	return map;
}
