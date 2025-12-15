// Local Text-to-Speech Service using Web Speech API
// No API Key required.

class TTSService {
  private synthesis: SpeechSynthesis;
  private onCompleteCallback: (() => void) | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    // Attempt to load voices early to ensure they are available when needed
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.getVoices();
    }
  }

  async speak(text: string, onComplete?: () => void): Promise<void> {
    // 1. Stop any existing speech
    this.stop();

    this.onCompleteCallback = onComplete || null;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // 2. Language Detection
      // Check if text contains Thai characters to determine the primary language
      const isThai = /[\u0E00-\u0E7F]/.test(text);
      utterance.lang = isThai ? 'th-TH' : 'en-US';

      // 3. Robust Voice Selection
      let voices = this.synthesis.getVoices();
      
      // Filter voices that match the target language prefix (e.g. 'th' or 'en')
      // normalize codes like 'th_TH' to 'th-th' for comparison
      const targetPrefix = isThai ? 'th' : 'en';
      
      const suitableVoices = voices.filter(v => 
          v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix)
      );

      if (suitableVoices.length > 0) {
          // Priority 1: Prefer "Google", "Microsoft", or "Enhanced" voices as they often have better quality
          let preferredVoice = suitableVoices.find(v => 
              v.name.includes('Google') || 
              v.name.includes('Microsoft') || 
              v.name.includes('Enhanced') ||
              v.name.includes('Siri')
          );

          // Priority 2: Use the first matching voice if no preferred vendor is found
          if (!preferredVoice) {
              preferredVoice = suitableVoices[0];
          }

          utterance.voice = preferredVoice;
      } else {
          // Fallback: If it's Thai but no Thai voice is found, we rely on the browser's default behavior.
          // In some cases, this might result in English voices trying to read Thai (gibberish).
          // We can't install voices from web, but we can log it.
          console.warn(`TTSService: No voice found for language '${utterance.lang}'. Using system default.`);
      }

      // 4. Configure Audio Properties
      utterance.rate = 1.0; 
      utterance.pitch = 1.0; 
      utterance.volume = 1.0; 

      // 5. Event Handlers
      utterance.onend = () => {
        if (this.onCompleteCallback) {
          this.onCompleteCallback();
          this.onCompleteCallback = null;
        }
      };

      utterance.onerror = (e) => {
        console.error("Local TTS Error:", e);
        // Ensure UI resets even on error
        if (this.onCompleteCallback) {
          this.onCompleteCallback();
          this.onCompleteCallback = null;
        }
      };

      // 6. Speak
      this.synthesis.speak(utterance);
      
      // Resolve immediately to let UI update
      resolve();
    });
  }

  stop() {
    if (this.synthesis.speaking || this.synthesis.pending) {
      this.synthesis.cancel();
    }
    // Fire callback if interrupted to reset UI state
    if (this.onCompleteCallback) {
      this.onCompleteCallback();
      this.onCompleteCallback = null;
    }
  }
  
  get isActive() {
    return this.synthesis.speaking;
  }
}

export const ttsService = new TTSService();