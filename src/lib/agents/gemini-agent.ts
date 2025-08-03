import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { BaseAgent } from './base-agent';
import { AgentResponse, FollowUpContext, AIProvider } from '../types';
import { googleConfig } from '../config/env';

export class GeminiAgent extends BaseAgent {
  id = 'gemini';
  name = 'Gemini 2.0 Flash';
  private modelId = 'gemini-2.0-flash-exp';

  setModel(modelId: string, modelName?: string) {
    this.modelId = modelId;
    this.name = modelName || `Gemini (${modelId})`;
  }

    async generateResponse(
    question: string,
    previousMessages: string[],
    round: number,
    context?: FollowUpContext,
    participants?: AIProvider[]
  ): Promise<AgentResponse> {
    try {
      const prompt = this.buildPrompt(question, previousMessages, round, context, participants);
      
      const { text } = await generateText({
        model: google(this.modelId),
        prompt,
        temperature: 0.7,
      });

      return {
        content: text,
        confidence: 0.85,
        reasoning: `Gemini 2.0 Flash analizi - Round ${round}${context ? ' (Follow-up)' : ''}`
      };
    } catch (error) {
      console.error('Gemini Agent Error:', error);
      throw new Error('Gemini API hatası');
    }
  }

  async generateStreamingResponse(
    question: string,
    previousMessages: string[],
    round: number,
    context?: FollowUpContext,
    participants?: AIProvider[],
    onToken?: (token: string) => void
  ): Promise<AgentResponse> {
    try {
      const prompt = this.buildPrompt(question, previousMessages, round, context, participants);
      
      const result = streamText({
        model: google(this.modelId),
        prompt,
        temperature: 0.7,
      });

      let fullContent = '';
      for await (const delta of result.textStream) {
        fullContent += delta;
        onToken?.(delta);
      }

      return {
        content: fullContent,
        confidence: 0.75,
        reasoning: `Gemini 2.0 Flash analizi - Round ${round}${context ? ' (Follow-up)' : ''} (Streaming)`
      };
    } catch (error) {
      console.error('Gemini Streaming Error:', error);
      throw new Error('Gemini API hatası');
    }
  }
} 