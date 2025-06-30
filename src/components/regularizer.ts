import { StateProps, Position } from "./State";

export class RegularizerAction {
	constructor(public action: string, public args: Record<string, string>, public x: number, public y: number) {}
}

export const gridRegularizer = (state: null | StateProps, states: Record<string, StateProps>, x: number, y: number) => {
	// state = null means a new state to be created
	const regularized = {x: Math.round(x), y: Math.round(y)};
	for (const key in states) {
		if ((!state || states[key].id !== state.id) && 
			states[key].position.x === regularized.x && 
			states[key].position.y === regularized.y) {
			if (!state || !state.isDummy) return null;
			else return new RegularizerAction("merge", {"from": state.id, "to": key}, regularized.x, regularized.y);
		}
	}
	return regularized as Position;
};

export const updateStatesByAction = (state: StateProps, states: Record<string, StateProps>, action: RegularizerAction) => {
	// let newStates: Record<string, StateProps> = {};
	if (action.action === "merge") {
		const toID = action.args["to"];
		return {
			[state.id]: {...state, merged: toID, position: {x: action.x, y: action.y}}, 
			[toID]: {...states[toID], mergedBy: true}, 
		}
		// return {...state, merged: toID, position: {x: action.x, y: action.y}} as StateProps;
	} else {
		console.log(`unrecognized action ${action}`);
		return {};
	}
}