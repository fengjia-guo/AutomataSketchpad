import { Position, StateProps } from "./State";

export function getRadius(state: StateProps) {
	return state.isDummy ? state.radius / 3 : state.radius;
}

export function interpolate(from: Position, to: Position, ratio: number) {
	return {
		x: from.x * (1 - ratio) + to.x * ratio, 
		y: from.y * (1 - ratio) + to.y * ratio
	} as Position;
}