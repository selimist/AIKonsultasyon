'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import { DiscussionMessage, AIProvider, DiscussionState, AIModel } from '@/lib/types';

interface DiscussionInterfaceProps {
  onBack: () => void;
}

// Extend AIProvider to have a unique instance ID for the list
interface Participant extends AIProvider {
  instanceId: string;
}

interface ThinkSectionProps {
  thinkContent: string;
  isThinking?: boolean;
}

function ThinkSection({ thinkContent, isThinking = false }: ThinkSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-yellow-800 hover:text-yellow-900 transition-colors"
      >
        <span className="text-sm font-medium">
          {isThinking ? '🤔 Düşünüyor...' : '🤔 Düşündü'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-yellow-200">
          <div className="text-sm text-yellow-700 prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{thinkContent}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DiscussionInterface({ onBack }: DiscussionInterfaceProps) {
  const [question, setQuestion] = useState('');
  const [allProviders, setAllProviders] = useState<AIProvider[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // State for the selection dropdowns
  const [currentProviderId, setCurrentProviderId] = useState<string>('');
  const [currentModelId, setCurrentModelId] = useState<string>('');

  const [maxRounds, setMaxRounds] = useState(3);
  const [isDiscussing, setIsDiscussing] = useState(false);
  const [discussionResult, setDiscussionResult] = useState<DiscussionState | null>(null);
  const [streamingMessages, setStreamingMessages] = useState<DiscussionMessage[]>([]);
  const [streamingFinalAnswer, setStreamingFinalAnswer] = useState<string | undefined>();
  const [useStreaming, setUseStreaming] = useState(true);
  
  // Moderator selection state
  const [moderatorProvider, setModeratorProvider] = useState<AIProvider | undefined>();
  
  // Auto-scroll state
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const discussionContainerRef = useRef<HTMLDivElement>(null);
  
  // Sidebar visibility state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Conversation memory state
  const [conversationHistory, setConversationHistory] = useState<DiscussionMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');

  // Load available providers on mount
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      setAllProviders(data.providers);
      // Set initial dropdown selections
      if (data.providers.length > 0) {
        const initialProvider = data.providers[0];
        setCurrentProviderId(initialProvider.id);
        if (initialProvider.models && initialProvider.models.length > 0) {
          setCurrentModelId(initialProvider.models[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const handleProviderChange = (providerId: string) => {
    setCurrentProviderId(providerId);
    const provider = allProviders.find(p => p.id === providerId);
    if (provider && provider.models && provider.models.length > 0) {
      setCurrentModelId(provider.models[0].id);
    } else {
      setCurrentModelId('');
    }
  };

  const handleAddParticipant = () => {
    const provider = allProviders.find(p => p.id === currentProviderId);
    if (!provider) return;
    const model = provider.models?.find(m => m.id === currentModelId);
    if (!model) return;

    const newParticipant: Participant = {
      ...provider,
      id: provider.id, // This is the provider ID like 'openai'
      name: model.name, // We will use the model name for display
      selectedModel: model.id, // This is the specific model ID like 'gpt-4o'
      enabled: true,
      instanceId: uuidv4(), // Unique ID for the list item
    };

    setParticipants(prev => [...prev, newParticipant]);
  };

  const handleRemoveParticipant = (instanceId: string) => {
    setParticipants(prev => prev.filter(p => p.instanceId !== instanceId));
  };

  const startNewDiscussion = () => {
    // Clear everything for new discussion
    setQuestion('');
    setStreamingMessages([]);
    setStreamingFinalAnswer(undefined);
    setDiscussionResult(null);
    setConversationHistory([]);
    setCurrentQuestion('');
  };

  const startDiscussion = async () => {
    if (!question.trim() || participants.length < 2) {
      alert('Lütfen bir soru girin ve tartışma için en az iki AI modeli ekleyin.');
      return;
    }

    setIsDiscussing(true);
    setStreamingMessages([]);
    setStreamingFinalAnswer(undefined);
    setDiscussionResult(null);
    
    // Update conversation memory
    setCurrentQuestion(question);
    if (conversationHistory.length === 0) {
      // First question - start fresh
      setConversationHistory([]);
    }

    try {
      const selectedProviders = participants.map(p => ({
        ...p,
        enabled: true
      }));

      if (useStreaming) {
        await startStreamingDiscussion(selectedProviders);
      } else {
        await startRegularDiscussion(selectedProviders);
      }
    } catch (error) {
      console.error('Discussion error:', error);
      alert('Tartışma sırasında bir hata oluştu.');
    } finally {
      setIsDiscussing(false);
    }
  };

  const startRegularDiscussion = async (selectedProviders: AIProvider[]) => {
    const response = await fetch('/api/discuss', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        selectedProviders,
        maxRounds,
        moderatorProvider
      }),
    });

    if (!response.ok) {
      throw new Error('Discussion request failed');
    }

    const result = await response.json();
    setDiscussionResult(result);
  };

  const startStreamingDiscussion = async (selectedProviders: AIProvider[]) => {
    const response = await fetch('/api/discuss/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        selectedProviders,
        maxRounds,
        moderatorProvider
      }),
    });

    if (!response.ok) {
      throw new Error('Streaming discussion request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              console.log('Received SSE data:', parsed);
              
              if (parsed.type === 'message' && parsed.message) {
                console.log('Processing message:', parsed.message);
                setStreamingMessages(prev => {
                  const existingIndex = prev.findIndex(m => m && m.id && parsed.message && parsed.message.id && m.id === parsed.message.id);
                  if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = parsed.message;
                    console.log('Updated existing message, total messages:', updated.length);
                    return updated;
                  } else {
                    const newMessages = [...prev, parsed.message];
                    console.log('Added new message, total messages:', newMessages.length);
                    return newMessages;
                  }
                });
                
                // Add to conversation history when discussion completes
                // Only add to history when the entire discussion is done, not during streaming
                // We'll handle this in the final answer section
              } else if (parsed.type === 'finalAnswer') {
                console.log('Received final answer:', parsed.finalAnswer);
                setStreamingFinalAnswer(parsed.finalAnswer);
                
                // Discussion completed - add all messages to history
                if (parsed.finalAnswer) {
                  // We'll handle this in a useEffect when streamingFinalAnswer changes
                  // This prevents the loop issue
                }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  const formatTimestamp = (date: Date) => new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const getMessages = () => {
    let currentMessages: DiscussionMessage[] = [];
    
    if (useStreaming) {
      currentMessages = streamingMessages || [];
    } else {
      currentMessages = discussionResult?.messages || [];
    }
    
    // Combine conversation history with current messages
    return [...conversationHistory, ...currentMessages];
  };
  const currentSelectedProvider = allProviders.find(p => p.id === currentProviderId);

  // Parse think tags from AI responses - handles streaming
  const parseThinkContent = (content: string) => {
    // Check if we're currently in a think section
    const hasThinkStart = content.includes('<think>');
    const hasThinkEnd = content.includes('</think>');
    
    if (hasThinkStart) {
      // Extract content after <think>
      const afterThink = content.split('<think>')[1] || '';
      
      if (hasThinkEnd) {
        // Complete think section
        const parts = afterThink.split('</think>');
        const thinkContent = parts[0] || '';
        const actualContent = parts[1] || '';
        
        return {
          hasThink: true,
          thinkContent: thinkContent.trim(),
          actualContent: actualContent.trim(),
          isThinking: false
        };
      } else {
        // Still thinking - everything after <think> is think content
        return {
          hasThink: true,
          thinkContent: afterThink.trim(),
          actualContent: '',
          isThinking: true
        };
      }
    }
    
    return {
      hasThink: false,
      thinkContent: '',
      actualContent: content,
      isThinking: false
    };
  };

  // Auto-scroll functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!discussionContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = discussionContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
    
    setAutoScroll(isAtBottom);
  };

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [getMessages(), streamingFinalAnswer]);

  // Reset auto-scroll when discussion starts
  useEffect(() => {
    if (isDiscussing) {
      setAutoScroll(true);
    }
  }, [isDiscussing]);

  // Add completed discussion to conversation history
  useEffect(() => {
    if (streamingFinalAnswer && !isDiscussing) {
      // Discussion completed - add all current messages to history
      setConversationHistory(prev => {
        const newHistory = [...prev, ...streamingMessages];
        
        // Add final answer
        const finalMessage: DiscussionMessage = {
          id: uuidv4(),
          agentId: 'moderator',
          agentName: 'Final Cevap',
          content: streamingFinalAnswer,
          timestamp: new Date(),
          round: maxRounds
        };
        
        return [...newHistory, finalMessage];
      });
      
      // Clear current discussion state
      setStreamingMessages([]);
      setStreamingFinalAnswer(undefined);
    }
  }, [streamingFinalAnswer, isDiscussing, streamingMessages, maxRounds]);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {sidebarVisible && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">AI Konsültasyon</h1>
              <button onClick={() => setSidebarVisible(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Tartışmacı Ekle */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tartışmacı Ekle</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">AI Sağlayıcı</label>
                  <select
                    value={currentProviderId}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    disabled={isDiscussing}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {allProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
                  <select
                    value={currentModelId}
                    onChange={(e) => setCurrentModelId(e.target.value)}
                    disabled={isDiscussing || !currentSelectedProvider}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    {currentSelectedProvider?.models?.map(m => <option key={m.id} value={m.id}>{m.name}</option>) || <option>Sağlayıcı seçin</option>}
                  </select>
                </div>
                <button
                  onClick={handleAddParticipant}
                  disabled={isDiscussing || !currentModelId}
                  className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  Ekle
                </button>
              </div>
            </div>

            {/* Katılımcılar */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Katılımcılar</h3>
              <div className="space-y-2">
                {participants.length === 0 ? (
                  <p className="text-xs text-gray-500">Tartışma için en az 2 model ekleyin.</p>
                ) : (
                  participants.map((participant) => (
                    <div key={participant.instanceId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">{participant.name}</span>
                      <button
                        onClick={() => handleRemoveParticipant(participant.instanceId)}
                        disabled={isDiscussing}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Moderator Modeli */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Moderator Modeli</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">AI Sağlayıcı</label>
                  <select
                    value={moderatorProvider?.id || ''}
                    onChange={(e) => {
                      const provider = allProviders.find(p => p.id === e.target.value);
                      setModeratorProvider(provider);
                    }}
                    disabled={isDiscussing}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Moderator seçin</option>
                    {allProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {moderatorProvider && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
                    <select
                      value={moderatorProvider.selectedModel || ''}
                      onChange={(e) => {
                        const provider = allProviders.find(p => p.id === moderatorProvider.id);
                        if (provider) {
                          const model = provider.models?.find(m => m.id === e.target.value);
                          setModeratorProvider({
                            ...provider,
                            selectedModel: e.target.value,
                            name: model?.name || provider.name
                          });
                        }
                      }}
                      disabled={isDiscussing}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {moderatorProvider.models?.map(m => <option key={m.id} value={m.id}>{m.name}</option>) || <option>Model seçin</option>}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Round</label>
                <select
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(Number(e.target.value))}
                  disabled={isDiscussing}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="streaming"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  disabled={isDiscussing}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="streaming" className="text-sm font-medium text-gray-700">
                  Canlı Tartışma
                </label>
              </div>
            </div>
            
            {/* Yeni Tartışma Butonu */}
            <div>
              <button
                onClick={startNewDiscussion}
                disabled={isDiscussing}
                className="w-full px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🆕 Yeni Tartışma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {useStreaming ? '🚀 Canlı Tartışma' : '📋 Tartışma Sonuçları'}
            </h2>
            {!sidebarVisible && (
              <button onClick={() => setSidebarVisible(true)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={discussionContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {getMessages().filter(message => message && message.content).map((message) => {
            const { hasThink, thinkContent, actualContent, isThinking } = parseThinkContent(message.content || '');
            
            return (
              <div key={message.id} className="flex space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    🤖
                  </div>
                </div>
                
                {/* Message Content */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{message.agentName}</span>
                    <span className="text-xs text-gray-500">
                      Round {message.round} • {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  
                  {hasThink && (
                    <ThinkSection thinkContent={thinkContent} isThinking={isThinking} />
                  )}
                  
                  {actualContent && (
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                      <div className="text-gray-700 prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {actualContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {useStreaming && isDiscussing && (
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white text-sm font-medium">
                  ⚡
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">AI&apos;lar tartışıyor...</span>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                    <span className="text-yellow-700 text-sm">Tartışma devam ediyor...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Answer */}
          {(discussionResult?.finalAnswer || streamingFinalAnswer) && (
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                  ✅
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">Final Cevap</span>
                </div>
                {(() => {
                  const finalAnswer = useStreaming ? streamingFinalAnswer : discussionResult?.finalAnswer;
                  const { hasThink, thinkContent, actualContent, isThinking } = parseThinkContent(finalAnswer || '');
                  
                  return (
                    <>
                      {hasThink && (
                        <ThinkSection thinkContent={thinkContent} isThinking={isThinking} />
                      )}
                      {actualContent && (
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <div className="text-green-800 prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {actualContent}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          
          {/* Scroll target for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="AI modellerinin tartışmasını istediğiniz soruyu yazın..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={isDiscussing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isDiscussing && question.trim() && participants.length >= 2) {
                      startDiscussion();
                    }
                  }
                }}
              />
            </div>
            <button
              onClick={startDiscussion}
              disabled={isDiscussing || !question.trim() || participants.length < 2}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Gönder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 