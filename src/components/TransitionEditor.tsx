import React, { useEffect, useState } from "react";
import katex from "katex"
import { TransitionProps } from "./Transition";

interface TransitionEditorProps {
  transition: TransitionProps, 
  onChange: (id: string, newProps: TransitionProps) => void, 
  onClose: () => void, 
}

export const TransitionEditor: React.FC<TransitionEditorProps> = ({transition, onChange}) => {
  const [prop, setProp] = useState<TransitionProps>(transition);

  useEffect(() => {
    setProp(transition);
  }, [transition]);

  const katexHTML = katex.renderToString(prop.label, {
    throwOnError: false,
    displayMode: false,
  });

  return <div className="p-4 rounded-xl bg-white shadow-xl min-w-[25vh]">
    <div className="flex justify-between items-center mb-2 mt-2">
      <h2 className="text-xl font-semibold text-gray-800"> Edit Transition </h2>
      <button type="button" title="Save Changes" onClick={() => onChange(prop.id, prop)} 
        className="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600">
        Save
      </button>
    </div>
    <div className="flex flex-col text-sm gap-3">
      <div className="flex justify-items-stretch gap-2">
        <div className="flex flex-col gap-2">
          Label
          <input type="text" value={prop.label} onChange={(e) => setProp({...prop, label: e.target.value})}/>
        </div>
        <div className="flex flex-col gap-2">
          Preview
          <div dangerouslySetInnerHTML={{__html: katexHTML}}/>
        </div>
      </div>
    </div>
  </div>
}