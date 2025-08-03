import { BaseAgent } from './base-agent';
import { AgentResponse, FollowUpContext, AIProvider } from '../types';

export class OllamaAgent extends BaseAgent {
  id = 'ollama';
  name = 'Ollama';
  private modelId = 'llama3.1';

  setModel(modelId: string) {
    this.modelId = modelId;
    this.name = `Ollama (${modelId})`;
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
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelId,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json() as { response: string };

      return {
        content: data.response,
        confidence: 0.7,
        reasoning: `${this.name} analizi - Round ${round}${context ? ' (Follow-up)' : ''}`
      };
    } catch (error) {
      console.error('Ollama Agent Error:', error);
      throw new Error('Ollama API hatası. Ollama çalışıyor mu?');
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
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelId,
          prompt,
          stream: true,
          options: {
            temperature: 0.7,
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line) as { response?: string; done?: boolean };
              if (data.response) {
                fullContent += data.response;
                onToken?.(data.response);
              }
              if (data.done) break;
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return {
        content: fullContent,
        confidence: 0.7,
        reasoning: `${this.name} analizi - Round ${round}${context ? ' (Follow-up)' : ''} (Streaming)`
      };
    } catch (error) {
      console.error('Ollama Streaming Error:', error);
      throw new Error('Ollama API hatası. Ollama çalışıyor mu?');
    }
  }
} 