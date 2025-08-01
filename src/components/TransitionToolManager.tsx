import React, { useRef, useState } from "react";
import { isToolValid, TransitionTool } from "./transitionTool";

interface TransitionToolManagerProps {
  tools: TransitionTool[];
  currentToolID: number;
  setCurrentToolID: (id: number) => void;
  importTool: (newTool: TransitionTool) => void;
  importTools: (newTools: TransitionTool[]) => void;
}

const exampleTool: TransitionTool = {
  name: "loop", 
  stateCount: 1, 
  edges: [{from: 0, to: 0}]
}

export const TransitionToolManager: React.FC<TransitionToolManagerProps> = ({
  tools,
  currentToolID,
  setCurrentToolID,
  importTool,
  importTools, 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
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

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: TransitionTool[] = JSON.parse(reader.result as string);
        for (var i = 0; i < parsed.length; i++) {
          if (!isToolValid(parsed[i])) {
            throw new Error(`Invalid tool at index ${i} (starting from 0)`);
          }
        }
        importTools(parsed);
      } catch (err: any) {
        setErrorMessage("Invalid JSON format: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const instruction = <div className="text-sm text-gray-500">
    <center className="text-lg font-bold mb-2"> Upload Your First Transition Tool </center>
    <div className="max-w-[25vw] mb-2">
      {"Transition Tools create transitions between a finite number of states. Please upload a JSON file like the following example, where the state index in \"edges\" field starts from 0. "}
    </div>
    <pre className="bg-gray-100 text-sm text-gray-800 font-mono p-4 rounded-lg overflow-auto whitespace-pre-wrap max-h-[400px] border mb-2">
      {JSON.stringify(exampleTool, null, 2)}
    </pre>
    <div className="max-w-[25vw]">
      {"You may also click the \"Upload in Batch\" button to upload a list of tools with a JSON array of elements in the format above. "}
    </div>
  </div>

  return (
    <div className="flex flex-col p-4 rounded-xl bg-white shadow-xl min-w-3xl gap-4">
      <div className="flex justify-between items-center gap-4">
        <h2 className="font-bold text-xl"> Transition Tools </h2>
        <div className="flex gap-3 justify-between items-center">
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
          <div className="flex justify-center">
            <button
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
              onClick={() => batchInputRef.current?.click()}
            >
              Upload in Batch
            </button>
            <input
              ref={batchInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleBatchUpload}
            />
          </div>
        </div>
      </div>
      { tools.length == 0 && instruction }
      <div className="flex flex-col flex-wrap gap-2 max-h-[50vh] overflow-auto">
        {tools.map((tool, index) => (
          <div key={index}>
            <div 
              className={`flex justify-between items-center text-sm px-3 py-1 cursor-pointer rounded-lg border 
                ${currentToolID === index ? "border-blue-500" : "border-transparent hover:border-gray-300"}
              `}
              onClick={() => setCurrentToolID(index)}
            >
              {tool.name}
              <div> {tool.stateCount} states </div>
            </div>
            { (currentToolID == index) && <div>
              <pre className="bg-gray-100 text-sm text-gray-800 font-mono p-4 rounded-lg overflow-auto whitespace-pre-wrap max-h-[400px] border">
                {JSON.stringify(tool, null, 2)}
              </pre>
            </div>
            }
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
