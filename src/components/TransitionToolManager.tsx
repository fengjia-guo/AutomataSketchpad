import React, { useRef, useState } from "react";
import { isToolValid, TransitionTool } from "./transitionTool";

interface TransitionToolManagerProps {
  tools: TransitionTool[];
  currentToolID: number;
  setCurrentToolID: (id: number) => void;
  importTool: (newTool: TransitionTool) => void;
}

export const TransitionToolManager: React.FC<TransitionToolManagerProps> = ({
  tools,
  currentToolID,
  setCurrentToolID,
  importTool,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.name || typeof parsed.name !== "string") {
          throw new Error("Invalid tool: missing 'name' field.");
        } 
        if (!parsed.stateCount || typeof parsed.stateCount !== "number") {
          throw new Error("Invalid tool: missing 'stateCount' field.");
        }
        if (!parsed.edges) {
          throw new Error("Invalid tool: missing 'edges' field.");
        }
        if (isToolValid(parsed)) {
          importTool(parsed);
          setErrorMessage(null);
        } else {
          throw new Error("Invalid tool.");
        }
      } catch (err: any) {
        setErrorMessage("Invalid JSON format: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col p-4 rounded-xl bg-white shadow-xl max-w-3xl gap-4">
      <div className="flex justify-between items-center gap-4">
        <h2 className="font-bold text-xl"> Transition Tools </h2>
        <div className="flex justify-center">
          <button
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>
      <div className="flex flex-col flex-wrap gap-2">
        {tools.map((tool, index) => (
          <div
            key={index}
            className={`text-sm px-3 py-1 cursor-pointer rounded-lg border 
              ${currentToolID === index ? "border-blue-500" : "border-transparent hover:border-gray-300"}
            `}
            onClick={() => setCurrentToolID(index)}
          >
            {tool.name}
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
