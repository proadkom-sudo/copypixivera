import { GoogleGenAI, Schema, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const DEFAULT_SYSTEM_INSTRUCTION = `
Role: World-Class Computer Vision & Deepfake Forensic Expert.
Your capability includes detecting specific generative model signatures (Midjourney, DALL-E, Stable Diffusion, Flux, Sora, Runway) and invisible digital watermarks.

Analyze the visual input for synthetic signatures using these advanced criteria:

1. **Model Fingerprinting**:
   - Identify style markers specific to: Midjourney (excessive detail, distinctive lighting), DALL-E (plastic smoothness), Stable Diffusion (texture merging).
   - If Real, look for ISO grain, sensor noise patterns, and lens chromatic aberration.

2. **Digital Watermarks & Signatures**:
   - **C2PA/CAI**: Analyze for presence of content credentials or specific metadata markers often preserved in visual encoding.
   - **SynthID**: Look for the specific invisible noise pattern used by Google DeepMind's SynthID in the high-frequency domain.
   - **OpenAI/Meta**: Look for known invisible watermarking patterns in the pixel noise distribution.

3. **Biometric & Physics Forensics**:
   - **Eyes**: Check for non-circular pupils, inconsistent specular highlights (Purkinje images).
   - **Hands/Limbs**: Count fingers, check joint articulation logic.
   - **Lighting**: Analyze shadow falloff (inverse square law) and reflection mapping.

4. **Region Detection**:
   - Identify specific rectangular regions [ymin, xmin, ymax, xmax] (0-100 scale) where artifacts are visible.

5. **Human Perception Rating**:
   - Evaluate "Realness" (how convincing it is to a casual observer).
   - Evaluate "Suspiciousness" (uncanny valley effect).
   - Evaluate "Perceptual Inconsistency" (subtle things that feel 'off' even if technically correct).
   - Evaluate "Artifact Level" (obvious visual glitches).

6. **Video Analysis (If applicable)**:
   - Check for temporal flickering in high-frequency textures (foliage, hair).
   - Analyze face stability during rotation.

Output strict JSON.
`;

/**
 * OPTIMIZED FOR IOS WEBVIEW
 * Compresses and resizes images to avoid memory limit crashes on iPhones.
 * Converts HEIC/High-Res to standard JPEG 1024px max.
 */
const optimizeImageForMobile = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Define max dimensions for iOS safety (prevent memory crash)
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }

        // Draw and compress to JPEG 0.8 quality
        ctx.drawImage(img, 0, 0, width, height);
        
        // Force JPEG to handle transparency/HEIC conversion issues
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = optimizedDataUrl.split(',')[1];
        
        resolve({
          base64: base64,
          mimeType: 'image/jpeg'
        });
      };
      
      img.onerror = (err) => reject(new Error("Image processing failed: " + err));
    };
    
    reader.onerror = (err) => reject(err);
  });
};

export const analyzeContent = async (
  base64Data: string, 
  mimeType: string
): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        isAI: { type: Type.BOOLEAN, description: "True if Synthetic, False if Real." },
        score: { type: Type.INTEGER, description: "Probability score (0=Real, 100=AI)." },
        verdict: { type: Type.STRING, description: "Short technical verdict (e.g. 'DETECTED: MIDJOURNEY V6 SIGNATURE' or 'REAL: CAMERA SENSOR DATA MATCH')." },
        reasoning: { type: Type.STRING, description: "Detailed forensic explanation of why it is AI or Real." },
        technicalDetails: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of specific artifact descriptions."
        },
        modelSignature: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Likely generator name (e.g. 'Midjourney v6', 'DALL-E 3', 'Real Camera Data')." },
            confidence: { type: Type.INTEGER, description: "Confidence in this specific attribution (0-100)." }
          },
          required: ["name", "confidence"]
        },
        watermark: {
            type: Type.OBJECT,
            properties: {
                detected: { type: Type.BOOLEAN },
                signatures: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            provider: { type: Type.STRING, description: "C2PA, SynthID, OpenAI, etc." },
                            type: { type: Type.STRING, description: "Type of watermark found." },
                            confidence: { type: Type.INTEGER, description: "0-100" }
                        }
                    }
                }
            },
            required: ["detected", "signatures"]
        },
        forensicMetrics: {
          type: Type.OBJECT,
          properties: {
            biometricIntegrity: { type: Type.INTEGER, description: "0-100 (100 = Anatomically perfect)." },
            textureFidelity: { type: Type.INTEGER, description: "0-100 (100 = Natural texture/noise)." },
            lightingConsistency: { type: Type.INTEGER, description: "0-100 (100 = Physically correct lighting)." },
            physicalLogic: { type: Type.INTEGER, description: "0-100 (100 = No physics violations)." }
          },
          required: ["biometricIntegrity", "textureFidelity", "lightingConsistency", "physicalLogic"]
        },
        humanPerception: {
          type: Type.OBJECT,
          properties: {
            realnessScore: { type: Type.INTEGER, description: "0-100 (How real it looks to human eye)." },
            suspiciousnessScore: { type: Type.INTEGER, description: "0-100 (Uncanny valley level)." },
            perceptualInconsistency: { type: Type.INTEGER, description: "0-100 (Cognitive dissonance level)." },
            artifactLevel: { type: Type.INTEGER, description: "0-100 (Visible glitches)." }
          },
          required: ["realnessScore", "suspiciousnessScore", "perceptualInconsistency", "artifactLevel"]
        },
        suspiciousRegions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              box_2d: { 
                type: Type.ARRAY, 
                items: { type: Type.INTEGER },
                description: "[ymin, xmin, ymax, xmax] percentage 0-100." 
              },
              label: { type: Type.STRING, description: "What is wrong here (e.g. 'Mismatched ear')." },
              confidence: { type: Type.INTEGER, description: "0-100" }
            },
            required: ["box_2d", "label", "confidence"]
          }
        },
        videoAnalysis: {
          type: Type.OBJECT,
          description: "Required for VIDEOS. Null for IMAGES.",
          properties: {
            temporalConsistencyScore: { type: Type.INTEGER, description: "0-100 stability score." },
            frameAnomalies: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                },
                required: ["timestamp", "description"]
              }
            }
          },
          nullable: true,
        }
      },
      required: ["isAI", "score", "verdict", "reasoning", "technicalDetails", "modelSignature", "watermark", "forensicMetrics", "humanPerception", "suspiciousRegions"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: "Analyze this media." }
        ]
      },
      config: {
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    return {
      ...data,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error("Analysis Failed:", error);
    throw error;
  }
};

// Replaced simple fileToBase64 with robust Mobile Optimizer
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    // If it's an image, optimize it for iOS WebView (Resize + Compress)
    if (file.type.startsWith('image/')) {
        try {
            const optimized = await optimizeImageForMobile(file);
            // We only return the base64 string to keep compatibility with existing app logic, 
            // but we ensure it's a safe JPEG now.
            resolve(optimized.base64);
        } catch (e) {
            console.warn("Optimization failed, falling back to raw upload", e);
            // Fallback to original logic if canvas fails
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = (error) => reject(error);
        }
    } else {
        // Videos are handled normally (API allows larger payloads for video usually, or handle separately)
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    }
  });
};