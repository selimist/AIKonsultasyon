# Tasarım Dokümantasyonu

## 1. Sistem Mimarisi

### 1.1 High-Level Mimari

```
┌─────────────────────────────────────────────────┐
│                Frontend (React)                 │
├─────────────────────────────────────────────────┤
│            Next.js API Routes                   │
├─────────────────────────────────────────────────┤
│            Discussion Engine                    │
├─────────┬─────────┬─────────┬─────────┬─────────┤
│ GPT-4   │ Gemini  │ Claude  │ Ollama  │Moderator│
│ Agent   │ Agent   │ Agent   │ Agent   │ Agent   │
├─────────┴─────────┴─────────┴─────────┴─────────┤
│         Conversation Manager                    │
├─────────────────────────────────────────────────┤
│         Vercel AI SDK / Provider APIs           │
└─────────────────────────────────────────────────┘
```

### 1.2 Component Hierarchy

```
App
├── HomePage
│   ├── HeroSection
│   ├── FeatureCards
│   └── HowItWorks
├── DiscussionInterface
│   ├── QuestionInput
│   ├── ProviderSelection
│   ├── SettingsPanel
│   ├── DiscussionView
│   │   ├── MessagesList
│   │   ├── ProgressIndicator
│   │   └── ConsensusDisplay
│   └── ConversationHistory
└── ConversationManager
    ├── ConversationList
    ├── ConversationDetail
    └── ExportImport
```

## 2. Veri Modeli

### 2.1 Core Entities

```typescript
// Core Types
interface AIProvider {
  id: string;           // 'gpt-4', 'gemini', 'claude'
  name: string;         // Human readable name
  enabled: boolean;     // Active/inactive
}

interface DiscussionMessage {
  id: string;           // Unique identifier
  agentId: string;      // Which agent sent this
  agentName: string;    // Agent display name
  content: string;      // The actual message
  timestamp: Date;      // When sent
  round: number;        // Which round of discussion
}

interface DiscussionState {
  question: string;     // Original question
  round: number;        // Current round
  maxRounds: number;    // Maximum rounds allowed
  messages: DiscussionMessage[];
  participants: AIProvider[];
  status: 'idle' | 'discussing' | 'completed' | 'error';
  finalAnswer?: string; // Consensus answer
}

// Memory System
interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  discussions: DiscussionState[];
}

interface FollowUpContext {
  originalQuestion: string;
  previousAnswers: string[];
  conversationHistory: DiscussionMessage[];
}
```

### 2.2 Data Flow

```
User Input → Validation → Context Building → Agent Loop → Consensus Check → Response
     ↓              ↓              ↓              ↓              ↓              ↓
  Question      Sanitize     Previous        Parallel       Moderator      Final
  + Config      + Format     Answers         Requests       Analysis       Answer
```

## 3. Agent Sistemi

### 3.1 Agent Architecture

```typescript
abstract class BaseAgent {
  abstract id: string;
  abstract name: string;
  
  abstract generateResponse(
    question: string,
    previousMessages: string[],
    round: number,
    context?: FollowUpContext
  ): Promise<AgentResponse>;
  
  protected buildPrompt(): string;
  protected formatContext(): string;
}
```

### 3.2 Agent Implementations

#### GPT-4 Agent
- **Model**: `gpt-4o`
- **Provider**: OpenAI
- **Characteristics**: Balanced, analytical
- **Temperature**: 0.7
- **Max Tokens**: 8000

#### Gemini Agent
- **Model**: `gemini-2.0-flash-exp`
- **Provider**: Google
- **Characteristics**: Creative, diverse perspectives
- **Temperature**: 0.7
- **Max Tokens**: 8000

#### Claude Agent
- **Model**: `claude-3-5-sonnet`
- **Provider**: Anthropic
- **Characteristics**: Thoughtful, ethical considerations
- **Temperature**: 0.7
- **Max Tokens**: 8000

#### Moderator Agent
- **Model**: `gpt-4o` (specialized prompts)
- **Purpose**: Consensus analysis
- **Temperature**: 0.3 (more deterministic)
- **Max Tokens**: 4000

### 3.3 Prompt Engineering

#### Base Prompt Structure
```
[CONTEXT SECTION]
- Previous conversation history
- Follow-up question indicators
- Related previous answers

[QUESTION SECTION]
- Current question
- Question type identification

[INSTRUCTIONS SECTION]
- Agent role definition
- Response format requirements
- Consensus guidance

[CONSTRAINTS SECTION]
- Length limitations
- Content guidelines
- Response structure
```

#### Moderator Prompts
```
ROLE: AI discussion moderator
TASK: Analyze agent responses for consensus
OUTPUT FORMAT:
- CONSENSUS: [EVET/HAYIR]
- REASONING: [Analysis]
- FINAL_ANSWER: [If consensus reached]
```

## 4. Discussion Engine

### 4.1 Discussion Flow

```
1. Initialize Discussion
   ├── Validate inputs
   ├── Load conversation context
   └── Setup agent configurations

2. Round Loop
   ├── For each enabled provider:
   │   ├── Build context-aware prompt
   │   ├── Generate response
   │   └── Store message
   ├── Check consensus after round
   └── Continue or terminate

3. Finalize
   ├── Save to conversation
   ├── Generate summary
   └── Return results
```

### 4.2 Consensus Algorithm

```typescript
async analyzeConsensus(messages: DiscussionMessage[]): Promise<{
  hasConsensus: boolean;
  finalAnswer?: string;
  reasoning: string;
}> {
  // 1. Extract last round messages
  // 2. Send to moderator for analysis
  // 3. Parse structured response
  // 4. Return consensus decision
}
```

### 4.3 Error Handling

```
API Failures → Graceful degradation
Rate Limits → Retry with backoff
Network Issues → Fallback providers
Invalid Responses → Skip agent in round
Consensus Timeout → Force completion
```

## 5. UI/UX Tasarım

### 5.1 Design Principles

- **Clarity**: Clear information hierarchy
- **Responsiveness**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance
- **Progressive Enhancement**: Works without JS
- **Visual Feedback**: Loading states, progress indicators

### 5.2 Color Palette

```css
/* Primary Colors */
--blue-600: #2563eb;    /* Primary action */
--purple-600: #9333ea;  /* Secondary action */
--green-600: #16a34a;   /* Success states */
--orange-600: #ea580c;  /* Warning states */
--red-600: #dc2626;     /* Error states */

/* Neutral Colors */
--gray-50: #f9fafb;     /* Background */
--gray-100: #f3f4f6;    /* Light background */
--gray-600: #4b5563;    /* Secondary text */
--gray-900: #111827;    /* Primary text */
```

### 5.3 Typography

```css
/* Headings */
.text-5xl { font-size: 3rem; }      /* Main title */
.text-3xl { font-size: 1.875rem; }  /* Section titles */
.text-xl { font-size: 1.25rem; }    /* Card titles */

/* Body Text */
.text-base { font-size: 1rem; }     /* Main content */
.text-sm { font-size: 0.875rem; }   /* Secondary content */

/* Font Weights */
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
```

### 5.4 Layout System

```css
/* Grid System */
.grid-cols-1        /* Mobile: Single column */
.md:grid-cols-3     /* Tablet: Three columns */
.lg:grid-cols-4     /* Desktop: Four columns */

/* Spacing */
.space-y-4          /* Vertical spacing */
.gap-6              /* Grid gap */
.p-6                /* Padding */
.mb-6               /* Margin bottom */
```

## 6. API Tasarımı

### 6.1 REST Endpoints

```
GET    /api/discuss              # Get available providers
POST   /api/discuss              # Start discussion
POST   /api/discuss/stream       # Start streaming discussion

GET    /api/conversations        # List conversations
POST   /api/conversations        # Create conversation
GET    /api/conversations/:id    # Get conversation
DELETE /api/conversations/:id    # Delete conversation
```

### 6.2 Request/Response Formats

#### Start Discussion
```json
// Request
{
  "question": "string",
  "selectedProviders": [
    { "id": "gpt-4", "name": "GPT-4o", "enabled": true }
  ],
  "maxRounds": 3,
  "conversationId": "optional-uuid"
}

// Response
{
  "question": "string",
  "round": 2,
  "maxRounds": 3,
  "messages": [...],
  "participants": [...],
  "status": "completed",
  "finalAnswer": "string",
  "conversationId": "uuid"
}
```

#### Streaming Response
```
data: {"type": "message", "data": {...}}
data: {"type": "consensus", "data": {...}}
data: {"type": "complete"}
```

### 6.3 Error Responses

```json
{
  "error": "string",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "question",
    "message": "Question is required"
  }
}
```

## 7. State Management

### 7.1 Component State

```typescript
// DiscussionInterface State
interface DiscussionState {
  question: string;
  providers: AIProvider[];
  selectedProviders: AIProvider[];
  maxRounds: number;
  isDiscussing: boolean;
  discussionResult: DiscussionState | null;
  streamingMessages: DiscussionMessage[];
  useStreaming: boolean;
}
```

### 7.2 Global State (Future)

```typescript
// Context API for global state
interface GlobalState {
  currentConversation: Conversation | null;
  conversations: ConversationSummary[];
  user: User | null;
  settings: AppSettings;
}
```

## 8. Performance Optimizations

### 8.1 Frontend Optimizations

- **Code Splitting**: Route-based chunks
- **Lazy Loading**: Dynamic imports for heavy components
- **Memoization**: React.memo for expensive re-renders
- **Virtual Scrolling**: For long message lists
- **Image Optimization**: Next.js Image component

### 8.2 Backend Optimizations

- **API Caching**: Response caching where appropriate
- **Request Batching**: Group API calls
- **Connection Pooling**: Reuse HTTP connections
- **Streaming**: Real-time updates
- **Compression**: Gzip responses

### 8.3 AI API Optimizations

- **Prompt Optimization**: Efficient token usage
- **Parallel Requests**: Concurrent agent calls
- **Response Caching**: Cache identical questions
- **Fallback Providers**: Handle rate limits
- **Token Management**: Monitor usage

## 9. Security Considerations

### 9.1 API Security

- **Environment Variables**: Secure API key storage
- **Input Validation**: Sanitize all inputs
- **Rate Limiting**: Prevent abuse
- **CORS Configuration**: Restrict origins
- **HTTPS Only**: Secure transport

### 9.2 Data Privacy

- **No Persistent Storage**: Conversations in memory
- **Anonymous Usage**: No user tracking
- **Data Sanitization**: Clean sensitive data
- **Audit Logs**: Track API usage

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
// Agent Tests
describe('OpenAIAgent', () => {
  it('should generate response with context');
  it('should handle API errors gracefully');
  it('should format prompts correctly');
});

// Engine Tests
describe('DiscussionEngine', () => {
  it('should manage discussion rounds');
  it('should detect consensus');
  it('should handle streaming');
});
```

### 10.2 Integration Tests

- API endpoint testing
- Agent integration testing
- Conversation flow testing
- Error scenario testing

### 10.3 E2E Tests

- Complete user journey
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarks

## 11. Deployment Architecture

### 11.1 Vercel Deployment

```yaml
# vercel.json
{
  "framework": "nextjs",
  "env": {
    "OPENAI_API_KEY": "@openai-key",
    "GOOGLE_GENERATIVE_AI_API_KEY": "@google-key",
    "ANTHROPIC_API_KEY": "@anthropic-key"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### 11.2 Environment Configuration

```bash
# Production Environment Variables
OPENAI_API_KEY=prod_key
GOOGLE_GENERATIVE_AI_API_KEY=prod_key
ANTHROPIC_API_KEY=prod_key
DISCUSSION_MAX_ROUNDS=5
NODE_ENV=production
NEXT_PUBLIC_APP_NAME="AI Konsültasyon"
```

## 12. Monitoring ve Analytics

### 12.1 Key Metrics

- **Usage Metrics**: Questions per day, active users
- **Performance Metrics**: Response times, error rates
- **AI Metrics**: Consensus rates, token usage
- **Business Metrics**: User satisfaction, retention

### 12.2 Error Tracking

- **Client Errors**: JavaScript errors, API failures
- **Server Errors**: API timeouts, rate limits
- **AI Errors**: Model failures, consensus failures
- **User Experience**: Loading times, completion rates 