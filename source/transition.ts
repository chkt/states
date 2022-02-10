import { Context, State, Switch } from './state';


export type transform<T extends Context> = (context:T, next:Switch<T>) => Promise<State<T>>;


export interface Transition<T extends Context> {
	readonly transform : transform<T>;
	readonly switch : Switch<T>;
}

export type TransitionMap<T extends Context> = ReadonlyMap<string, Transition<T>>;
