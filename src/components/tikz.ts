import { StateProps } from "./State";
import { TransitionProps } from "./Transition";

export type MapOption = number | "identity" | "rearrange";

export const getTikzStateType = (prop: StateProps) => {
  return prop.isAccepting ? `state, accepting` : `state`
}

export const getIDMap = (states: Record<string, StateProps>, option: MapOption) => {
  let mapping: Record<string, string> = {};
  let i = 0;
  for (const key in states) {
    if (option === "identity") {
      mapping[key] = key;
    } else if (option === "rearrange") {
      mapping[key] = `q${i}`;
      i += 1;
    } else {
      mapping[key] = key.slice(0, Math.round(option));
    }
  }
  return mapping;
}

export const getTikzStateString = (prop: StateProps, mapping: Record<string, string>, scale: number = 1) => {
  return `\\node[${getTikzStateType(prop)}] (${mapping[prop.id]}) at (${prop.position.x * scale}, ${-prop.position.y * scale}) {$ ${prop.label} $};\n`;
}

export const getTikzNodes = (states: Record<string, StateProps>, mapping: Record<string, string>, scale: number = 1) => {
  let nodes = "";
  for (const key in states) {
    nodes += getTikzStateString(states[key], mapping, scale);
  }
  return nodes;
}

export const getTikzTransitionString = (prop: TransitionProps, mapping: Record<string, string>) => {
  if (prop.fromID === prop.toID) {
    return `(${mapping[prop.fromID]}) edge[loop above] node {$ ${prop.label} $} ()`;
  } else {
    return `(${mapping[prop.fromID]}) edge node {$ ${prop.label} $} (${mapping[prop.toID]})`
  }
}

export const getTikzPaths = (transitions: Record<string, TransitionProps>, mapping: Record<string, string>) => {
  let paths = "\\path[->]";
  for (const key in transitions) {
    paths += "\n";
    const prop = transitions[key];
    const tikzString = getTikzTransitionString(prop, mapping);
    paths += tikzString;
  }
  paths += ";\n";
  return paths;
}

export const getTikzFromAutomata = (states: Record<string, StateProps>, transitions: Record<string, TransitionProps>, option: MapOption = "rearrange", scale: number = 1) => {
  const mapping = getIDMap(states, option);
  const header = "\\begin{tikzpicture}[shorten >=1pt, node distance=5cm, on grid, auto]\n";
  const footer = "\\end{tikzpicture}";
  return header + getTikzNodes(states, mapping, scale) + getTikzPaths(transitions, mapping) + footer;
}