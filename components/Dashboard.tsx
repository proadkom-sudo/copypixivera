
import React from 'react';
import { HistoryItem } from '../types';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

interface DashboardProps {
  history: HistoryItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ history }) => {
  // Mock data if history is empty for visualization
  const chartData = history.length > 0 
    ? history.map((h, i) => ({ name: `Scan ${i+1}`, score: h.score }))
    : [
        { name: 'A', score: 20 }, { name: 'B', score: 45 }, { name: 'C', score: 10 }, 
        { name: 'D', score: 90 }, { name: 'E', score: 85 }, { name: 'F', score: 30 }
      ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-10 animate-fade-in">
      <div className="mb-8 md:mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-light mb-2 tracking-tight">Global Pulse</h2>
          <p className="text-white/40 font-mono text-xs">NETWORK ACTIVITY MONITORING</p>
        </div>
        <div className="text-right">
            <div className="text-xl md:text-2xl font-bold font-mono text-neon-blue">{history.length}</div>
            <div className="text-[10px] md:text-xs text-white/30 uppercase tracking-widest">Total Scans</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-panel rounded-2xl md:rounded-3xl p-4 md:p-6 h-48 md:h-64 mb-8 w-full relative overflow-hidden">
        <div className="absolute top-4 left-6 z-10">
          <span className="text-[10px] md:text-xs font-mono text-white/30 bg-black/40 px-2 py-1 rounded">DETECTION CONFIDENCE TREND</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00f3ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff' }} 
              itemStyle={{ color: '#00f3ff' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Area type="monotone" dataKey="score" stroke="#00f3ff" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity List */}
      <h3 className="text-white/40 font-mono text-xs mb-4 uppercase tracking-widest">Recent Analysis Logs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {history.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/30 font-light text-sm">No biological or synthetic signatures detected yet.</p>
          </div>
        ) : (
          history.slice().reverse().map((item) => (
            <div key={item.id} className="glass-panel rounded-xl p-3 md:p-4 flex gap-4 items-center hover:bg-white/5 transition-colors group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-black/50 border border-white/10 flex-shrink-0">
                <img src={item.thumbnail} alt="thumb" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                   <h4 className={`text-xs md:text-sm font-bold truncate ${item.isAI ? 'text-neon-red' : 'text-neon-green'}`}>
                     {item.verdict}
                   </h4>
                   <span className="text-[10px] font-mono text-white/30">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-[10px] md:text-xs text-white/50 truncate font-mono">Score: {item.score}/100</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
