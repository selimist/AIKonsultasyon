import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { BaseAgent } from './base-agent';
import { AgentResponse, FollowUpContext, AIProvider } from '../types';
import { anthropicConfig } from '../config/env';

export class ClaudeAgent extends BaseAgent {
  id = 'claude';
  name = 'Claude 3.5 Sonnet';
  private modelId = 'claude-3-5-sonnet-20241022';

  setModel(modelId: string, modelName?: string) {
    this.modelId = modelId;
    this.name = modelName || `Claude (${modelId})`;
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
        model: anthropic(this.modelId),
        prompt,
        temperature: 0.7,
      });

      return {
        content: text,
        confidence: 0.9,
        reasoning: `Claude 3.5 Sonnet analizi - Round ${round}${context ? ' (Follow-up)' : ''}`
      };
    } catch (error) {
      console.error('Claude Agent Error:', error);
      throw new Error('Claude API hatası');
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
        model: anthropic(this.modelId),
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
        confidence: 0.85,
        reasoning: `Claude 3.5 Sonnet analizi - Round ${round}${context ? ' (Follow-up)' : ''} (Streaming)`
      };
    } catch (error) {
      console.error('Claude Streaming Error:', error);
      throw new Error('Claude API hatası');
    }
  }
} 