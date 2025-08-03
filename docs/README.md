# AI Konsültasyon

Yapay zeka modellerini birbiriyle tartıştırarak en doğru cevabı bulun.

## 🎯 Proje Hakkında

AI Konsültasyon, farklı yapay zeka modellerini (GPT-4, Gemini, Claude) aynı soru üzerinde tartışmaya sokarak, fikir birliğine vardıkları en doğru cevabı bulmayı amaçlayan bir multi-agent sistemidir.

### Temel Özellikler

- 🤖 **Multi-Agent Tartışma**: GPT-4, Gemini ve Claude arasında otomatik tartışma
- 🧠 **Akıllı Konsensüs**: Moderator agent ile fikir birliği tespiti
- 💾 **Conversation Hafızası**: Follow-up sorular ve tartışma geçmişi
- 🔄 **Real-time Streaming**: Canlı tartışma takibi
- 🎛️ **Esnek Konfigürasyon**: Model seçimi ve round sayısı ayarları

## 🏗️ Teknoloji Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI Framework**: Vercel AI SDK
- **AI Providers**: OpenAI GPT-4, Google Gemini, Anthropic Claude
- **Local AI**: Ollama desteği (gelecek)

## 🚀 Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn
- API Keys (OpenAI, Google, Anthropic)

### Adımlar

1. **Repository'yi klonlayın**
   ```bash
   git clone <repository-url>
   cd ai-konsultasyon
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Environment variables'ı ayarlayın**
   ```bash
   cp .env.example .env.local
   ```
   
   `.env.local` dosyasını açıp API anahtarlarınızı girin:
   ```env
   OPENAI_API_KEY=your_openai_key_here
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here
   ANTHROPIC_API_KEY=your_claude_key_here
   ```

4. **Uygulamayı çalıştırın**
   ```bash
   npm run dev
   ```

5. **Tarayıcıda açın**
   http://localhost:3000

## 📖 Kullanım

1. **Soru Girin**: Tartışılmasını istediğiniz soruyu yazın
2. **Modelleri Seçin**: Hangi AI modellerinin tartışacağını belirleyin
3. **Tartışmayı Başlatın**: AI'lar sorunuzu round round tartışır
4. **Sonucu Alın**: Fikir birliğine vardıkları final cevabı görün
5. **Follow-up Sorun**: Aynı conversation'da devam edin

## 🔧 Konfigürasyon

### Environment Variables

| Variable | Açıklama | Zorunlu |
|----------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API anahtarı | Evet |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API anahtarı | Evet |
| `ANTHROPIC_API_KEY` | Anthropic Claude API anahtarı | Evet |
| `OLLAMA_BASE_URL` | Ollama sunucu adresi | Hayır |
| `DISCUSSION_MAX_ROUNDS` | Varsayılan max round sayısı | Hayır |

### AI Provider Ayarları

Her provider için ayrı ayrı ayarlar yapılabilir:

- **Temperature**: Yaratıcılık seviyesi (0.0-1.0)
- **Max Tokens**: Maksimum response uzunluğu
- **Model Selection**: Kullanılacak spesifik model

## 📚 API Dokümantasyonu

### Tartışma Başlatma

```http
POST /api/discuss
Content-Type: application/json

{
  "question": "string",
  "selectedProviders": [
    {
      "id": "gpt-4",
      "name": "GPT-4o (OpenAI)",
      "enabled": true
    }
  ],
  "maxRounds": 3,
  "conversationId": "optional-uuid"
}
```

### Conversation Yönetimi

```http
# Tüm conversations'ları listele
GET /api/conversations

# Yeni conversation oluştur
POST /api/conversations
{
  "firstQuestion": "string"
}

# Spesifik conversation'ı getir
GET /api/conversations/{id}

# Conversation'ı sil
DELETE /api/conversations/{id}
```

## 🏭 Mimari

### Agent Sistemi

```
┌─────────────────┐
│   User Input    │
└─────────┬───────┘
          │
┌─────────▼───────┐
│ Discussion      │
│ Engine          │
└─────┬─┬─┬───────┘
      │ │ │
   ┌──▼─▼─▼───┐
   │ Agents   │
   │ • GPT-4  │
   │ • Gemini │
   │ • Claude │
   └──┬─┬─┬───┘
      │ │ │
   ┌──▼─▼─▼───┐
   │Moderator │
   │ Agent    │
   └─────┬────┘
         │
   ┌─────▼────┐
   │ Consensus│
   │ & Result │
   └──────────┘
```

### Data Flow

1. **Input**: Kullanıcı sorusu ve ayarlar
2. **Context**: Conversation geçmişi (varsa)
3. **Round Loop**: Her agent sırayla cevaplar
4. **Consensus Check**: Moderator fikir birliği kontrolü
5. **Output**: Final cevap veya bir sonraki round

## 🧪 Test

```bash
# Unit testler
npm run test

# E2E testler
npm run test:e2e

# Coverage raporu
npm run test:coverage
```

## 📦 Deployment

### Vercel (Önerilen)

1. GitHub'a push edin
2. Vercel'e import edin
3. Environment variables'ı ayarlayın
4. Deploy edin

### Docker

```bash
# Image build
docker build -t ai-konsultasyon .

# Container çalıştır
docker run -p 3000:3000 ai-konsultasyon
```

## 🛠️ Geliştirme

### Yeni Agent Ekleme

1. `src/lib/agents/` klasöründe yeni agent oluşturun
2. `BaseAgent`'ı extend edin
3. `DiscussionEngine`'e kaydedin

### Custom Provider Ekleme

1. Vercel AI SDK'da desteklenen provider'ı kullanın
2. Agent class'ı oluşturun
3. Environment variable ekleyin

## 🐛 Sorun Giderme

### Sık Karşılaşılan Sorunlar

**API Key Hatası**
- Environment variables'ları kontrol edin
- API key'lerin geçerli olduğundan emin olun

**Model Response Hatası**
- Rate limit'lere dikkat edin
- Network bağlantısını kontrol edin

**Memory Sorunları**
- Conversation history'yi temizleyin
- Browser cache'ini silin

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🆘 Destek

- 📧 Email: support@example.com
- 💬 Discord: [Server Linki]
- 📖 Wiki: [Wiki Linki]

## 🗺️ Roadmap

- [ ] Ollama entegrasyonu
- [ ] Database persistency
- [ ] Advanced metrics
- [ ] Multi-language support
- [ ] Plugin sistemi
- [ ] API rate limiting
- [ ] User authentication 