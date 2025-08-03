import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { DiscussionMessage, AIProvider } from '../types';
import { openaiConfig } from '../config/env';

export class ModeratorAgent {
  private modelId = 'gpt-4o';
  private modelName = 'GPT-4o';

  setModel(modelId: string, modelName?: string) {
    this.modelId = modelId;
    this.modelName = modelName || `Moderator (${modelId})`;
  }

  async analyzeConsensus(messages: DiscussionMessage[], moderatorProvider?: AIProvider): Promise<{
    hasConsensus: boolean;
    finalAnswer?: string;
    reasoning: string;
  }> {
    // Group messages by round for comprehensive analysis
    const messagesByRound = messages.reduce((acc, msg) => {
      if (!acc[msg.round]) acc[msg.round] = [];
      acc[msg.round].push(msg);
      return acc;
    }, {} as Record<number, DiscussionMessage[]>);

    const roundSummaries = Object.entries(messagesByRound)
      .map(([round, msgs]) => {
        const roundMsgs = msgs.map(msg => `  ${msg.agentName}: ${msg.content}`).join('\n');
        return `Round ${round}:\n${roundMsgs}`;
      }).join('\n\n');

    const prompt = `You are an artificial intelligence assistant. The user is asking a question, and a discussion group composed of AI models is debating the answer to this question. Your task is to provide an answer based on the conclusions reached from this discussion.

IMPORTANT:
- YOUR ANSWER MUST BE IN TURKISH
- After analyzing, determine the answer based on the outcome of the discussion, not your own opinion.
- From the user's perspective, they are asking a question and expecting an answer from you, so avoid terms like "consensus", "participants," "agreed arguments," or "discussion outcome" in your response.
- The background of the discussion should serve as context for your answer to the question. So act like user asked the question to you, and you are answering the question using the discussion history as context. User doesn't see the discussion history, so you should not mention the discussion history in your answer.
- Do not mention the models from the discussion in your answer.
- Your response should be detailed and explanatory.
- Don't forget, the language of the response should be in Turkish.

DISCUSSION HISTORY:
${roundSummaries}

YOUR TASK:
- Analyze the discussion history.
- Provide a comprehensive answer to the user's question.
- Assume the user does not see the discussion history.
- Do not mention the discussion; only present the results.
- Reflect commonalities and differences in a balanced manner.
- Include practical outcomes and recommendations.

EVALUATION CRITERIA:
- The answer should be at least 3-4 paragraphs long.
- It must cover all important aspects of the discussion.
- It should be balanced and objective.
- It must directly answer the user's question.`;

    try {
      // Use the specified moderator model or default to GPT-4o
      const modelToUse = moderatorProvider?.selectedModel || this.modelId;
      const providerId = moderatorProvider?.id || 'openai';
      
      let text: string;
      
      if (providerId === 'ollama') {
        // Use direct Ollama API call
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelToUse,
            prompt,
            stream: false,
            options: {
              temperature: 0.3,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json() as { response: string };
        text = data.response;
      } else {
        // Use Vercel AI SDK for other providers
        let model;
        if (providerId === 'gemini') {
          model = google(modelToUse);
        } else if (providerId === 'claude') {
          model = anthropic(modelToUse);
        } else {
          model = openai(modelToUse);
        }
        
        const result = await generateText({
          model,
          prompt,
          temperature: 0.3,
        });
        text = result.text;
      }

      console.log('Moderator response:', text);
      
      // Simply return the entire response as the final answer
      return {
        hasConsensus: true,
        finalAnswer: text,
        reasoning: 'Tartışma tamamlandı, final cevap oluşturuldu'
      };
    } catch (error) {
      console.error('Moderator Error:', error);
      return {
        hasConsensus: false,
        reasoning: 'Moderator analizi başarısız oldu'
      };
    }
  }

  async shouldContinueDiscussion(round: number, maxRounds: number, messages: DiscussionMessage[]): Promise<boolean> {
    if (round >= maxRounds) return false;
    
    const consensus = await this.analyzeConsensus(messages);
    return !consensus.hasConsensus;
  }
} 