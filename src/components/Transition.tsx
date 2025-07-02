import { Position } from "./State";
import { BoardObjectProps } from "./GridLayer"
import { StateProps } from "./State";
import { RegularizerAction } from "./regularizer";
import React, { useState } from "react";
import { defaultBoardConfig } from "./InfiniteBoard";
import { getRadius, interpolate } from "./util";
import { useCallback } from "react";

const BLUE_600 = "#2563eb";

export interface TransitionProps {
	id: string, 
	fromID: string, 
	toID: string, 
	label: string, 
}

interface renderTransitionProps {
	transition: TransitionProps, 
	selected: null | string, 
	boardProps: BoardObjectProps, 
	getState: (id: string) => StateProps | null, 
	onPositionChange?: (state: StateProps, newPos: Position | null | RegularizerAction) => void, 
	positionRegularizer?: (state: StateProps, x: number, y: number) => Position | null | RegularizerAction, 
	// x, y are relative position to the grids
	// return null means that it is invalid
	onClick?: (transition: TransitionProps) => void, 
	onDelete?: (transition: TransitionProps) => void, 
	callForUpdate?: () => void, 
}

export const Transition: React.FC<renderTransitionProps> = ({
	transition, 
	selected, 
	boardProps, 
	getState, 
	onClick = () => {}, 
	onDelete = () => {}, 
}) => {
	const [hovering, setHovering] = useState(false);

	const isSelected = selected && selected === transition.id;

	const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {	
		if (!isSelected) return;
		if (e.key === 'Delete') {
			onDelete(transition);
		}
	}, [isSelected, transition, onDelete]);

	const fromState = getState(transition.fromID);
	const toState = getState(transition.toID);
	if (!fromState || !toState) {
		console.log('from or to state is null');
		return <div></div>
	}

	const boardConfig = boardProps.boardConfig || defaultBoardConfig;
	const scale = boardProps.transform.scale;
	const scaledGridSize = boardProps.transform.scale * boardConfig.gridSize;

	const markerScale = Math.min(scale, 1) / (hovering ? 1.25 : 1);

	const transitionMarker = <marker
		id={`arrowhead-${transition.id}`}
		markerWidth={10 * markerScale}
		markerHeight={7 * markerScale}
		refX={10 * markerScale}
		refY={3.5 * markerScale}
		orient="auto"
		markerUnits="strokeWidth"
	>
		<polygon 
			points={`0 0, ${10 * markerScale} ${3.5 * markerScale}, 0 ${7 * markerScale}`} 
			fill={isSelected ? BLUE_600 : "black"} 
		/>
	</marker>

	const getDisplayPosition = (pos: Position) => {return {
		x: pos.x * scaledGridSize + boardProps.transform.x, 
		y: pos.y * scaledGridSize + boardProps.transform.y
	}};

	const loopStartPos: Position = getDisplayPosition({
		x: fromState.position.x + getRadius(fromState) * Math.sqrt(2) / 2, 
		y: fromState.position.y - getRadius(fromState) * Math.sqrt(2) / 2
	});

	const loopEndPos: Position = getDisplayPosition({
		x: fromState.position.x - getRadius(fromState) * Math.sqrt(2) / 2, 
		y: fromState.position.y - getRadius(fromState) * Math.sqrt(2) / 2
	});

	const stateRadius = fromState.radius;

	const loopBody = <path 
		d={`M ${loopStartPos.x} ${loopStartPos.y} 
				A ${stateRadius * scaledGridSize} ${stateRadius * scaledGridSize} 0 1 0 ${loopEndPos.x} ${loopEndPos.y}`}
		fill="none"
		stroke={isSelected ? BLUE_600 : "black"}
		strokeWidth={hovering ? 3 : 2}
		markerEnd={`url(#arrowhead-${transition.id})`}
		style={{pointerEvents: 'all'}}
		onMouseEnter={() => setHovering(true)}
		onMouseLeave={() => setHovering(false)}
		onClick={() => onClick(transition)}
	/>

	const distance = Math.sqrt(
		Math.pow(fromState.position.x - toState.position.x, 2) + 
		Math.pow(fromState.position.y - toState.position.y, 2)
	);

	if (fromState.id === toState.id) {
		const loopSVG =	<svg width={"100%"} height={"100%"} style={{pointerEvents: `none`, position: 'absolute', left: 0, top: 0}}>
			<defs>
				{transitionMarker}
			</defs>
			{loopBody}
		</svg>
		return <div tabIndex={0} onKeyDown={handleKeyDown}>
			{loopSVG}
		</div>;
	}

	if (distance == 0) return null;

	const fromRatio = getRadius(fromState) / distance;
	const toRatio = getRadius(toState) / distance;

	const displayFromPos = getDisplayPosition(interpolate(fromState.position, toState.position, fromRatio));
	const displayToPos = getDisplayPosition(interpolate(toState.position, fromState.position, toRatio));

	const lineBody = <line 
		x1={displayFromPos.x}
		y1={displayFromPos.y}
		x2={displayToPos.x}
		y2={displayToPos.y}
		stroke={isSelected ? BLUE_600 : "black"}
		strokeWidth={hovering ? 3 : 2}
		markerEnd={`url(#arrowhead-${transition.id})`}
		style={{pointerEvents: 'all'}}
		onMouseEnter={() => setHovering(true)}
		onMouseLeave={() => setHovering(false)}
		onClick={() => onClick(transition)}
	/>

	const svg = <svg width={"100%"} height={"100%"} style={{pointerEvents: `none`, position: 'absolute', left: 0, top: 0}}>
		<defs>
			{transitionMarker}
		</defs>
		{lineBody}
	</svg>
	return <div tabIndex={0} onKeyDown={handleKeyDown}>
		{svg}
	</div>;
};
