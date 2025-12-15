import { GoogleGenAI, Modality } from "@google/genai";

// Helper functions for PCM decoding provided in guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

class TTSService {
  private ai: GoogleGenAI;
  private audioContext: AudioContext | null = null;
  private sources: AudioBufferSourceNode[] = [];
  private isPlaying: boolean = false;
  private nextStartTime: number = 0;
  private activeSourcesCount: number = 0;
  private streamFinished: boolean = false;
  private onCompleteCallback: (() => void) | null = null;

  constructor() {
    // API Key must be obtained exclusively from process.env.API_KEY per guidelines
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  // Modified to return a Promise that resolves when the FIRST chunk is ready (low latency)
  // Accepts an onComplete callback to notify when playback actually finishes.
  async speak(text: string, onComplete?: () => void): Promise<void> {
    this.stop(); // Stop any existing playback

    this.onCompleteCallback = onComplete || null;

    // Initialize AudioContext on user interaction
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.isPlaying = true;
    this.streamFinished = false;
    this.activeSourcesCount = 0;
    this.nextStartTime = this.audioContext.currentTime;

    // We create a promise that resolves as soon as the first audio chunk is scheduled.
    // This allows the UI to stop the "Loading" spinner immediately.
    let resolveFirstChunk: () => void;
    let rejectFirstChunk: (reason?: any) => void;
    const firstChunkPromise = new Promise<void>((resolve, reject) => {
        resolveFirstChunk = resolve;
        rejectFirstChunk = reject;
    });

    // Start streaming process in background
    this.processStream(text, 
      () => { if (resolveFirstChunk) resolveFirstChunk(); },
      (err) => { if (rejectFirstChunk) rejectFirstChunk(err); }
    );

    return firstChunkPromise;
  }

  private async processStream(text: string, onFirstChunk: () => void, onError: (err: any) => void) {
    let hasStarted = false;
    try {
      if (!process.env.API_KEY) {
        throw new Error("Missing API Key. Please add 'API_KEY' to your Vercel/Environment variables.");
      }

      const result = await this.ai.models.generateContentStream({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              // Using 'Kore' for a clear, neutral voice suitable for commands
              prebuiltVoiceConfig: { voiceName: 'Kore' }, 
            },
          },
        },
      });

      for await (const chunk of result) {
        if (!this.isPlaying) break;

        const base64Audio = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (base64Audio) {
           const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                this.audioContext!,
                24000,
                1
            );
            
            this.scheduleBuffer(audioBuffer);

            if (!hasStarted) {
                hasStarted = true;
                onFirstChunk();
            }
        }
      }
      
      this.streamFinished = true;
      // If loop finished but nothing played (empty response), resolve to unblock UI
      if (!hasStarted) onFirstChunk();
      this.checkCompletion();

    } catch (error) {
      console.error("TTS Streaming Error:", error);
      this.isPlaying = false;
      
      if (!hasStarted) {
        onError(error); // Reject promise if failed at start
      }
      
      if (this.onCompleteCallback) this.onCompleteCallback();
    }
  }

  private scheduleBuffer(buffer: AudioBuffer) {
      if (!this.audioContext) return;
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      // Handle timing: If nextStartTime is in the past (underrun), play now.
      if (this.nextStartTime < this.audioContext.currentTime) {
          this.nextStartTime = this.audioContext.currentTime;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
      
      this.sources.push(source);
      this.activeSourcesCount++;
      
      source.onended = () => {
          this.activeSourcesCount--;
          this.sources = this.sources.filter(s => s !== source);
          this.checkCompletion();
      };
  }

  private checkCompletion() {
      if (this.streamFinished && this.activeSourcesCount === 0 && this.isPlaying) {
          this.isPlaying = false;
          if (this.onCompleteCallback) {
              this.onCompleteCallback();
              this.onCompleteCallback = null;
          }
      }
  }

  stop() {
    this.sources.forEach(s => {
      try { s.stop(); } catch (e) {
        // Ignore errors if already stopped
      }
    });
    this.sources = [];
    this.activeSourcesCount = 0;
    this.isPlaying = false;
    this.streamFinished = true; // Stop processing further chunks
    
    // Trigger callback if it exists (to reset UI state)
    if (this.onCompleteCallback) {
        this.onCompleteCallback();
        this.onCompleteCallback = null;
    }
  }
  
  get isActive() {
    return this.isPlaying;
  }
}

export const ttsService = new TTSService();