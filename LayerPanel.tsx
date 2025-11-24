import React from 'react';
import { Icons } from './Icons';
import { Layer } from '../types';

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onToggleVisibility
}) => {
  return (
    <div className="w-64 bg-[#131313] border-l border-[#222] flex flex-col h-full z-20 shrink-0">
      <div className="p-4 border-b border-[#222] flex items-center justify-between">
        <span className="font-semibold text-sm text-gray-200 flex items-center gap-2">
          <Icons.Layers size={16} /> Layers
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {[...layers].reverse().map(layer => (
          <div 
            key={layer.id}
            onClick={() => onSelectLayer(layer.id)}
            className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
              selectedLayerId === layer.id 
                ? 'bg-purple-600/20 border-purple-500/50' 
                : 'hover:bg-white/5 border-transparent'
            }`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
              className={`text-gray-400 hover:text-white transition-colors ${layer.visible === false ? 'opacity-50' : ''}`}
            >
              {layer.visible === false ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
            </button>
            
            <div className="w-10 h-10 rounded bg-[#2a2a2a] overflow-hidden border border-white/10 shrink-0 relative">
               <img src={layer.src} className="w-full h-full object-cover" alt="" />
               <div className="absolute inset-0 ring-1 ring-inset ring-black/10"></div>
            </div>
            
            <div className="flex-1 min-w-0">
               <div className={`text-xs font-medium truncate ${selectedLayerId === layer.id ? 'text-purple-200' : 'text-gray-300'}`}>
                 {layer.name}
               </div>
               <div className="text-[10px] text-gray-500 uppercase">{layer.type}</div>
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-500 transition-all"
            >
                <Icons.Trash size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-[#222] bg-[#0f0f0f]">
         <div className="text-[10px] text-gray-500 text-center">
             {layers.length} Layers • {selectedLayerId ? '1 Selected' : 'No Selection'}
         </div>
      </div>
    </div>
  );
};