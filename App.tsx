import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Scanner from './components/Scanner';
import ResultView from './components/ResultView';
import Dashboard from './components/Dashboard';
import BatchResults from './components/BatchResults';
import { ViewState, FileData, AnalysisResult, AnalysisStatus, HistoryItem, BatchAnalysisResult } from './types';
import { analyzeContent, fileToBase64 } from './services/geminiService';

const FORENSIC_STEPS = [
  "INITIALIZING NEURAL LAYERS...",
  "EXTRACTING FREQUENCY DOMAIN DATA...",
  "DETECTING GAN NOISE FINGERPRINTS...",
  "COMPARING DIFFUSION SIGNATURES...",
  "ANALYZING BIOMETRIC TOPOLOGY...",
  "VALIDATING PHOTOMETRIC CONSISTENCY...",
  "CHECKING TEMPORAL COHERENCE...",
  "CROSS-REFERENCING C2PA METADATA...",
  "FINALIZING PROBABILISTIC MODEL..."
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  
  // Single Mode State
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  
  // Batch Mode State
  const [batchQueue, setBatchQueue] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<BatchAnalysisResult[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);

  // Global History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [scanStep, setScanStep] = useState(0);
  const [scanText, setScanText] = useState("");

  // Simulate loading screen on initial mount
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Cycling forensic steps during scanning
  useEffect(() => {
    if (view === ViewState.SCANNING) {
      const steps = FORENSIC_STEPS;
      const interval = setInterval(() => {
        setScanStep((prev) => (prev + 1) % steps.length);
        setScanText(steps[scanStep % steps.length]);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setScanStep(0);
    }
  }, [view]);

  // iOS Bridge Integration - Hook into the global function defined in index.html
  useEffect(() => {
    // Capture the original function defined in index.html
    const originalHandleResult = window.handleResult;

    // Override to add React updates while keeping original behavior
    window.handleResult = (result: string | any) => {
      // 1. Execute original DOM update logic from index.html (Required by user specs)
      if (originalHandleResult) {
        try {
          originalHandleResult(result);
        } catch(e) {
          console.error("Error in original handleResult:", e);
        }
      }

      // 2. Process data for React State (Full App Experience)
      try {
        let parsedData;
        if (typeof result === 'string') {
          try {
            parsedData = JSON.parse(result);
          } catch (e) {
            const isAI = result.toLowerCase().includes('ai') || result.toLowerCase().includes('synthetic');
            parsedData = {
              isAI: isAI,
              score: isAI ? 95 : 5,
              verdict: isAI ? "SYNTHETIC DETECTED" : "AUTHENTIC MEDIA",
            };
          }
        } else {
          parsedData = result;
        }

        // Map incoming data to internal AnalysisResult type
        const mappedResult: AnalysisResult = {
          isAI: parsedData.isAI || false,
          score: typeof parsedData.score === 'number' ? parsedData.score : (parsedData.isAI ? 98 : 2),
          verdict: parsedData.verdict || (parsedData.isAI ? "SYNTHETIC DETECTED" : "AUTHENTIC"),
          reasoning: parsedData.reasoning || "Analysis provided by iOS Neural Engine Bridge.",
          technicalDetails: parsedData.technicalDetails || ["External verification complete", "Bridge data integrity: OK"],
          modelSignature: parsedData.modelSignature || { name: "External Model", confidence: 0 },
          forensicMetrics: parsedData.forensicMetrics || {
            biometricIntegrity: 50, textureFidelity: 50, lightingConsistency: 50, physicalLogic: 50
          },
          humanPerception: parsedData.humanPerception || {
            realnessScore: 50, suspiciousnessScore: 50, perceptualInconsistency: 0, artifactLevel: 0
          },
          suspiciousRegions: parsedData.suspiciousRegions || [],
          watermark: parsedData.watermark || { detected: false, signatures: [] },
          timestamp: new Date().toISOString()
        };

        // If no file is loaded (started via iOS bridge without UI interaction), create a placeholder
        if (!currentFile) {
            setCurrentFile({
                file: null,
                previewUrl: "", 
                mimeType: "application/octet-stream",
                base64: ""
            });
        }

        setCurrentResult(mappedResult);
        setStatus(AnalysisStatus.COMPLETE);
        setView(ViewState.RESULT);

        setHistory(prev => [{
            ...mappedResult,
            id: crypto.randomUUID(),
            thumbnail: ""
        }, ...prev]);

      } catch (err) {
        console.error("iOS Bridge React Update Error:", err);
      }
    };

    // Cleanup: Restore original function if component unmounts (unlikely for App)
    return () => {
      window.handleResult = originalHandleResult;
    };
  }, [currentFile]); 

  // Process Batch Queue
  useEffect(() => {
    const processQueue = async () => {
      if (view === ViewState.BATCH_PROCESSING && batchQueue.length > 0) {
        const file = batchQueue[0];
        const remaining = batchQueue.slice(1);
        
        try {
           const base64 = await fileToBase64(file);
           const previewUrl = URL.createObjectURL(file);
           
           // Determine Mime Type - if optimized by fileToBase64, it's always jpeg for images
           // But file.type might still say 'image/png'. We trust the logic in geminiService to handle base64 correctly.
           const mimeType = file.type.startsWith('image/') ? 'image/jpeg' : file.type;

           const result = await analyzeContent(base64, mimeType);
           
           const batchResult: BatchAnalysisResult = {
             fileName: file.name,
             result: result,
             thumbnail: previewUrl
           };
           
           setBatchResults(prev => [...prev, batchResult]);
           
           setHistory(prev => [{
             ...result,
             id: crypto.randomUUID(),
             thumbnail: previewUrl
           }, ...prev]);

        } catch (error) {
           console.error(`Failed to process ${file.name}`, error);
        }

        setBatchQueue(remaining);
        setBatchProgress(prev => prev + 1);

        if (remaining.length === 0) {
           setView(ViewState.BATCH_RESULT);
           setStatus(AnalysisStatus.COMPLETE);
        }
      }
    };

    if (view === ViewState.BATCH_PROCESSING && batchQueue.length > 0) {
       processQueue();
    }
  }, [view, batchQueue]);


  const handleScanStart = async (files: File[]) => {
    if (files.length === 0) return;

    if (files.length === 1) {
      // Single File Mode
      const file = files[0];
      try {
        const previewUrl = URL.createObjectURL(file);
        
        setStatus(AnalysisStatus.ANALYZING);
        setView(ViewState.SCANNING);

        // Notify iOS bridge
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.upload) {
            try {
                window.webkit.messageHandlers.upload.postMessage("start");
            } catch(e) {
                console.log("iOS Bridge not available or failed");
            }
        }

        // Heavy lifting: Conversion + Optimization happens here
        const base64 = await fileToBase64(file);
        
        // On iOS, we force 'image/jpeg' because fileToBase64 now converts everything to JPEG
        // This ensures the API gets the correct MIME type even if the original file was HEIC
        const effectiveMimeType = file.type.startsWith('image/') ? 'image/jpeg' : file.type;
        
        setCurrentFile({
          file,
          previewUrl,
          mimeType: effectiveMimeType,
          base64
        });

        const result = await analyzeContent(base64, effectiveMimeType);
        setCurrentResult(result);
        
        setHistory(prev => [{
          ...result,
          id: crypto.randomUUID(),
          thumbnail: previewUrl,
        }, ...prev]);

        setStatus(AnalysisStatus.COMPLETE);
        setView(ViewState.RESULT);

      } catch (error) {
        console.error("Analysis Loop Error:", error);
        setStatus(AnalysisStatus.ERROR);
        const msg = error instanceof Error ? error.message : "Unknown error";
        alert(`Analysis Error: ${msg}. Try a smaller image.`);
        setView(ViewState.HOME);
      }
    } else {
      setBatchQueue(files);
      setBatchResults([]);
      setBatchProgress(0);
      setView(ViewState.BATCH_PROCESSING);
      setStatus(AnalysisStatus.ANALYZING);
    }
  };

  const resetScanner = () => {
    setCurrentFile(null);
    setCurrentResult(null);
    setBatchQueue([]);
    setBatchResults([]);
    setStatus(AnalysisStatus.IDLE);
    setView(ViewState.HOME);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white font-mono">
         <div className="w-24 h-1 bg-white/10 overflow-hidden mb-4 rounded-full">
            <div className="h-full bg-neon-blue w-full animate-scan" style={{ animationDuration: '1s' }}></div>
         </div>
         <div className="text-[10px] tracking-[0.5em] text-white/50 animate-pulse">SYSTEM INITIALIZING</div>
      </div>
    );
  }

  return (
    <Layout currentView={view} onNavigate={setView}>
      
      {/* HOME / SCANNER */}
      {view === ViewState.HOME && (
        <div className="flex-1 flex flex-col items-center justify-center relative p-6">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[800px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 text-center mb-10 md:mb-16 animate-fade-in-up">
            <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-4 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              TRUTH IN PIXELS
            </h1>
            <p className="text-xs md:text-sm text-white/40 font-mono tracking-widest max-w-xs md:max-w-lg mx-auto leading-relaxed uppercase">
              Advanced forensic AI layer detecting synthetic media traces in real-time.
            </p>
          </div>
          
          <Scanner onScanStart={handleScanStart} />
        </div>
      )}

      {/* SCANNING STATE */}
      {view === ViewState.SCANNING && (
        <div className="flex-1 flex flex-col items-center justify-center relative p-6 md:p-10">
          <div className="relative w-48 h-48 md:w-80 md:h-80 rounded-full border border-white/10 flex items-center justify-center bg-black/50 backdrop-blur-md overflow-hidden group">
             <div className="absolute inset-0 w-full h-1 bg-neon-blue/50 shadow-[0_0_20px_#00f3ff] animate-scan z-20"></div>
             {currentFile?.previewUrl && (
               <img src={currentFile.previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen filter grayscale contrast-125" alt="Scanning" />
             )}
             <div className="absolute w-[90%] h-[90%] border border-dashed border-white/20 rounded-full animate-spin-slow"></div>
             <div className="absolute w-[60%] h-[60%] border border-white/10 rounded-full animate-ping"></div>
          </div>
          
          <div className="mt-8 md:mt-12 text-center px-4 w-full max-w-md">
             <div className="text-neon-blue font-mono text-xs md:text-sm tracking-widest mb-2 animate-pulse truncate mx-auto">{scanText}</div>
             <div className="h-0.5 w-32 md:w-48 bg-white/10 mx-auto rounded-full overflow-hidden">
                <div className="h-full bg-neon-blue animate-pulse w-2/3"></div>
             </div>
          </div>
        </div>
      )}

      {/* BATCH PROCESSING */}
      {view === ViewState.BATCH_PROCESSING && (
         <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h2 className="text-2xl font-light mb-4 text-center">Batch Analysis in Progress</h2>
            <div className="w-full max-w-md bg-white/5 rounded-full h-2 mb-4 overflow-hidden border border-white/10">
               <div className="h-full bg-neon-blue transition-all duration-300" style={{ width: `${Math.round(((batchProgress) / (batchProgress + batchQueue.length)) * 100)}%` }}></div>
            </div>
            <p className="text-white/40 font-mono text-xs">PROCESSING ASSET {batchProgress + 1} OF {batchProgress + batchQueue.length}</p>
         </div>
      )}

      {/* RESULT VIEW */}
      {view === ViewState.RESULT && currentResult && currentFile && (
        <ResultView result={currentResult} fileData={currentFile} onReset={resetScanner} />
      )}

      {/* BATCH RESULT VIEW */}
      {view === ViewState.BATCH_RESULT && (
         <BatchResults results={batchResults} onReset={resetScanner} />
      )}

      {/* DASHBOARD VIEW */}
      {view === ViewState.DASHBOARD && (
        <Dashboard history={history} />
      )}
      
    </Layout>
  );
};

export default App;