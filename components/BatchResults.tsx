import React from 'react';
import { BatchAnalysisResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface BatchResultsProps {
  results: BatchAnalysisResult[];
  onReset: () => void;
}

const BatchResults: React.FC<BatchResultsProps> = ({ results, onReset }) => {
  const total = results.length;
  const aiCount = results.filter(r => r.result.isAI).length;
  const realCount = total - aiCount;
  const aiPercentage = Math.round((aiCount / total) * 100);

  const chartData = [
    { name: 'Synthetic', value: aiCount, color: '#ff2a2a' },
    { name: 'Authentic', value: realCount, color: '#0aff68' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
     const downloadAnchorNode = document.createElement('a');
     downloadAnchorNode.setAttribute("href", dataStr);
     downloadAnchorNode.setAttribute("download", `PIXIVERA_BATCH_REPORT_${new Date().toISOString()}.json`);
     document.body.appendChild(downloadAnchorNode);
     downloadAnchorNode.click();
     downloadAnchorNode.remove();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in-up">
      
      {/* Header - Hidden in Print */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">Batch Analysis Report</h1>
          <p className="text-white/40 font-mono text-sm">PROCESSED {total} ASSETS</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
           <button 
             onClick={handleExportJSON}
             className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-mono tracking-wider transition-colors"
           >
             EXPORT JSON
           </button>
           <button 
             onClick={handlePrint}
             className="px-4 py-2 bg-neon-blue/10 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/20 rounded-lg text-xs font-mono tracking-wider transition-colors flex items-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
             </svg>
             DOWNLOAD PDF REPORT
           </button>
        </div>
      </div>

      {/* Stats Dashboard - Hidden in Print (Simplified Text for Print) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:hidden">
        
        {/* Main Stat */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
           </div>
           <div>
             <h3 className="text-white/50 text-xs font-mono uppercase tracking-widest mb-1">Synthetic Saturation</h3>
             <div className="text-6xl font-light text-white font-mono">{aiPercentage}%</div>
           </div>
           <div className="w-full bg-white/10 h-1 mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-neon-red" style={{ width: `${aiPercentage}%` }}></div>
           </div>
        </div>

        {/* Count Stats */}
        <div className="glass-panel rounded-2xl p-6 flex items-center justify-around">
           <div className="text-center">
              <div className="text-4xl font-bold text-neon-red mb-1">{aiCount}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Detected AI</div>
           </div>
           <div className="h-12 w-px bg-white/10"></div>
           <div className="text-center">
              <div className="text-4xl font-bold text-neon-green mb-1">{realCount}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Authentic</div>
           </div>
        </div>

        {/* Chart */}
        <div className="glass-panel rounded-2xl p-6 flex items-center justify-center relative">
           <div className="w-32 h-32">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   innerRadius={35}
                   outerRadius={50}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '12px' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="ml-6">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-xs text-white/70 font-mono">{d.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Print Header (Visible Only in Print) */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold mb-2">PIXIVERA FORENSIC BATCH REPORT</h1>
        <div className="text-sm mb-4 border-b border-black pb-4">
           <div>Date: {new Date().toLocaleDateString()}</div>
           <div>Total Files: {total}</div>
           <div>Synthetic Detected: {aiCount} ({aiPercentage}%)</div>
           <div>Authentic Detected: {realCount}</div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="glass-panel rounded-2xl p-6 print:border-none print:p-0">
        <h3 className="text-white/40 font-mono text-xs uppercase tracking-widest mb-6 print:hidden">Detailed Asset Analysis</h3>
        
        {/* Table for Print & Screen */}
        <div className="w-full">
            <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] uppercase text-white/30 font-mono mb-4 px-2 print:grid print:text-black border-b border-white/5 pb-2 print:border-black">
               <div className="col-span-1">ID</div>
               <div className="col-span-2">Thumbnail</div>
               <div className="col-span-3">Filename</div>
               <div className="col-span-2">Verdict</div>
               <div className="col-span-1">Score</div>
               <div className="col-span-3">Primary Indicator</div>
            </div>

            <div className="space-y-2">
               {results.map((item, idx) => (
                 <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-2 rounded hover:bg-white/5 transition-colors print:grid-cols-12 print:border-b print:border-gray-200 print:py-2">
                    <div className="hidden md:block col-span-1 font-mono text-xs text-white/50 print:text-black">#{idx + 1}</div>
                    
                    <div className="col-span-2 w-12 h-12 md:w-16 md:h-12 bg-black/50 rounded overflow-hidden flex-shrink-0">
                       <img src={item.thumbnail} className="w-full h-full object-cover" alt="thumb" />
                    </div>
                    
                    <div className="col-span-3 font-mono text-xs truncate print:text-black" title={item.fileName}>
                       {item.fileName}
                    </div>

                    <div className="col-span-2">
                        <span className={`
                          px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border
                          ${item.result.isAI 
                            ? 'bg-neon-red/10 text-neon-red border-neon-red/30 print:border-black print:text-red-700' 
                            : 'bg-neon-green/10 text-neon-green border-neon-green/30 print:border-black print:text-green-700'}
                        `}>
                          {item.result.isAI ? 'SYNTHETIC' : 'AUTHENTIC'}
                        </span>
                    </div>

                    <div className="col-span-1 font-mono text-xs font-bold print:text-black">
                       {item.result.score}/100
                    </div>

                    <div className="col-span-3 text-xs text-white/60 truncate print:text-black">
                       {item.result.modelSignature.name !== 'Unknown' ? `Sig: ${item.result.modelSignature.name}` : item.result.technicalDetails[0]}
                    </div>
                 </div>
               ))}
            </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center print:hidden">
         <button onClick={onReset} className="text-white/40 hover:text-white text-xs font-mono tracking-widest uppercase transition-colors">
            Start New Batch Scan
         </button>
      </div>

    </div>
  );
};

export default BatchResults;