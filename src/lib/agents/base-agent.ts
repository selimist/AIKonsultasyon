import { AgentResponse, FollowUpContext, AIProvider } from '../types';

export abstract class BaseAgent {
  abstract id: string;
  abstract name: string;
  
    abstract generateResponse(
    question: string,
    previousMessages: string[],
    round: number,
    context?: FollowUpContext,
    participants?: AIProvider[]
  ): Promise<AgentResponse>;

  abstract generateStreamingResponse(
    question: string,
    previousMessages: string[],
    round: number,
    context?: FollowUpContext,
    participants?: AIProvider[],
    onToken?: (token: string) => void
  ): Promise<AgentResponse>;

    protected formatPreviousMessages(messages: string[], currentAgentName?: string): string {
    if (messages.length === 0) return '';

    const formattedMessages = messages.map((msg, i) => {
      // Check if this message is from the current agent
      const isOwnMessage = msg.startsWith(`${currentAgentName}:`);
      const prefix = isOwnMessage ? 'SEN (önceki cevabın)' : 'DİĞER KATILIMCI';
      
      // Remove the agent's name from the message to avoid redundancy
      const messageContent = msg.substring(msg.indexOf(':') + 1).trim();
      
      return `${i + 1}. ${prefix}: ${messageContent}`;
    });

    return `\nÖnceki tartışma:\n${formattedMessages.join('\n')}\n`;
  }

  protected formatContext(context?: FollowUpContext): string {
    if (!context) return '';

    let contextStr = '\n--- CONVERSATION CONTEXT ---\n';
    
    if (context.previousAnswers.length > 0) {
      contextStr += '\nÖnceki Sorulara Verilen Final Cevaplar:\n';
      context.previousAnswers.forEach((answer, i) => {
        contextStr += `${i + 1}. ${answer}\n`;
      });
    }

    if (context.conversationHistory.length > 0) {
      contextStr += '\nSon Tartışma Geçmişi:\n';
      context.conversationHistory.slice(-6).forEach((msg, i) => {
        contextStr += `${msg.agentName}: ${msg.content.substring(0, 200)}...\n`;
      });
    }

    contextStr += '--- END CONTEXT ---\n';
    return contextStr;
  }

  protected formatParticipants(participants?: AIProvider[]): string {
    if (!participants || participants.length === 0) return '';
    
    const enabledParticipants = participants.filter(p => p.enabled);
    const otherParticipants = enabledParticipants.filter(p => p.name !== this.name);
    
    if (otherParticipants.length === 0) return '';
    
    return `TARTIŞMA KATILIMCILARI: ${enabledParticipants.map(p => p.name).join(', ')}
DİĞER KATILIMCILAR: ${otherParticipants.map(p => p.name).join(', ')}`;
  }

  protected buildPrompt(
    question: string, 
    previousMessages: string[], 
    round: number, 
    context?: FollowUpContext,
    participants?: AIProvider[]
  ): string {
    const previousDiscussion = this.formatPreviousMessages(previousMessages, this.name);
    const conversationContext = this.formatContext(context);
    const participantInfo = this.formatParticipants(participants);
    const isFollowUp = context && context.previousAnswers.length > 0;

    // Round'a göre değişen talimatlar
    let roundInstructions = '';

 roundInstructions = `Yukarıdaki tartışma geçmişini dikkatle incele. Görüşleri değerlendir ve kendi görüşünüzü ortaya koy.`;

    return `Sen bır tartışma uzmanısın. Verilen konuyla ilgili diğer tartışma uzmanlarıyla birlikte tartışıyorsun. Amacın tartışmayı kazanmak değil, kullanıcının sorusuna diğer tartışma uzmanlarıyla birlikte yaptığınız tartışma sonucunda en iyi cevabı vermek.

SENİN ADIN: ${this.name}
${participantInfo}
${conversationContext}

${isFollowUp ? 'FOLLOW-UP SORU' : 'ANA SORU'}: ${question}

${previousDiscussion
  ? `TARTIŞMA GEÇMİŞİ:
${previousDiscussion}
---

${roundInstructions}
` : ''}

Lütfen cevabını bu kurallar çerçevesinde detayli olarak sun.
`;
  }
} 