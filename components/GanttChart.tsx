import React, { useRef, useEffect } from 'react';
import { GanttBlock } from '../types';

interface GanttChartProps {
  data: GanttBlock[];
  totalTime: number;
}

const GanttChart: React.FC<GanttChartProps> = ({ data, totalTime }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to right
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [data]);

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 shadow-xl relative flex-shrink-0">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">CPU Operations Log</h3>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <span className="w-2.5 h-2.5 bg-[#1e293b] border border-slate-600 rounded-sm relative overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#fff,#fff_2px,transparent_2px,transparent_4px)]"></div>
            </span> IDLE
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm ml-2"></span> BUSY
        </div>
      </div>
      
      <div className="relative w-full bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden">
        {/* Ruler Background */}
        <div className="absolute inset-0 pointer-events-none z-0 flex" style={{ backgroundSize: '40px 100%' }}>
             {/* This would need dynamic generation for perfect alignment, approximating with grid for now */}
        </div>

        <div 
          ref={containerRef}
          className="relative w-full overflow-x-auto pb-1 hide-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex h-16 min-w-full relative">
            {data.map((block, idx) => {
              const duration = block.endTime - block.startTime;
              const isIdle = block.processId === 'IDLE';
              const width = duration * 40; // 40px per tick
              
              return (
                <div
                  key={idx}
                  className="flex-shrink-0 h-full relative group border-r border-slate-900/10"
                  style={{ width: `${width}px` }}
                >
                  {/* The Block Itself */}
                  <div 
                    className={`w-full h-8 mt-2 flex items-center justify-center text-xs font-bold transition-all duration-300 border-y 
                        ${isIdle ? 'border-slate-700/50 bg-slate-800/30' : 'border-white/5 shadow-lg'}`}
                    style={{ 
                        backgroundColor: isIdle ? undefined : block.color,
                        backgroundImage: isIdle ? `repeating-linear-gradient(
                            45deg,
                            rgba(148, 163, 184, 0.1),
                            rgba(148, 163, 184, 0.1) 5px,
                            transparent 5px,
                            transparent 10px
                          )` : undefined
                    }}
                  >
                    <span className={`z-10 drop-shadow-sm tracking-wider ${isIdle ? 'text-slate-500 font-mono text-[10px]' : 'text-white'}`}>
                        {isIdle ? 'IDLE' : block.processId}
                    </span>
                  </div>

                  {/* Ruler Markers */}
                  <div className="absolute bottom-0 w-full h-4 border-t border-slate-800 flex justify-between items-end px-0.5">
                        <div className="h-1 w-px bg-slate-700"></div>
                        {duration > 1 && <div className="h-0.5 w-px bg-slate-800"></div>} 
                        <div className="h-1 w-px bg-slate-700"></div>
                  </div>

                  {/* Tooltip / Labels */}
                  <span className="absolute bottom-0.5 left-0.5 text-[8px] font-mono text-slate-500 leading-none">
                    {block.startTime}
                  </span>
                  {idx === data.length - 1 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono text-slate-500 leading-none">
                        {block.endTime}
                      </span>
                  )}
                </div>
              );
            })}
             
             {/* Empty state filler */}
             {data.length === 0 && (
                 <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs italic">
                     Waiting for simulation start...
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;