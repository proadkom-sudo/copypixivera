export enum ViewState {
  HOME = 'HOME',
  SCANNING = 'SCANNING',
  RESULT = 'RESULT',
  BATCH_PROCESSING = 'BATCH_PROCESSING',
  BATCH_RESULT = 'BATCH_RESULT',
  DASHBOARD = 'DASHBOARD',
  SETTINGS = 'SETTINGS',
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

// iOS Bridge Global Interface
declare global {
  interface Window {
    handleResult: (result: string | any) => void;
    webkit?: {
      messageHandlers: {
        upload: {
          postMessage: (msg: string) => void;
        };
      };
    };
  }
}

export interface FrameAnomaly {
  timestamp: number; // Time in seconds where anomaly occurs
  description: string;
}

export interface SuspiciousRegion {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-100 scale
  label: string;
  confidence: number;
}

export interface ForensicMetrics {
  biometricIntegrity: number; // 0-100 (Higher is more real)
  textureFidelity: number;    // 0-100
  lightingConsistency: number;// 0-100
  physicalLogic: number;      // 0-100
}

export interface HumanPerception {
  realnessScore: number;            // 0-100: How "real" it feels
  suspiciousnessScore: number;      // 0-100: Uncanny valley / suspicious elements
  perceptualInconsistency: number;  // 0-100: Visible cognitive dissonance
  artifactLevel: number;            // 0-100: Visible glitching
}

export interface ModelSignature {
  name: string; // e.g. "Midjourney v6", "Stable Diffusion XL", "DALL-E 3", "N/A"
  confidence: number;
}

export interface WatermarkDetection {
  detected: boolean;
  signatures: {
    provider: string; // e.g. "C2PA", "Google SynthID", "OpenAI", "Meta"
    type: string; // e.g. "Cryptographic Metadata", "Invisible Noise Watermark"
    confidence: number;
  }[];
}

export interface VideoAnalysis {
  temporalConsistencyScore: number; // 0-100 (100 = perfectly stable)
  frameAnomalies: FrameAnomaly[];
}

export interface AnalysisResult {
  isAI: boolean;
  score: number; // 0 to 100 (100 = definitely AI)
  verdict: string;
  reasoning: string;
  technicalDetails: string[];
  
  // Advanced Features
  modelSignature: ModelSignature;
  forensicMetrics: ForensicMetrics;
  humanPerception: HumanPerception;
  suspiciousRegions: SuspiciousRegion[];
  watermark: WatermarkDetection;
  
  videoAnalysis?: VideoAnalysis; // Optional, only for videos
  timestamp: string;
}

export interface BatchAnalysisResult {
  fileName: string;
  result: AnalysisResult;
  thumbnail: string; // Base64 or ObjectURL
}

export interface HistoryItem extends AnalysisResult {
  id: string;
  thumbnail: string;
}

export interface FileData {
  file: File | null; // Nullable for URL based scans
  previewUrl: string;
  mimeType: string;
  base64: string;
  sourceUrl?: string;
}