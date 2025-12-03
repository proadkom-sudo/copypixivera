import React, { useRef, useState } from 'react';

interface ScannerProps {
  onScanStart: (files: File[]) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanStart }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    const files = Array.from(fileList);
    setPreviewFiles(files);
    
    // Slight delay to show the interaction before triggering processing
    setTimeout(() => {
        onScanStart(files);
    }, 800);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 md:p-6 animate-fade-in">
      
      <div 
        className={`
          relative w-full aspect-square md:aspect-video rounded-3xl 
          border border-dashed transition-all duration-500 overflow-hidden
          flex flex-col items-center justify-center group touch-manipulation cursor-pointer
          ${isDragging 
            ? 'border-neon-blue bg-neon-blue/5 shadow-[0_0_50px_rgba(0,243,255,0.2)]' 
            : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleClick}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {previewFiles.length > 0 ? (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-8">
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-4 opacity-50">
                {previewFiles.slice(0, 9).map((f, i) => (
                    <div key={i} className="aspect-square bg-white/10 rounded overflow-hidden">
                      <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                    </div>
                ))}
            </div>
            <div className="text-neon-blue font-mono text-xl animate-pulse">
                INITIALIZING...
            </div>
            <div className="text-white/50 text-xs mt-2 font-mono">
                {previewFiles.length} FILES QUEUED
            </div>
            <div className="absolute inset-0 bg-scan animate-scan opacity-30 bg-gradient-to-b from-transparent via-neon-blue/50 to-transparent h-[20%] pointer-events-none" />
          </div>
        ) : (
          <div className="text-center p-8 transition-transform duration-300 group-hover:scale-105">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6 group-hover:border-neon-blue/50 group-hover:shadow-[0_0_20px_rgba(0,243,255,0.2)] transition-all bg-black/20">
              <svg className="w-6 h-6 text-white/70 group-hover:text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-light tracking-wide mb-2">Upload Visual Data</h3>
            <p className="text-xs text-white/40 font-mono mb-4 hidden md:block">DRAG & DROP OR CLICK TO BROWSE</p>
            <div className="md:hidden px-6 py-3 bg-white/10 rounded-full text-xs font-mono tracking-widest text-white/90 border border-white/10">
                TAP TO SELECT
            </div>
          </div>
        )}
        
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/20 rounded-tl-2xl transition-colors group-hover:border-neon-blue pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/20 rounded-tr-2xl transition-colors group-hover:border-neon-blue pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-white/20 rounded-bl-2xl transition-colors group-hover:border-neon-blue pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/20 rounded-br-2xl transition-colors group-hover:border-neon-blue pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Scanner;