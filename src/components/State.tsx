import React from "react"
import { BoardObjectProps } from "./GridLayer"
import { defaultBoardConfig } from "./InfiniteBoard"

export interface Position {
    x: number, 
    y: number
};

export interface StateProps {
  id: number, 
  position: Position, 
  radius: number, 
  isAccepting: boolean, 
  isDummy: boolean, 
  label: string
};

interface renderStateProps {
  state: StateProps, 
  boardProps: BoardObjectProps, 
  onPositionChange?: (state: StateProps, newPos: Position) => void, 
  positionRegularizer?: (state: StateProps, x: number, y: number) => Position, 
  onClick?: (state: StateProps) => void, 
}

export const State: React.FC<renderStateProps> = (prop) => {
  const myState = prop.state;
  const boardConfig = prop.boardProps.boardConfig || defaultBoardConfig;
  const gridSize = boardConfig.gridSize;
  const transform = prop.boardProps.transform;
  const scaledGridSize = gridSize * transform.scale;

  const displayPosition = {
    x: transform.x + myState.position.x * scaledGridSize,
    y: transform.y + myState.position.y * scaledGridSize
  }
  
  return [
    <circle 
      cx={displayPosition.x} 
      cy={displayPosition.y}
      r={myState.radius * scaledGridSize}
      fill="#e5e7eb"
      stroke="#111111"
      strokeWidth={1}
      opacity={1}
    />, 
    <text
      x={displayPosition.x}
      y={displayPosition.y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={16 * transform.scale}
    >
      {myState.label}
    </text>
  ];
}

export const DemoState: React.FC<{ p: BoardObjectProps} > = (props) => {
  const demoStateProps: StateProps = {id: 0, position: {x: 1, y: 1}, label: "demo", radius: 0.25, isAccepting: false, isDummy: false}
  return <State state={demoStateProps} boardProps={props.p} />
}