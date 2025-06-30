import React, { useState, useCallback, useEffect } from "react"
import { BoardObjectProps } from "./GridLayer"
import { defaultBoardConfig, Point } from "./InfiniteBoard"
import { RegularizerAction } from "./regularizer"

export interface Position {
    x: number, 
    y: number
};

export interface StateProps {
  id: string, 
  position: Position, 
  radius: number, 
  isAccepting: boolean, 
  isDummy: boolean, 
  label: string, 
  merged: null | string, 
  mergedBy: boolean, 
};

interface renderStateProps {
  state: StateProps, 
  selected: null | string, 
  boardProps: BoardObjectProps, 
  onPositionChange?: (state: StateProps, newPos: Position | null | RegularizerAction) => void, 
  positionRegularizer?: (state: StateProps, x: number, y: number) => Position | null | RegularizerAction, 
  // x, y are relative position to the grids
  // return null means that it is invalid
  onClick?: (state: StateProps) => void, 
  onDoubleClick?: (state: StateProps) => void, 
  onDelete?: (state: StateProps) => void, 
  callForUpdate?: () => void, 
}

const defaultPositionRegularizer = (_: StateProps, x: number, y: number) => {
  return {x: x, y: y};
}

const defaultOnPositionChange = (_: StateProps, __: Position | null | RegularizerAction) => {};

const defaultStateAction = (_: StateProps) => {};

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

  const positionRegularizer = prop.positionRegularizer || defaultPositionRegularizer;
  const onPositionChange = prop.onPositionChange || defaultOnPositionChange;
  const onClick = prop.onClick || defaultStateAction;
  const onDoubleClick = prop.onDoubleClick || defaultStateAction;
  const onDelete = prop.onDelete || defaultStateAction;
  const callForUpdate = prop.callForUpdate || (() => {});

  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [displayPositionAtDrag, setDisplayPositionAtDrag] = useState(displayPosition);
  const [statePositionAtDrag, setStatePositionAtDrag] = useState(myState.position);
  // const [visible, setVisible] = useState(true);

  const isSelected = prop.selected && prop.selected === myState.id;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    
    setIsMouseDown(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDisplayPositionAtDrag(displayPosition);
    setStatePositionAtDrag(myState.position);
  }, [displayPosition, myState]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDown) return;
    setHasDragged(true);

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const newPostion = {
      x: displayPositionAtDrag.x + deltaX,
      y: displayPositionAtDrag.y + deltaY,
    };

    const newRelativePostion = {
      x: (newPostion.x - transform.x) / scaledGridSize, 
      y: (newPostion.y - transform.y) / scaledGridSize
    };

    onPositionChange(myState, positionRegularizer(myState, newRelativePostion.x, newRelativePostion.y));
  }, [isMouseDown, dragStart, displayPosition]);

  const handleClick = useCallback(() => {
    onClick(myState);
  }, [myState, onClick]);

  const handleMouseUp = useCallback(() => {
    if (!hasDragged) handleClick();
    else {
      if (
        myState.position.x !== statePositionAtDrag.x || 
        myState.position.y !== statePositionAtDrag.y
      ) {
        callForUpdate(); // call for update after dragging, if position has changed
      }
    }
    setHasDragged(false);
    setIsMouseDown(false);
  }, [hasDragged, myState, statePositionAtDrag]);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(myState);
  }, [myState, onDoubleClick]);

  useEffect(() => {
    if (isMouseDown) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [isMouseDown, handleMouseMove, handleMouseUp]);

  let scaledRadius = myState.radius * scaledGridSize;
  if (myState.isDummy) scaledRadius /= 3;

  const innerCircle = <div className="absolute border-2 border-black hover:border-blue-600 bg-transparent pointer-events-none"
    style={{
      left: displayPosition.x - scaledRadius + 5, 
      top: displayPosition.y - scaledRadius + 5, 
      width: 2 * scaledRadius - 10, 
      height: 2 * scaledRadius - 10, 
      borderRadius: `100%`, 
    }}
  />

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isSelected) return;
    if (e.key === 'Delete') {
      onDelete(myState);
    }
  }, [isSelected, myState, onDelete]);

  const stateCircle = <div className="absolute border-2 border-black hover:border-blue-600 bg-blue-200" 
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        left: displayPosition.x - scaledRadius, 
        top: displayPosition.y - scaledRadius, 
        width: 2 * scaledRadius, 
        height: 2 * scaledRadius, 
        background: isSelected ? `#bfdbfe`: `#eeeeee`, // bg-blue-200
        borderRadius: `100%`,
        boxShadow: myState.mergedBy ? '0 0 10px 5px rgba(0, 255, 255, 0.7)' : `none`
      }}  
    >
      { transform.scale >= 0.3 && !myState.isDummy && <svg width={2 * scaledRadius} height={2 * scaledRadius} className="relative select-none" pointerEvents={'none'}>
        <text
          x={scaledRadius * 0.97}
          y={scaledRadius * 0.97}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14 * Math.min(1, transform.scale)}
        >
          {myState.label}
        </text>
      </svg>
      }
    </div>

  return !myState.merged && <div>
    {stateCircle}
    {scaledRadius > 10 && myState.isAccepting && !myState.isDummy && innerCircle}
  </div>
}