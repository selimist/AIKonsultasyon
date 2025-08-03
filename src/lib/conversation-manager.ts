import { v4 as uuidv4 } from 'uuid';
import { Conversation, ConversationSummary, DiscussionState } from './types';

// In-memory storage for now (can be replaced with database later)
class ConversationStore {
  private conversations: Map<string, Conversation> = new Map();

  save(conversation: Conversation): void {
    this.conversations.set(conversation.id, conversation);
  }

  get(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  getAll(): ConversationSummary[] {
    return Array.from(this.conversations.values()).map(conv => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      discussionCount: conv.discussions.length,
      lastQuestion: conv.discussions[conv.discussions.length - 1]?.question || ''
    }));
  }

  delete(id: string): boolean {
    return this.conversations.delete(id);
  }
}

export class ConversationManager {
  private store = new ConversationStore();

  createConversation(firstQuestion: string): Conversation {
    const conversation: Conversation = {
      id: uuidv4(),
      title: this.generateTitle(firstQuestion),
      createdAt: new Date(),
      updatedAt: new Date(),
      discussions: []
    };

    this.store.save(conversation);
    return conversation;
  }

  addDiscussion(conversationId: string, discussion: DiscussionState): Conversation | null {
    const conversation = this.store.get(conversationId);
    if (!conversation) return null;

    conversation.discussions.push(discussion);
    conversation.updatedAt = new Date();
    
    // Update title if it's the first real discussion
    if (conversation.discussions.length === 1) {
      conversation.title = this.generateTitle(discussion.question);
    }

    this.store.save(conversation);
    return conversation;
  }

  getConversation(id: string): Conversation | null {
    return this.store.get(id) || null;
  }

  getAllConversations(): ConversationSummary[] {
    return this.store.getAll().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  deleteConversation(id: string): boolean {
    return this.store.delete(id);
  }

  getConversationContext(conversationId: string): {
    previousQuestions: string[];
    previousAnswers: string[];
    recentMessages: string[];
  } {
    const conversation = this.store.get(conversationId);
    if (!conversation) {
      return { previousQuestions: [], previousAnswers: [], recentMessages: [] };
    }

    const previousQuestions = conversation.discussions.map(d => d.question);
    const previousAnswers = conversation.discussions
      .filter(d => d.finalAnswer)
      .map(d => d.finalAnswer!);

    // Get recent messages from last 2 discussions for context
    const recentDiscussions = conversation.discussions.slice(-2);
    const recentMessages = recentDiscussions
      .flatMap(d => d.messages)
      .slice(-10) // Last 10 messages
      .map(m => `${m.agentName}: ${m.content}`);

    return {
      previousQuestions,
      previousAnswers,
      recentMessages
    };
  }

  private generateTitle(question: string): string {
    // Simple title generation - take first 50 chars
    const title = question.trim();
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  }

  // Export/Import functionality for persistence
  exportConversations(): string {
    const conversations = Array.from(this.store['conversations'].values());
    return JSON.stringify(conversations, null, 2);
  }

  importConversations(data: string): void {
    try {
      const conversations: Conversation[] = JSON.parse(data);
      conversations.forEach(conv => {
        // Convert date strings back to Date objects
        conv.createdAt = new Date(conv.createdAt);
        conv.updatedAt = new Date(conv.updatedAt);
        conv.discussions.forEach(disc => {
          disc.messages.forEach(msg => {
            msg.timestamp = new Date(msg.timestamp);
          });
        });
        this.store.save(conv);
      });
    } catch (error) {
      console.error('Failed to import conversations:', error);
      throw new Error('Invalid conversation data');
    }
  }
}

// Singleton instance
export const conversationManager = new ConversationManager(); 