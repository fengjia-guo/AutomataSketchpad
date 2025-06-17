import React, { useCallback } from "react";
import { Position, State, StateProps } from "./State";
import { BoardObjectProps } from "./GridLayer";
import { gridRegularizer } from "./regularizer";

export interface StateLayerProps {
  states: Record<string, StateProps>, 
  boardProps: BoardObjectProps
  selected?: null | string, 
  setSelected?: (_: null | string) => void, 
  onStatesChange?: (_: Record<string, StateProps>) => void, 
}

export const StateLayer: React.FC<StateLayerProps> = ({
  states, 
  boardProps, 
  selected = null, 
  setSelected = () => {}, 
  onStatesChange = () => {}
}) => {
  // const layerRef = useRef<HTMLDivElement>(null);
  
  const dragRegularizer = useCallback((state: StateProps, x: number, y: number) => {
    return gridRegularizer(state, states, x, y);
  }, [states]);

  const onPositionChange = useCallback((state: StateProps, newPos: Position | null) => {
    // console.log(newPos);
    if (!newPos) return;
    const newStateProp = {...state, position: newPos};
    onStatesChange({[state.id]: newStateProp});
  }, [onStatesChange]);

  return (
    <div>
      {Object.keys(states).map((stateId, index) => (
        <div key={index}>
          <State 
            state={states[stateId]} 
            selected={selected}
            boardProps={boardProps}
            positionRegularizer={dragRegularizer}
            onPositionChange={onPositionChange}
            onClick={(s) => setSelected(s.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default StateLayer;