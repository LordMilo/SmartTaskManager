// Local Text-to-Speech Service using Web Speech API
// No API Key required.

class TTSService {
  private synthesis: SpeechSynthesis;
  private onCompleteCallback: (() => void) | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    // Preload voices
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this.synthesis.getVoices();
      };
    }
  }

  async speak(text: string, onComplete?: () => void): Promise<void> {
    // 1. Stop any existing speech
    this.stop();

    this.onCompleteCallback = onComplete || null;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // 2. Language Detection & Voice Selection
      // Check if text contains Thai characters
      const isThai = /[\u0E00-\u0E7F]/.test(text);
      utterance.lang = isThai ? 'th-TH' : 'en-US';

      // Try to find a suitable voice
      const voices = this.synthesis.getVoices();
      if (voices.length > 0) {
        // Try exact match first
        let preferredVoice = voices.find(v => v.lang === utterance.lang);
        
        // If no exact match, try matching language code (e.g. 'th' in 'th-TH')
        if (!preferredVoice) {
           preferredVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
        }

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      // 3. Configure Audio Properties
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Max volume

      // 4. Event Handlers
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

      // 5. Speak
      this.synthesis.speak(utterance);
      
      // Resolve immediately to indicate "started" to the UI
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