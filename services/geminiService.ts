
import { GoogleGenAI, Modality } from "@google/genai";
import { UserTier, GroundingSource, VideoClip } from "../types";
import { TIER_CONFIG } from "../constants";

export class GeminiService {
  private static getClient() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found. Please select a production key.");
    }
    return new GoogleGenAI({ apiKey });
  }

  static async generateInitialClip(params: {
    prompt: string;
    tier: UserTier;
    image?: string;
    grounding?: boolean;
    onProgress?: (msg: string) => void;
  }): Promise<{ 
    clip: VideoClip;
    enhancedPrompt?: string; 
    groundingSources?: GroundingSource[];
  }> {
    const ai = this.getClient();
    const config = TIER_CONFIG[params.tier];
    let finalPrompt = params.prompt;
    let sources: GroundingSource[] = [];

    try {
      if (params.grounding) {
        params.onProgress?.("FACT_CHECKING_VISUALS");
        const groundResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Analyze and enhance this cinematic prompt for historical/scientific accuracy: "${params.prompt}". Return the updated prompt only.`,
          config: { tools: [{ googleSearch: {} }] }
        });
        
        finalPrompt = groundResponse.text || params.prompt;
        const chunks = groundResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          sources = chunks
            .filter((c: any) => c.web)
            .map((c: any) => ({
              title: c.web.title || "Reference",
              uri: c.web.uri
            }));
        }
      }

      params.onProgress?.("INITIALIZING_VEO_PIPELINE");
      
      const generationParams: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: finalPrompt,
        config: {
          numberOfVideos: 1,
          resolution: config.resolution,
          aspectRatio: '16:9'
        }
      };

      if (params.image) {
        generationParams.image = {
          imageBytes: params.image.split(',')[1],
          mimeType: 'image/png'
        };
      }

      let operation = await ai.models.generateVideos(generationParams);
      
      while (!operation.done) {
        params.onProgress?.("SYNTHESIZING_VEO_FRAMES");
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const videoObject = operation.response?.generatedVideos?.[0]?.video;
      if (!videoObject?.uri) throw new Error("GEN_STREAM_EMPTY");

      const downloadLink = videoObject.uri;
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error("DOWNLOAD_LINK_EXPIRED");
      
      const blob = await response.blob();
      const clip: VideoClip = {
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(blob),
        prompt: finalPrompt,
        duration: 5, // Fast render is typically 5s
        apiObject: videoObject,
        timestamp: Date.now()
      };

      return {
        clip,
        enhancedPrompt: params.grounding ? finalPrompt : undefined,
        groundingSources: sources
      };

    } catch (error: any) {
      if (error?.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_RESET_REQUIRED");
      }
      throw error;
    }
  }

  static async extendClip(params: {
    prompt: string;
    lastClip: VideoClip;
    onProgress?: (msg: string) => void;
  }): Promise<VideoClip> {
    const ai = this.getClient();
    try {
      params.onProgress?.("EXTENDING_TEMPORAL_HORIZON");
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: params.prompt,
        video: params.lastClip.apiObject,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        params.onProgress?.("APPENDING_VEO_LATENTS");
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const videoObject = operation.response?.generatedVideos?.[0]?.video;
      if (!videoObject?.uri) throw new Error("EXTENSION_FAILED");
      
      const response = await fetch(`${videoObject.uri}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(blob),
        prompt: params.prompt,
        duration: 7, // Extension is usually 7s
        apiObject: videoObject,
        timestamp: Date.now()
      };
    } catch (error) {
      throw error;
    }
  }

  static async synthesizeAudio(params: {
    prompt: string;
    voiceName: string;
  }): Promise<string> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: params.prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: params.voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("SONIC_LAYER_NULL");

    return this.pcmToWavUrl(base64Audio);
  }

  private static pcmToWavUrl(base64Pcm: string): string {
    const binary = atob(base64Pcm);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    view.setUint32(0, 0x52494646, false); 
    view.setUint32(4, 36 + len, true);
    view.setUint32(8, 0x57415645, false); 
    view.setUint32(12, 0x666d7420, false); 
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); 
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    view.setUint32(36, 0x64617461, false); 
    view.setUint32(40, len, true);
    const blob = new Blob([header, bytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }
}
