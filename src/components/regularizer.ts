import { StateProps, Position } from "./State";

export const gridRegularizer = (state: null | StateProps, states: Record<string, StateProps>, x: number, y: number) => {
	// state = null means a new state to be created
	const regularized = {x: Math.round(x), y: Math.round(y)};
	for (const key in states) {
		if ((!state || states[key].id !== state.id) && 
			states[key].position.x === regularized.x && 
			states[key].position.y === regularized.y) {
			return null;
		}
	}
	return regularized as Position;
};