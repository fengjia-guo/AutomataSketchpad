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
  setStates?: (_: Record<string, StateProps>) => void, 
  callForUpdate?: () => void, 
}

export const StateLayer: React.FC<StateLayerProps> = ({
  states, 
  boardProps, 
  selected = null, 
  setSelected = () => {}, 
  onStatesChange = () => {}, 
  setStates = () => {}, 
  callForUpdate = () => {}, 
}) => {
  
  const dragRegularizer = useCallback((state: StateProps, x: number, y: number) => {
    return gridRegularizer(state, states, x, y);
  }, [states]);

  const onPositionChange = useCallback((state: StateProps, newPos: Position | null) => {
    if (!newPos) return;
    const newStateProp = {...state, position: newPos};
    onStatesChange({[state.id]: newStateProp});
  }, [onStatesChange]);

  const onDoubleClick = useCallback((state: StateProps) => {
    const newStateProp: StateProps = {...state, isAccepting: !state.isAccepting};
    onStatesChange({[state.id]: newStateProp});
    callForUpdate();
  }, [onStatesChange]);

  const deleteState = useCallback((state: StateProps) => {
    let remainingStates: Record<string, StateProps> = {};
    for (const key in states) {
      if (key !== state.id) {
        remainingStates[key] = states[key];
      }
    }
    setSelected(null);
    setStates(remainingStates);
    callForUpdate();
  }, [states]);

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
            onDoubleClick={onDoubleClick}
            onDelete={deleteState}
            callForUpdate={callForUpdate}
          />
        </div>
      ))}
    </div>
  );
};

export default StateLayer;