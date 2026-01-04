import { GoogleGenAI, Modality } from "@google/genai";
import { UserTier } from "../types";
import { TIER_CONFIG } from "../constants";

export class GeminiService {
  private static async getClient() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found. Please ensure you are in the AI Studio environment.");
    }
    return new GoogleGenAI({ apiKey });
  }

  static async generateVideo(params: {
    prompt: string;
    tier: UserTier;
    image?: string; // Base64
    onProgress?: (msg: string) => void;
  }): Promise<string> {
    const ai = await this.getClient();
    const config = TIER_CONFIG[params.tier];

    try {
      params.onProgress?.("Initializing generation...");
      
      const generationParams: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: params.prompt,
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
      
      params.onProgress?.("Creative thinking in progress...");

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        params.onProgress?.("Rendering frames... this may take up to 60 seconds.");
      }

      if (!operation.response?.generatedVideos?.[0]?.video?.uri) {
        throw new Error("Video generation completed but no URI was returned.");
      }

      const downloadLink = operation.response.generatedVideos[0].video.uri;
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);

    } catch (error: any) {
      console.error("Video generation failed:", error);
      if (error?.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_RESET_REQUIRED");
      }
      throw error;
    }
  }

  static async extendVideo(params: {
    prompt: string;
    previousVideoUri: string;
    onProgress?: (msg: string) => void;
  }): Promise<string> {
    const ai = await this.getClient();
    try {
      params.onProgress?.("Analyzing previous frames...");
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: params.prompt,
        video: { uri: params.previousVideoUri },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        params.onProgress?.("Extending cinematic sequence...");
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Extension failed.");
      
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Video extension failed:", error);
      throw error;
    }
  }

  static async generateAudio(params: {
    prompt: string;
    voiceName: string;
  }): Promise<string> {
    const ai = await this.getClient();
    
    try {
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
      if (!base64Audio) {
        throw new Error("No audio data returned from model.");
      }

      return this.pcmToWavUrl(base64Audio);
    } catch (error) {
      console.error("Audio generation failed:", error);
      throw error;
    }
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