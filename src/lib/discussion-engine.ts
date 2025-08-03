import { v4 as uuidv4 } from 'uuid';
import { OpenAIAgent } from './agents/openai-agent';
import { GeminiAgent } from './agents/gemini-agent';
import { ClaudeAgent } from './agents/claude-agent';
import { OllamaAgent } from './agents/ollama-agent';
import { ModeratorAgent } from './agents/moderator-agent';
import { BaseAgent } from './agents/base-agent';
import { DiscussionState, DiscussionMessage, AIProvider, FollowUpContext } from './types';
import { validateEnvironment } from './config/env';

export class DiscussionEngine {
  private agents: Map<string, BaseAgent> = new Map();
  private moderator!: ModeratorAgent;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Validate environment variables on startup
      validateEnvironment();
      
      // Initialize agents
      this.agents.set('openai', new OpenAIAgent());
      this.agents.set('gemini', new GeminiAgent());
      this.agents.set('claude', new ClaudeAgent());
      this.agents.set('ollama', new OllamaAgent());
      this.moderator = new ModeratorAgent();
      
      this.isInitialized = true;
      console.log('🤖 Discussion Engine initialized successfully');
      console.log('Available agents:', Array.from(this.agents.keys()));
    } catch (error) {
      console.error('❌ Discussion Engine initialization failed:', error);
      this.isInitialized = false;
    }
  }

  private checkInitialization() {
    if (!this.isInitialized) {
      throw new Error('Discussion Engine not properly initialized. Check your environment variables.');
    }
  }

  async startDiscussion(
    question: string,
    selectedProviders: AIProvider[],
    maxRounds: number = 3,
    context?: FollowUpContext,
    moderatorProvider?: AIProvider
  ): Promise<DiscussionState> {
    this.checkInitialization();
    
    const messages: DiscussionMessage[] = [];
    let previousDiscussion = '';

    try {
      console.log(`Starting discussion with ${maxRounds} rounds...`);
      console.log(`Enabled providers:`, selectedProviders.filter(p => p.enabled).map(p => `${p.id} (${p.name})`));

      // Main discussion loop - each round, each model gets one response
      for (let round = 1; round <= maxRounds; round++) {
        console.log(`Starting round ${round}...`);

        for (const provider of selectedProviders.filter(p => p.enabled)) {
          console.log(`Processing provider: ${provider.id} (${provider.name}) in round ${round}`);
          const agent = this.agents.get(provider.id);
          if (!agent) {
            console.log(`No agent found for provider: ${provider.id}`);
            continue;
          }

          try {
            // Set the selected model for this agent
            if (provider.selectedModel && 'setModel' in agent) {
              const selectedModelObj = provider.models?.find(m => m.id === provider.selectedModel);
              (agent as BaseAgent & { setModel: (modelId: string, modelName?: string) => void }).setModel(provider.selectedModel, selectedModelObj?.name);
            }

            console.log(`Getting response from ${agent.name}...`);
            const response = await agent.generateResponse(
              question, 
              [previousDiscussion], // Pass the entire previous discussion as one string
              round,
              context,
              selectedProviders
            );
            
            const newMessage: DiscussionMessage = {
              id: uuidv4(),
              agentId: agent.id,
              agentName: agent.name,
              content: response.content,
              timestamp: new Date(),
              round: round
            };

            messages.push(newMessage);
            // Add this response to the previous discussion
            previousDiscussion += `\n\n${agent.name}: ${response.content}`;
            console.log(`${agent.name} responded in round ${round}`);
          } catch (error) {
            console.error(`Error getting response from ${agent.name}:`, error);
          }
        }
      }

      // Final consensus check after all rounds are complete
      console.log('All rounds completed, getting final answer from moderator...');
      const consensusResult = await this.moderator.analyzeConsensus(messages, moderatorProvider);
      
      return {
        question,
        round: maxRounds,
        maxRounds,
        messages,
        participants: selectedProviders,
        status: 'completed',
        finalAnswer: consensusResult.finalAnswer
      };
    } catch (error) {
      console.error('Discussion Engine Error:', error);
      return {
        question,
        round: maxRounds,
        maxRounds,
        messages,
        participants: selectedProviders,
        status: 'error'
      };
    }
  }

  async getAvailableProviders(): Promise<AIProvider[]> {
    this.checkInitialization();
    
    try {
      // This will be called from the API route, so we need to fetch models dynamically
      const response = await fetch('/api/models');
      const data = await response.json();
      return data.providers || [];
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      // Fallback to static providers
      return [
        { id: 'openai', name: 'OpenAI', enabled: true, selectedModel: 'gpt-4o' },
        { id: 'gemini', name: 'Google Gemini', enabled: true, selectedModel: 'gemini-2.0-flash-exp' },
        { id: 'claude', name: 'Anthropic Claude', enabled: true, selectedModel: 'claude-3-5-sonnet-20241022' },
        { id: 'ollama', name: 'Ollama (Local)', enabled: true, selectedModel: 'llama3.1' }
      ];
    }
  }

  async streamDiscussion(
    question: string,
    selectedProviders: AIProvider[],
    maxRounds: number = 3,
    onMessage?: (message: DiscussionMessage) => void,
    onConsensus?: (hasConsensus: boolean, finalAnswer?: string) => void,
    context?: FollowUpContext,
    moderatorProvider?: AIProvider
  ): Promise<DiscussionState> {
    this.checkInitialization();
    
    const messages: DiscussionMessage[] = [];
    let previousDiscussion = '';

    try {
      console.log(`Starting streaming discussion with ${maxRounds} rounds...`);
      console.log(`Enabled providers:`, selectedProviders.filter(p => p.enabled).map(p => `${p.id} (${p.name})`));

      // Main discussion loop - each round, each model gets one response
      for (let round = 1; round <= maxRounds; round++) {
        console.log(`Starting round ${round}...`);

        for (const provider of selectedProviders.filter(p => p.enabled)) {
          console.log(`Processing provider: ${provider.id} (${provider.name}) in round ${round}`);
          const agent = this.agents.get(provider.id);
          if (!agent) {
            console.log(`No agent found for provider: ${provider.id}`);
            continue;
          }

          try {
            // Set the selected model for this agent
            if (provider.selectedModel && 'setModel' in agent) {
              const selectedModelObj = provider.models?.find(m => m.id === provider.selectedModel);
              (agent as BaseAgent & { setModel: (modelId: string, modelName?: string) => void }).setModel(provider.selectedModel, selectedModelObj?.name);
            }

            console.log(`Getting streaming response from ${agent.name}...`);
            
            // Create a placeholder message for streaming
            const messageId = uuidv4();
            let streamingContent = '';
            let lastStreamTime = Date.now();
            
            const response = await agent.generateStreamingResponse(
              question, 
              [previousDiscussion], // Pass the entire previous discussion as one string
              round,
              context,
              selectedProviders,
              // onToken callback for real-time streaming
              (token: string) => {
                streamingContent += token;
                const now = Date.now();
                
                // Send streaming updates every 100ms to avoid too many updates
                if (now - lastStreamTime > 100) {
                  const streamingMessage: DiscussionMessage = {
                    id: messageId,
                    agentId: agent.id,
                    agentName: agent.name,
                    content: streamingContent,
                    timestamp: new Date(),
                    round: round
                  };
                  onMessage?.(streamingMessage);
                  lastStreamTime = now;
                }
              }
            );
            
            // Send final complete message
            const finalMessage: DiscussionMessage = {
              id: messageId,
              agentId: agent.id,
              agentName: agent.name,
              content: response.content,
              timestamp: new Date(),
              round: round
            };

            messages.push(finalMessage);
            // Add this response to the previous discussion
            previousDiscussion += `\n\n${agent.name}: ${response.content}`;
            console.log(`${agent.name} completed streaming in round ${round}`);
            onMessage?.(finalMessage); // Send final complete message
          } catch (error) {
            console.error(`Error getting response from ${agent.name}:`, error);
          }
        }
      }

      // Final consensus check after all rounds are complete
      console.log('All rounds completed, getting final answer from moderator...');
      const consensusResult = await this.moderator.analyzeConsensus(messages, moderatorProvider);
      
      onConsensus?.(true, consensusResult.finalAnswer);

      return {
        question,
        round: maxRounds,
        maxRounds,
        messages,
        participants: selectedProviders,
        status: 'completed',
        finalAnswer: consensusResult.finalAnswer
      };
    } catch (error) {
      console.error('Discussion Engine Error:', error);
      return {
        question,
        round: maxRounds,
        maxRounds,
        messages,
        participants: selectedProviders,
        status: 'error'
      };
    }
  }
} 