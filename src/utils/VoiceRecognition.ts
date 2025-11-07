/**
 * Voice Recognition Utility
 * Provides OpenAI Whisper fallback for low-confidence on-device recognition
 */

import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';
import * as FileSystem from 'expo-file-system';

export interface WhisperTranscriptionResult {
  text: string;
  confidence: number; // Estimated confidence (Whisper doesn't provide this directly, so we estimate)
}

export class VoiceRecognitionService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not configured for Whisper fallback');
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   * Used as fallback when on-device recognition confidence is low
   *
   * @param audioUri - URI to audio file (m4a, mp3, wav, etc.)
   * @returns Transcription result with text and estimated confidence
   */
  async transcribeWithWhisper(audioUri: string): Promise<WhisperTranscriptionResult> {
    try {
      console.log('🌐 Using Whisper API for transcription (cloud fallback)');

      // Read audio file as base64
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob (Whisper API expects File object)
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const file = new File([blob], 'audio.m4a', { type: 'audio/m4a' });

      // Call Whisper API
      const transcription = await this.client.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en',
        prompt: 'Transcribe this student speaking to their math tutor. Common words: hint, help, stuck, explain, why, new problem, clear canvas.',
      });

      const text = transcription.text;

      console.log('✅ Whisper transcription:', text);

      // Estimate confidence based on heuristics
      // Whisper doesn't provide confidence scores, so we estimate based on:
      // - Response length (very short responses might be uncertain)
      // - Presence of expected keywords
      const confidence = this.estimateWhisperConfidence(text);

      console.log('📊 Estimated confidence:', (confidence * 100).toFixed(0) + '%');

      return {
        text,
        confidence,
      };
    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw new Error('Failed to transcribe audio with Whisper');
    }
  }

  /**
   * Estimate confidence for Whisper transcription
   * Since Whisper doesn't provide confidence scores, we use heuristics
   */
  private estimateWhisperConfidence(text: string): number {
    let confidence = 0.9; // Start with high base confidence (Whisper is very accurate)

    // Very short responses might be uncertain
    if (text.length < 3) {
      confidence -= 0.2;
    }

    // Empty or whitespace-only responses
    if (!text.trim()) {
      confidence = 0.3;
    }

    // Presence of command keywords boosts confidence
    const keywords = ['hint', 'help', 'stuck', 'explain', 'why', 'new', 'problem', 'clear', 'read'];
    const hasKeyword = keywords.some(keyword => text.toLowerCase().includes(keyword));
    if (hasKeyword) {
      confidence = Math.min(1.0, confidence + 0.05);
    }

    // Unintelligible patterns reduce confidence
    const unintelligiblePatterns = /[^\w\s.,!?'-]/i;
    if (unintelligiblePatterns.test(text)) {
      confidence -= 0.1;
    }

    return Math.max(0.3, Math.min(1.0, confidence));
  }

  /**
   * Record audio to a file
   * This would be used if we want to capture audio for Whisper transcription
   * Note: Requires expo-av for audio recording
   */
  async recordAudioToFile(durationMs: number = 5000): Promise<string | null> {
    try {
      // This is a placeholder - actual implementation would use expo-av
      // For now, we'll rely on on-device recognition only
      console.warn('⚠️ Audio recording not implemented yet. Using on-device recognition only.');
      return null;
    } catch (error) {
      console.error('Audio recording error:', error);
      return null;
    }
  }
}

// Singleton instance
export const voiceRecognitionService = new VoiceRecognitionService();
