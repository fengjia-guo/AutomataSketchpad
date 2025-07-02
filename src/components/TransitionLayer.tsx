import React from "react"
import { BoardObjectProps } from "./GridLayer"
import { StateProps } from "./State"
import { Transition, TransitionProps } from "./Transition"

export interface TransitionLayerProps {
	transitions: Record<string, TransitionProps>, 	
	selected: null | string, 
	boardProps: BoardObjectProps, 
	getState: (id: string) => StateProps | null, 
	onClick?: (transition: TransitionProps) => void, 
	onDelete?: (transition: TransitionProps) => void, 
}

export const TransitionLayer: React.FC<TransitionLayerProps> = ({
	transitions, 
	selected, 
	boardProps, 
	getState, 
	onClick = () => {}, 
	onDelete = () => {}, 
}) => {
	return <div>
		{
			Object.keys(transitions).map((id, index) => {
				return <div key={index}>
					<Transition 
						transition={transitions[id]}
						selected={selected}
						boardProps={boardProps}
						getState={getState}
						onClick={onClick}
						onDelete={onDelete}
					/>
				</div>	
			})
		}
	</div>
}