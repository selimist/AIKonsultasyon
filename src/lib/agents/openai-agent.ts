import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { BaseAgent } from './base-agent';
import { AgentResponse, FollowUpContext, AIProvider } from '../types';
import { openaiConfig } from '../config/env';

export class OpenAIAgent extends BaseAgent {
  id = 'openai';
  name = 'GPT-4o';
  private modelId = 'gpt-4o';

  setModel(modelId: string, modelName?: string) {
    this.modelId = modelId;
    this.name = modelName || `OpenAI (${modelId})`;
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
        model: openai(this.modelId),
        prompt,
        temperature: 0.7,
      });

      return {
        content: text,
        confidence: 0.8,
        reasoning: `GPT-4o analizi - Round ${round}${context ? ' (Follow-up)' : ''}`
      };
    } catch (error) {
      console.error('OpenAI Agent Error:', error);
      throw new Error('OpenAI API hatası');
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
        model: openai(this.modelId),
        prompt,
        temperature: 0.7,
      });

      let fullContent = '';
      for await (const delta of result.textStream) {
        fullContent += delta;
        onToken?.(delta); // Stream each token as it comes
      }

      return {
        content: fullContent,
        confidence: 0.8,
        reasoning: `GPT-4o analizi - Round ${round}${context ? ' (Follow-up)' : ''} (Streaming)`
      };
    } catch (error) {
      console.error('OpenAI Streaming Error:', error);
      throw new Error('OpenAI API hatası');
    }
  }
} 