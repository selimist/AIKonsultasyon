# API Dokümantasyonu

## 1. Genel Bilgiler

### Base URL
```
Production: https://ai-konsultasyon.vercel.app/api
Development: http://localhost:3000/api
```

### Authentication
Bu API şu anda public kullanımdadır. Gelecekte API key authentication eklenebilir.

### Content Type
Tüm POST/PUT istekleri `application/json` content type kullanmalıdır.

### Error Handling
Tüm hata yanıtları aşağıdaki format kullanır:

```json
{
  "error": "string",
  "code": "ERROR_CODE",
  "details": {
    "field": "fieldName",
    "message": "Detailed error message"
  }
}
```

## 2. Discussion API

### 2.1 Get Available Providers

Kullanılabilir AI provider'ları listeler.

```http
GET /api/discuss
```

#### Response

```json
{
  "providers": [
    {
      "id": "gpt-4",
      "name": "GPT-4o (OpenAI)",
      "enabled": true
    },
    {
      "id": "gemini",
      "name": "Gemini 2.0 Flash (Google)",
      "enabled": true
    },
    {
      "id": "claude",
      "name": "Claude 3.5 Sonnet (Anthropic)",
      "enabled": true
    }
  ]
}
```

### 2.2 Start Discussion

Yeni bir AI tartışması başlatır.

```http
POST /api/discuss
Content-Type: application/json
```

#### Request Body

```json
{
  "question": "React vs Vue hangisi daha iyi?",
  "selectedProviders": [
    {
      "id": "gpt-4",
      "name": "GPT-4o (OpenAI)",
      "enabled": true
    },
    {
      "id": "gemini",
      "name": "Gemini 2.0 Flash (Google)",
      "enabled": true
    }
  ],
  "maxRounds": 3,
  "conversationId": "optional-conversation-uuid"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `question` | string | Yes | Tartışılacak soru (10-5000 karakter) |
| `selectedProviders` | array | Yes | Seçilen AI provider'ları |
| `maxRounds` | number | No | Maksimum round sayısı (1-10, default: 3) |
| `conversationId` | string | No | Mevcut conversation ID (follow-up için) |

#### Response

```json
{
  "question": "React vs Vue hangisi daha iyi?",
  "round": 3,
  "maxRounds": 3,
  "messages": [
    {
      "id": "uuid-1",
      "agentId": "gpt-4",
      "agentName": "GPT-4o",
      "content": "React ve Vue karşılaştırmasında...",
      "timestamp": "2024-01-15T10:30:00Z",
      "round": 1
    }
  ],
  "participants": [
    {
      "id": "gpt-4",
      "name": "GPT-4o (OpenAI)",
      "enabled": true
    }
  ],
  "status": "completed",
  "finalAnswer": "Her iki framework'ün de avantajları var...",
  "conversationId": "uuid-conversation"
}
```

#### Error Responses

```json
// 400 Bad Request
{
  "error": "Question and at least one AI provider are required",
  "code": "VALIDATION_ERROR"
}

// 400 Bad Request
{
  "error": "At least one valid provider must be enabled",
  "code": "INVALID_PROVIDERS"
}

// 500 Internal Server Error
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

### 2.3 Start Streaming Discussion

Real-time streaming ile tartışma başlatır.

```http
POST /api/discuss/stream
Content-Type: application/json
```

#### Request Body
Same as `/api/discuss`

#### Response

Server-Sent Events (SSE) formatında streaming response:

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type": "message", "data": {"id": "uuid", "agentName": "GPT-4o", "content": "..."}}

data: {"type": "consensus", "data": {"hasConsensus": false}}

data: {"type": "message", "data": {"id": "uuid", "agentName": "Gemini", "content": "..."}}

data: {"type": "consensus", "data": {"hasConsensus": true, "finalAnswer": "..."}}

data: {"type": "complete"}
```

#### Event Types

| Type | Description | Data |
|------|-------------|------|
| `message` | Yeni agent mesajı | `DiscussionMessage` |
| `consensus` | Konsensüs durumu | `{hasConsensus: boolean, finalAnswer?: string}` |
| `complete` | Tartışma tamamlandı | None |
| `error` | Hata oluştu | `{message: string}` |

## 3. Conversations API

### 3.1 List Conversations

Tüm conversation'ları listeler.

```http
GET /api/conversations
```

#### Response

```json
{
  "conversations": [
    {
      "id": "uuid-1",
      "title": "React vs Vue hangisi daha iyi?",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "discussionCount": 2,
      "lastQuestion": "Peki performance açısından nasıl?"
    }
  ]
}
```

### 3.2 Create Conversation

Yeni conversation oluşturur.

```http
POST /api/conversations
Content-Type: application/json
```

#### Request Body

```json
{
  "firstQuestion": "Yapay zeka gelecekte nasıl gelişecek?"
}
```

#### Response

```json
{
  "conversation": {
    "id": "uuid-new",
    "title": "Yapay zeka gelecekte nasıl gelişecek?",
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z",
    "discussions": []
  }
}
```

### 3.3 Get Conversation

Spesifik conversation'ı detaylarıyla getirir.

```http
GET /api/conversations/{id}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Conversation UUID |

#### Response

```json
{
  "conversation": {
    "id": "uuid-1",
    "title": "React vs Vue hangisi daha iyi?",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "discussions": [
      {
        "question": "React vs Vue hangisi daha iyi?",
        "round": 2,
        "maxRounds": 3,
        "messages": [...],
        "participants": [...],
        "status": "completed",
        "finalAnswer": "..."
      }
    ]
  }
}
```

#### Error Responses

```json
// 404 Not Found
{
  "error": "Conversation not found",
  "code": "NOT_FOUND"
}
```

### 3.4 Delete Conversation

Conversation'ı siler.

```http
DELETE /api/conversations/{id}
```

#### Response

```json
{
  "success": true
}
```

## 4. Data Types

### 4.1 Core Types

#### AIProvider
```typescript
{
  id: string;           // 'gpt-4', 'gemini', 'claude'
  name: string;         // Human readable name
  enabled: boolean;     // Active/inactive
}
```

#### DiscussionMessage
```typescript
{
  id: string;           // Unique identifier
  agentId: string;      // Which agent sent this
  agentName: string;    // Agent display name
  content: string;      // The actual message
  timestamp: string;    // ISO date string
  round: number;        // Which round of discussion
}
```

#### DiscussionState
```typescript
{
  question: string;     // Original question
  round: number;        // Current round
  maxRounds: number;    // Maximum rounds allowed
  messages: DiscussionMessage[];
  participants: AIProvider[];
  status: 'idle' | 'discussing' | 'completed' | 'error';
  finalAnswer?: string; // Consensus answer
}
```

#### Conversation
```typescript
{
  id: string;
  title: string;
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
  discussions: DiscussionState[];
}
```

#### ConversationSummary
```typescript
{
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  discussionCount: number;
  lastQuestion: string;
}
```

## 5. Rate Limiting

### Current Limits
- **Per IP**: 100 requests per hour
- **Per Discussion**: Maximum 10 rounds
- **Per Question**: 5000 characters maximum

### Future Limits (with API Keys)
- **Free Tier**: 10 discussions per day
- **Pro Tier**: 100 discussions per day
- **Enterprise**: Unlimited

## 6. SDK Examples

### 6.1 JavaScript/TypeScript

```typescript
// Start a discussion
async function startDiscussion(question: string, providers: AIProvider[]) {
  const response = await fetch('/api/discuss', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      selectedProviders: providers,
      maxRounds: 3
    })
  });
  
  return await response.json();
}

// Start streaming discussion
async function startStreamingDiscussion(
  question: string, 
  providers: AIProvider[],
  onMessage: (message: DiscussionMessage) => void
) {
  const response = await fetch('/api/discuss/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      selectedProviders: providers,
      maxRounds: 3
    })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.type === 'message') {
          onMessage(data.data);
        }
      }
    }
  }
}
```

### 6.2 Python

```python
import requests
import json

def start_discussion(question: str, providers: list) -> dict:
    url = "http://localhost:3000/api/discuss"
    payload = {
        "question": question,
        "selectedProviders": providers,
        "maxRounds": 3
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# Example usage
providers = [
    {"id": "gpt-4", "name": "GPT-4o", "enabled": True},
    {"id": "gemini", "name": "Gemini", "enabled": True}
]

result = start_discussion("What is the future of AI?", providers)
print(result["finalAnswer"])
```

### 6.3 cURL

```bash
# Start discussion
curl -X POST http://localhost:3000/api/discuss \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the future of AI?",
    "selectedProviders": [
      {"id": "gpt-4", "name": "GPT-4o", "enabled": true},
      {"id": "gemini", "name": "Gemini", "enabled": true}
    ],
    "maxRounds": 3
  }'

# Get conversations
curl http://localhost:3000/api/conversations

# Delete conversation
curl -X DELETE http://localhost:3000/api/conversations/uuid-here
```

## 7. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_PROVIDERS` | 400 | No valid providers selected |
| `QUESTION_TOO_LONG` | 400 | Question exceeds character limit |
| `QUESTION_TOO_SHORT` | 400 | Question below minimum length |
| `MAX_ROUNDS_EXCEEDED` | 400 | Round count exceeds limit |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_API_ERROR` | 502 | External AI API failed |
| `INTERNAL_ERROR` | 500 | Server internal error |

## 8. Changelog

### v1.0.0 (Current)
- Initial API release
- Basic discussion functionality
- Conversation management
- Streaming support

### Future Versions

#### v1.1.0 (Planned)
- Authentication with API keys
- Rate limiting per user
- Export/import endpoints

#### v1.2.0 (Planned)
- Ollama support
- Custom agent configurations
- Advanced analytics endpoints

#### v2.0.0 (Future)
- Database persistence
- User management
- Multi-language support 