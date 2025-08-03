export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
}

export interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  models?: AIModel[];
  selectedModel?: string;
}

export interface DiscussionMessage {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  round: number;
}

export interface DiscussionState {
  question: string;
  round: number;
  maxRounds: number;
  messages: DiscussionMessage[];
  participants: AIProvider[];
  moderator?: AIProvider;
  status: 'idle' | 'discussing' | 'completed' | 'error';
  finalAnswer?: string;
}

export interface AgentResponse {
  content: string;
  confidence: number;
  reasoning?: string;
}

// New types for conversation memory
export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  discussions: DiscussionState[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  discussionCount: number;
  lastQuestion: string;
}

export interface FollowUpContext {
  originalQuestion: string;
  previousAnswers: string[];
  conversationHistory: DiscussionMessage[];
} 