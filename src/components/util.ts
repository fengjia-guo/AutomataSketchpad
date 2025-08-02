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

export function norm(x: number, y: number) {
	return Math.sqrt(x ** 2 + y ** 2);
}

export function distance(from: Position, to: Position) {
	return norm(from.x - to.x, from.y - to.y);
}

export function normalize(x: number, y: number, r: number = 1) {
	const d = norm(x,y);
	if (d == 0) return {x: 0, y: 0};
	return {x: x/d*r, y: y/d*r};
}

export function getLabelPosition(from: Position, to: Position) {
	const mid = interpolate(from, to, 0.5);
	const vec = normalize(-(to.y - from.y), (to.x - from.x), 0.1);
	return {x: mid.x + vec.x, y: mid.y + vec.y};
}