import React, { useCallback } from "react";
import { Position, State, StateProps } from "./State";
import { BoardObjectProps } from "./GridLayer";
import { gridRegularizer, RegularizerAction, updateStatesByAction } from "./regularizer";

export interface StateLayerProps {
  states: Record<string, StateProps>, 
  boardProps: BoardObjectProps
  selected?: null | string, 
  setSelected?: (_: null | string) => void, 
  onStatesChange?: (_: Record<string, StateProps>) => void, 
  setStates?: (_: Record<string, StateProps>) => void, 
  callForUpdate?: () => void, 
  onStateClicked?: (_: StateProps) => void, 
  onStateDeleted?: (_: StateProps) => void, 
}

export const StateLayer: React.FC<StateLayerProps> = ({
  states, 
  boardProps, 
  selected = null, 
  setSelected = () => {}, 
  onStatesChange = () => {}, 
  setStates = () => {}, 
  callForUpdate = () => {}, 
  onStateClicked = () => {}, 
  onStateDeleted = () => {}, 
}) => {
  
  const dragRegularizer = useCallback((state: StateProps, x: number, y: number) => {
    return gridRegularizer(state, states, x, y);
  }, [states]);

  const onPositionChange = useCallback((state: StateProps, result: Position | null | RegularizerAction) => {
    if (!result) return;
    if (result instanceof RegularizerAction) {
      // console.log('get an action');
      const changes = updateStatesByAction(state, states, result);
      onStatesChange(changes);
    } else {
      const newStateProp: StateProps = {...state, position: result, merged: null};
      if (state.merged) {
        return onStatesChange({
          [state.id]: newStateProp, 
          [state.merged]: {...states[state.merged], mergedBy: false}
        });
      } else {
        return onStatesChange({[state.id]: newStateProp}); 
      }
    }
  }, [onStatesChange, states]);

  const onDoubleClick = useCallback((state: StateProps) => {
    if (state.isDummy) return;
    const newStateProp: StateProps = {...state, isAccepting: !state.isAccepting};
    onStatesChange({[state.id]: newStateProp});
    callForUpdate();
  }, [onStatesChange]);

  const downgradeState = useCallback((state: StateProps) => {
    if (!state.isDummy) {
      const newStateProp: StateProps = {...state, isAccepting: false, isDummy: true};
      onStatesChange({[state.id]: newStateProp});
      callForUpdate();
    }
  }, [states, onStatesChange, callForUpdate]);

  const deleteState = useCallback((state: StateProps) => {
    if (!state.isDummy) return;
    let remainingStates: Record<string, StateProps> = {};
    for (const key in states) {
      if (key !== state.id) {
        remainingStates[key] = states[key];
      }
    }
    setSelected(null);
    setStates(remainingStates);
    onStateDeleted(state);
  }, [states]);

  const handleDelete = useCallback((state: StateProps) => {
    if (!selected || selected !== state.id) return;
    if (state.isDummy) {
      deleteState(state);
    } else {
      downgradeState(state);
    }
  }, [selected]);

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
            onClick={onStateClicked}
            onDoubleClick={onDoubleClick}
            onDelete={handleDelete}
            callForUpdate={callForUpdate}
          />
        </div>
      ))}
    </div>
  );
};

export default StateLayer;