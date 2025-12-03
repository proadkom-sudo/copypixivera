import React, { useState } from 'react';

const IntegrationCard = ({ 
  icon, 
  name, 
  description, 
  status, 
  onToggle 
}: { 
  icon: React.ReactNode, 
  name: string, 
  description: string, 
  status: 'active' | 'inactive' | 'connecting',
  onToggle: () => void 
}) => (
  <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 group transition-all hover:bg-white/5">
    <div className="flex justify-between items-start">
      <div className="p-3 bg-white/5 rounded-xl text-white group-hover:text-neon-blue transition-colors border border-white/10 group-hover:border-neon-blue/30">
        {icon}
      </div>
      <button 
        onClick={onToggle}
        className={`
          px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase transition-all
          ${status === 'active' 
            ? 'bg-neon-green/10 text-neon-green border border-neon-green/30' 
            : status === 'connecting'
            ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30 animate-pulse'
            : 'bg-white/5 text-white/30 border border-white/10 hover:bg-white/10 hover:text-white'}
        `}
      >
        {status === 'active' ? 'WATCHDOG ACTIVE' : status === 'connecting' ? 'CONNECTING...' : 'CONNECT'}
      </button>
    </div>
    
    <div>
      <h3 className="text-lg font-light mb-1">{name}</h3>
      <p className="text-xs text-white/50 leading-relaxed font-mono">{description}</p>
    </div>

    {status === 'active' && (
       <div className="mt-2 pt-4 border-t border-white/5">
         <div className="flex justify-between items-center text-[10px] text-white/40 font-mono mb-2">
           <span>LAST SCAN</span>
           <span>JUST NOW</span>
         </div>
         <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
           <div className="h-full bg-neon-green w-1/3 animate-pulse"></div>
         </div>
       </div>
    )}
  </div>
);

const Integrations: React.FC = () => {
  const [statuses, setStatuses] = useState<Record<string, 'active' | 'inactive' | 'connecting'>>({
    instagram: 'inactive',
    tiktok: 'inactive',
    youtube: 'inactive',
    telegram: 'active'
  });

  const toggleStatus = (key: string) => {
    if (statuses[key] === 'active') {
      setStatuses(prev => ({ ...prev, [key]: 'inactive' }));
    } else {
      setStatuses(prev => ({ ...prev, [key]: 'connecting' }));
      setTimeout(() => {
        setStatuses(prev => ({ ...prev, [key]: 'active' }));
      }, 2000);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-10 animate-fade-in">
      <div className="mb-12">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Neural Grid</h2>
        <p className="text-white/50 max-w-xl font-light text-sm md:text-base leading-relaxed">
          Connect PIXIVERA to your social streams for autonomous 24/7 deepfake monitoring. 
          The Watchdog Protocol automatically scans new uploads and flags synthetic anomalies.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        
        <IntegrationCard 
          name="Instagram Watchdog" 
          description="Automated scanning of tagged posts and Reels for diffusion artifacts."
          status={statuses.instagram}
          onToggle={() => toggleStatus('instagram')}
          icon={(
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          )} 
        />
        
        <IntegrationCard 
          name="TikTok Sentinel" 
          description="Real-time analysis of viral feed for deepfake content and lip-sync anomalies."
          status={statuses.tiktok}
          onToggle={() => toggleStatus('tiktok')}
          icon={(
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.16c0 2.52-1.12 4.84-2.9 6.24-1.72 1.36-3.96 1.84-6.15 1.31-2.62-.63-4.65-2.71-5.06-5.43-.59-4.06 2.54-7.53 6.36-7.53.05 0 .09.01.14.01v4.06c-.04 0-.09-.01-.13-.01-1.63 0-2.92 1.43-2.69 3.1.2 1.46 1.44 2.53 2.89 2.53 1.45 0 2.62-1.16 2.62-2.62v-16.29h.84z"/></svg>
          )} 
        />
        
        <IntegrationCard 
          name="YouTube Monitor" 
          description="Scan subscribed channels for AI-generated video essays and synthetic avatars."
          status={statuses.youtube}
          onToggle={() => toggleStatus('youtube')}
          icon={(
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
          )} 
        />
      </div>

      {/* Telegram Bot Panel */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 bg-neon-blue/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-neon-blue/20 transition-colors"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-[#229ED9] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,158,217,0.3)]">
               <svg className="w-10 h-10 text-white transform -translate-x-1 translate-y-1" fill="currentColor" viewBox="0 0 24 24"><path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/></svg>
            </div>
            
            <div className="flex-1 text-center md:text-left">
               <h3 className="text-2xl font-bold mb-2">PIXIVERA Telegram Bot</h3>
               <p className="text-white/60 mb-4 font-light text-sm max-w-lg">
                 Add <span className="text-neon-blue font-mono">@PixiveraAI_Bot</span> to any group chat to instantly analyze shared media. Forward images directly to the bot for private forensic reports.
               </p>
               <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
                  <div className="bg-black/40 border border-white/10 rounded px-4 py-2 font-mono text-xs text-white/50 flex items-center gap-4">
                     <span>API KEY:</span>
                     <span className="text-white">PXV-8X92-MMK2-9921</span>
                     <button className="text-neon-blue hover:text-white transition-colors">COPY</button>
                  </div>
                  <button className="px-6 py-2 bg-white text-black font-mono text-xs font-bold tracking-widest rounded hover:bg-neon-blue transition-colors">
                     OPEN TELEGRAM
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Integrations;