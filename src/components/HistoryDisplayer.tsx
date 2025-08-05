import React from "react";
import { AutomataGraph } from "./InfiniteBoard"

interface HistoryDisplayerProps {
  history: AutomataGraph[];
  head: number;
  setHead?: (_: number) => void, 
}

export const HistoryDisplayer: React.FC<HistoryDisplayerProps> = ({history, head, setHead = () => {}}) => {
  return <div className="p-4 rounded-xl bg-white shadow-xl min-w-[20vw] select-none">
    <h2 className="text-xl font-semibold text-gray-800 mb-2"> History </h2>
    <div className="flex flex-col gap-3 text-sm">
      {
        history.map((graph, index) => (
        <div key={index} 
          className={`flex rounded-lg items-center justify-between border border-1 border-transparent px-3 py-1 ${head == index ? "border-blue-600" : "hover:border-blue-200"}`}
          onClick={() => setHead(index)}
          title={`Switch to ${index}`}
        >
          {index}
          <div className=" text-gray-600 font-mono">
            {graph.log || ""}
          </div>
        </div>))
      }
    </div>
  </div>
}