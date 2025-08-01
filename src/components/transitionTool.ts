export type TransitionEdge = {fromID: string, toID: string}
export type Edge = {from: number, to: number}
export type TransitionTool = {
  name: string, 
  stateCount: number, 
  edges: Edge[]
}

export const isToolValid = (tool: TransitionTool) => {
  return Number.isInteger(tool.stateCount) && tool.stateCount > 0 && 
    tool.edges.every(edge => (
      Number.isInteger(edge.from) && edge.from >= 0 && edge.from < tool.stateCount && 
      Number.isInteger(edge.to) && edge.to >= 0 && edge.to < tool.stateCount
    ));
}

export const applyTool = (tool: TransitionTool, params: string[]) => {
  if (!isToolValid(tool)) return "invalid";
  if (tool.stateCount !== params.length) return "mismatch";
  return tool.edges.map((edge) => ({fromID: params[edge.from], toID: params[edge.to]} as TransitionEdge));
}
