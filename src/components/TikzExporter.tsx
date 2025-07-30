import React, { useState } from "react";
import { AutomataGraph } from "./InfiniteBoard";
import { getTikzFromAutomata, MapOption } from "./tikz";

export const TikzExporter: React.FC<AutomataGraph> = ({states, transitions}) => {
  const [copied, setCopied] = useState(false);
  const [option, setOption] = useState<MapOption>("rearrange");
  const [showOptions, setShowOptions] = useState(false);
  const tikzCode = getTikzFromAutomata(states, transitions, option);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tikzCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const optionPanel = <div className="flex justify-between">
    <text className="text-sm"> Node Labels </text>
    <select
      value={option.toString()}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "identity" || v === "rearrange") setOption(v);
        else setOption(parseInt(v));
      }}
      className="text-sm bg-gray-100"
    >
      <option value="rearrange"> rename </option>
      <option value="identity"> uuid </option>
      <option value="6"> {"uuid(6 digits)"} </option>
    </select>
  </div>

  return (
    <div className="p-4 rounded-xl bg-white shadow-xl max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-2 mt-2">
        <h2 className="text-xl font-semibold text-gray-800">TikZ Code</h2>
        <button onClick={handleCopy} className="text-sm">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-gray-100 text-sm text-gray-800 font-mono p-4 rounded-lg overflow-auto whitespace-pre-wrap max-h-[400px] border">
        {tikzCode}
      </pre>
      <div className="flex justify-between items-center mb-2 mt-2">
        <h2 className="text-xl font-semibold text-gray-800"> Options</h2>
        <button onClick={() => setShowOptions(prev => !prev)} className="text-sm">
          {showOptions ? "Hide" : "Show"}
        </button>
      </div>
      { showOptions && optionPanel}
    </div>
  );
};
