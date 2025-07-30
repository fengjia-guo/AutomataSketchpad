import React, { useState } from "react";
import { AutomataGraph } from "./InfiniteBoard";
import { getTikzFromAutomata } from "./tikz";

export const TikzExporter: React.FC<AutomataGraph> = ({states, transitions}) => {
  const [copied, setCopied] = useState(false);
  const tikzCode = getTikzFromAutomata(states, transitions);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tikzCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-4 rounded-xl bg-gray-100 border border-gray-300 shadow-sm max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-gray-800">TikZ Code</h2>
        <button onClick={handleCopy} className="text-sm">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <pre className="bg-white text-sm text-gray-800 font-mono p-4 rounded-lg overflow-auto whitespace-pre-wrap max-h-[400px] border">
        {tikzCode}
      </pre>
    </div>
  );
};
