export interface Context {
	[index:string] : any;
}

export interface State<T extends Context> {
	readonly id : string;
	readonly context : T;
}

type switchOp<T extends Context> = (context:T) => State<T>;
type namedSwitchOp<T extends Context> = (name:string, context:T) => State<T>;

export interface Switch<T extends Context> {
	readonly default : switchOp<T>;
	readonly success : switchOp<T>;
	readonly failure : switchOp<T>;
	readonly named : namedSwitchOp<T>;
}


export function createState<T extends Context>(name:string, context:T) : State<T> {
	return {
		id: name,
		context
	};
}
