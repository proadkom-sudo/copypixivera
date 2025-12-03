import React, { useEffect, useState, useRef } from 'react';
import { AnalysisResult, FileData, SuspiciousRegion } from '../types';
import { Cell, Pie, PieChart, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface ResultViewProps {
  result: AnalysisResult;
  fileData: FileData;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, fileData, onReset }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showTemporal, setShowTemporal] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  
  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Check if we actually have a video file to play, or if it's a URL simulation
  const isVideoFile = fileData.mimeType.startsWith('video/');
  const hasVideoAnalysis = !!result.videoAnalysis;
  // Only show temporal playback controls if we have a real video file to scrub
  const canScrubVideo = isVideoFile && hasVideoAnalysis;

  useEffect(() => {
    if (hasVideoAnalysis) {
      setShowTemporal(true);
    }
  }, [hasVideoAnalysis]);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setAnimatedScore(Math.floor(progress * result.score));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [result.score]);

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `VERITAS_ANALYSIS_${result.timestamp.split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handlePrint = () => {
    window.print();
  };
  
  // Radar Chart Data
  const radarData = [
    { subject: 'Biometrics', A: result.forensicMetrics.biometricIntegrity, fullMark: 100 },
    { subject: 'Texture', A: result.forensicMetrics.textureFidelity, fullMark: 100 },
    { subject: 'Lighting', A: result.forensicMetrics.lightingConsistency, fullMark: 100 },
    { subject: 'Physics', A: result.forensicMetrics.physicalLogic, fullMark: 100 },
    { subject: 'Consistency', A: 100 - result.score, fullMark: 100 },
  ];

  // Video Handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && canScrubVideo) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoDuration;
    }
  };

  const jumpToTimestamp = (time: number) => {
    if (videoRef.current && canScrubVideo) {
      videoRef.current.currentTime = time;
      if (videoRef.current.paused) {
         videoRef.current.play();
         setIsPlaying(true);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms}`;
  };

  // Helper for progress bars
  const PerceptionBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="mb-2 group">
      <div className="flex justify-between text-[10px] uppercase font-mono mb-1 tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
        <span className="print:text-black">{label}</span>
        <span className="print:text-black">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden print:border print:border-black/20">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row h-full w-full gap-4 md:gap-6 p-4 md:p-8 max-w-7xl mx-auto animate-fade-in-up print:block print:p-0">
      
      {/* Left Column: Visual & Overlays */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6 print:mb-8 min-w-0">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden glass-panel border-white/10 aspect-square md:aspect-video group shadow-2xl print:border-black print:rounded-none print:shadow-none flex flex-col">
          
          {/* Main Visual Content */}
          <div className="relative w-full h-full bg-black">
            {isVideoFile ? (
              <video 
                ref={videoRef}
                src={fileData.previewUrl} 
                autoPlay 
                loop={!hasVideoAnalysis}
                muted 
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
              />
            ) : (
              <img src={fileData.previewUrl} alt="Analyzed Content" className="w-full h-full object-contain" />
            )}

            {/* Suspicious Region Overlays (Heatmap Proxy) */}
            {showOverlays && result.suspiciousRegions?.map((region, idx) => (
              <div
                key={idx}
                className="absolute border-2 border-neon-red/70 bg-neon-red/10 animate-pulse hover:bg-neon-red/20 transition-colors cursor-help group/region"
                style={{
                  top: `${region.box_2d[0]}%`,
                  left: `${region.box_2d[1]}%`,
                  height: `${region.box_2d[2] - region.box_2d[0]}%`,
                  width: `${region.box_2d[3] - region.box_2d[1]}%`,
                }}
              >
                {/* Tooltip hidden on mobile unless touched, optimized position */}
                <div className="hidden md:block absolute -top-6 left-0 bg-neon-red text-black text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/region:opacity-100 transition-opacity whitespace-nowrap z-20">
                  {region.label} ({region.confidence}%)
                </div>
              </div>
            ))}

            {/* Video Controls / Timeline (Only if we have a real video) */}
            {canScrubVideo && showTemporal && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent flex flex-col justify-end px-4 pb-6 z-30 pointer-events-none">
                <div className="flex justify-between text-[10px] font-mono text-neon-blue mb-2">
                   <span>{formatTime(currentTime)}</span>
                   <span>{formatTime(videoDuration)}</span>
                </div>
                
                <div 
                  className="relative w-full h-8 cursor-pointer group/timeline touch-manipulation pointer-events-auto"
                  onClick={handleTimelineClick}
                >
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 -translate-y-1/2 rounded-full"></div>
                  {result.videoAnalysis?.frameAnomalies.map((anomaly, idx) => {
                     const pos = (anomaly.timestamp / videoDuration) * 100;
                     if (isNaN(pos)) return null;
                     return (
                       <div 
                          key={idx}
                          className="absolute top-1/2 w-1 h-3 bg-neon-red -translate-y-1/2 z-10 transition-all hover:h-6 hover:bg-white"
                          style={{ left: `${Math.min(pos, 99)}%` }}
                       />
                     );
                  })}
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-neon-blue -translate-y-1/2 rounded-full z-0"
                    style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute top-1/2 w-5 h-5 bg-neon-blue rounded-full -translate-y-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(0,243,255,0.8)] z-20 border-2 border-black"
                    style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Header Controls */}
          <div className="absolute top-0 left-0 right-0 p-3 md:p-4 print:hidden pointer-events-none z-30">
             <div className="flex justify-between items-start">
               <div className="flex gap-2 pointer-events-auto">
                 <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] md:text-xs font-mono text-white/50 border border-white/5">
                   {fileData.mimeType.toUpperCase().split('/')[1]}
                 </div>
                 {result.suspiciousRegions?.length > 0 && (
                   <button 
                    onClick={() => setShowOverlays(!showOverlays)}
                    className={`px-2 py-1 rounded text-[10px] md:text-xs font-mono border transition-all ${showOverlays ? 'bg-neon-red/20 border-neon-red/50 text-neon-red' : 'bg-black/40 border-white/10 text-white/50'}`}
                   >
                     {showOverlays ? 'ANOMALIES ON' : 'ANOMALIES OFF'}
                   </button>
                 )}
               </div>
               
               {canScrubVideo && (
                 <div className="pointer-events-auto">
                   <button 
                     onClick={() => setShowTemporal(!showTemporal)}
                     className={`
                       px-3 py-1 rounded-full backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-mono tracking-wider transition-all flex items-center gap-2
                       ${showTemporal ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/50' : 'bg-black/40 text-white/60 hover:text-white'}
                     `}
                   >
                     <span className={`w-1.5 h-1.5 rounded-full ${showTemporal ? 'bg-neon-blue animate-pulse' : 'bg-white/30'}`}></span>
                     {showTemporal ? 'TIMELINE' : 'VIEW'}
                   </button>
                 </div>
              )}
             </div>
          </div>
        </div>

        {/* Verdict Banner - Optimized for mobile width */}
        <div className="glass-panel rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center relative overflow-hidden print:border-0 print:items-start print:p-0">
             <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/20 to-transparent print:hidden"></div>
             
             <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mb-2">
                <h2 className="text-white/40 text-xs font-mono tracking-[0.2em] uppercase print:text-black">
                  Verdict
                </h2>
                {/* Model Signature Badge */}
                {result.modelSignature.name !== 'Unknown' && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${result.isAI ? 'border-neon-purple/50 text-neon-purple bg-neon-purple/10' : 'border-neon-green/50 text-neon-green bg-neon-green/10'}`}>
                    {result.modelSignature.name.toUpperCase()}
                  </span>
                )}
             </div>
             
             <h1 
                className={`text-3xl md:text-5xl font-bold tracking-tight mb-2 text-center ${result.isAI ? 'text-neon-red drop-shadow-[0_0_15px_rgba(255,42,42,0.5)]' : 'text-neon-green drop-shadow-[0_0_15px_rgba(10,255,104,0.5)]'} print:text-black print:drop-shadow-none`}
             >
               {result.verdict}
             </h1>
             <p className="text-white/70 text-xs md:text-sm text-center max-w-2xl font-light leading-relaxed print:text-black print:text-left print:max-w-none">
               {hasVideoAnalysis && showTemporal ? 
                 `Temporal consistency score: ${result.videoAnalysis?.temporalConsistencyScore}/100. ${result.isAI ? 'Frame interpolation artifacts detected.' : 'Motion consistency within natural bounds.'}` 
                 : result.reasoning
               }
             </p>
        </div>

        {/* Digital Integrity / Watermarks Section */}
        {result.watermark && (result.watermark.detected || result.watermark.signatures?.length > 0) && (
            <div className="glass-panel rounded-xl p-4 border border-neon-blue/20 bg-neon-blue/5 print:border-black print:bg-transparent">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse print:hidden"></div>
                    <h3 className="text-neon-blue font-mono text-xs uppercase tracking-widest print:text-black">Digital Integrity Layer</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.watermark.signatures.map((sig, idx) => (
                        <div key={idx} className="bg-black/40 border border-white/10 p-3 rounded flex justify-between items-center print:border-black print:bg-transparent">
                            <div>
                                <div className="text-white text-xs font-bold print:text-black">{sig.provider}</div>
                                <div className="text-white/50 text-[10px] print:text-black">{sig.type}</div>
                            </div>
                            <div className="font-mono text-neon-blue text-xs print:text-black">{sig.confidence}%</div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Right Column: Deep Metrics - Stacks below on mobile */}
      <div className="w-full xl:w-96 flex flex-col gap-4 md:gap-6 print:block">
        
        {/* Main Score & Radar */}
        <div className="glass-panel rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col gap-6 print:border-b print:border-black print:rounded-none print:mb-6">
           <div className="flex justify-between items-end border-b border-white/5 pb-4">
              <div className="flex flex-col">
                  <span className="text-white/40 font-mono text-xs uppercase mb-1 print:text-black">
                    {hasVideoAnalysis ? 'Stability' : 'Synthetic %'}
                  </span>
                  <span className="text-5xl md:text-6xl font-light font-mono text-white tracking-tighter print:text-black">
                    {hasVideoAnalysis ? result.videoAnalysis?.temporalConsistencyScore : animatedScore}<span className="text-2xl opacity-50">%</span>
                  </span>
              </div>
              <div className="text-right">
                  <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Source ID</div>
                  <div className="text-neon-blue font-mono text-xs md:text-sm">{result.modelSignature.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-white/30">{result.modelSignature.confidence}% Conf</div>
              </div>
           </div>

           {/* Radar Chart for Forensic Metrics */}
           <div className="h-40 md:h-48 w-full relative print:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Forensics"
                    dataKey="A"
                    stroke="#00f3ff"
                    strokeWidth={2}
                    fill="#00f3ff"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Human Perception Engine Panel */}
        {result.humanPerception && (
          <div className="glass-panel rounded-xl md:rounded-2xl p-4 md:p-6 print:border-0 print:p-0">
             <h3 className="text-white/60 font-mono text-xs uppercase tracking-wider mb-4 flex items-center gap-2 print:text-black">
               <span className="w-2 h-2 bg-neon-purple rounded-full"></span>
               Perception Engine
             </h3>
             <div className="space-y-1">
               <PerceptionBar label="Realness" value={result.humanPerception.realnessScore} color="bg-neon-green" />
               <PerceptionBar label="Suspiciousness" value={result.humanPerception.suspiciousnessScore} color="bg-neon-red" />
               <PerceptionBar label="Inconsistency" value={result.humanPerception.perceptualInconsistency} color="bg-neon-purple" />
               <PerceptionBar label="Visual Artifacts" value={result.humanPerception.artifactLevel} color="bg-neon-blue" />
             </div>
          </div>
        )}

        {/* Detailed Artifacts List */}
        <div className="glass-panel rounded-xl md:rounded-2xl p-4 md:p-6 flex-1 flex flex-col print:border-0 print:p-0 min-h-[250px] md:min-h-[300px]">
           <h3 className="text-white/60 font-mono text-xs uppercase tracking-wider mb-6 pb-2 border-b border-white/10 print:text-black print:border-black flex justify-between items-center">
             <span>{hasVideoAnalysis ? 'Timeline Anomalies' : 'Detailed Analysis'}</span>
             {hasVideoAnalysis && <span className="text-neon-blue text-[10px] animate-pulse">LIVE SYNC</span>}
           </h3>

           {hasVideoAnalysis && canScrubVideo && result.videoAnalysis ? (
             <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar -mr-2">
                  <ul className="space-y-2">
                    {result.videoAnalysis.frameAnomalies?.length > 0 ? (
                      result.videoAnalysis.frameAnomalies.map((anomaly, idx) => {
                        const isActive = Math.abs(currentTime - anomaly.timestamp) < 1.0;
                        return (
                          <li 
                            key={idx} 
                            onClick={() => jumpToTimestamp(anomaly.timestamp)}
                            className={`
                              cursor-pointer flex items-center gap-3 p-3 rounded-lg border transition-all touch-manipulation
                              ${isActive 
                                ? 'bg-neon-blue/10 border-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.1)]' 
                                : 'bg-white/5 border-transparent hover:border-white/20 hover:bg-white/10'}
                            `}
                          >
                            <div className={`font-mono text-xs px-2 py-1 rounded bg-black/50 ${isActive ? 'text-neon-blue' : 'text-white/50'}`}>
                              {formatTime(anomaly.timestamp)}
                            </div>
                            <span className={`text-xs md:text-sm ${isActive ? 'text-white font-medium' : 'text-white/70'}`}>
                              {anomaly.description}
                            </span>
                          </li>
                        )
                      })
                    ) : (
                      <li className="text-white/40 italic text-xs text-center py-10">No significant temporal anomalies.</li>
                    )}
                  </ul>
                </div>
             </div>
           ) : (
             <ul className="space-y-4">
               {(result.technicalDetails && result.technicalDetails.length > 0) ? result.technicalDetails.map((detail, idx) => (
                 <li key={idx} className="flex items-start gap-3 group">
                   <span className="mt-1.5 w-1.5 h-1.5 rounded-sm bg-white/20 group-hover:bg-neon-blue transition-colors print:bg-black print:group-hover:bg-black flex-shrink-0"></span>
                   <span className="text-white/80 font-light text-xs md:text-sm print:text-black leading-relaxed">{detail}</span>
                 </li>
               )) : (
                 <li className="flex items-start gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-sm bg-white/20 flex-shrink-0"></span>
                    <span className="text-white/60 font-light text-sm italic">{result.reasoning || "No detailed artifacts detected."}</span>
                 </li>
               )}
             </ul>
           )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3 print:hidden mt-auto">
          <div className="flex gap-2">
             <button 
                onClick={handleDownloadJSON}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transform"
                title="Export as JSON"
              >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               JSON
             </button>
             <button 
                onClick={handlePrint}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transform"
                title="Print Report"
              >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
               </svg>
               PDF
             </button>
          </div>
          
          <button 
            onClick={onReset}
            className="flex-1 group relative py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl overflow-hidden transition-all active:scale-95 transform"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="relative font-mono text-sm tracking-widest uppercase text-neon-blue">New Scan</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResultView;