# 🤖 AI Konsültasyon

Yapay zeka modellerini birbiriyle tartıştırarak en doğru cevabı bulun.

## 🎯 Proje Hakkında

AI Konsültasyon, farklı yapay zeka modellerini (GPT-4, Gemini, Claude, ya da lokal modeller için Ollama) aynı soru üzerinde tartışmaya sokarak, fikir birliğine vardıkları en doğru cevabı bulmayı amaçlayan bir multi-agent sistemidir.

### ✨ Temel Özellikler

- 🤖 **Multi-Agent Tartışma**: GPT-4, Gemini, Claude ve Ollama arasında otomatik tartışma
- 🧠 **Akıllı Konsensüs**: Moderator agent ile fikir birliği tespiti
- 💾 **Conversation Hafızası**: Follow-up sorular ve tartışma geçmişi
- 🔄 **Real-time Streaming**: Canlı tartışma takibi
- 🎛️ **Esnek Konfigürasyon**: Model seçimi ve round sayısı ayarları

## 🚀 Hızlı Başlangıç

### 1. Environment Variables (Öncelikli)

**Sistem environment variables (Önerilen):**

```bash
# ~/.zshrc veya ~/.bashrc dosyasına ekleyin
export OPENAI_API_KEY="sk-your-openai-key-here"
export GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key-here"
export ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"

# Terminal'i yeniden başlatın
source ~/.zshrc
```

**Alternatif - .env.local dosyası (Önerilen):**

```bash
# Kolay kurulum (önerilen):
cp .env.example .env.local
# Sonra .env.local dosyasını düzenleyip API key'lerinizi ekleyin

# VEYA manuel kurulum:
touch .env.local
# .env.local dosyasına şu içeriği ekleyin:
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
NEXT_PUBLIC_APP_NAME=AI Konsültasyon
DISCUSSION_MAX_ROUNDS=3
```

**Not:** `.env.local` dosyası `.gitignore`'da olduğu için GitHub'a yüklenmez, API key'leriniz güvenli kalır.

### 2. Kurulum ve Çalıştırma

```bash
# Repository'yi klonlayın
git clone <repository-url>
cd ai-konsultasyon

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Tarayıcıda açın: http://localhost:3000
```

### 3. Environment Doğrulama

Başarılı kurulum:
```
✅ All required environment variables are set
📊 Configuration loaded from: System environment
🤖 Discussion Engine initialized successfully
```

## 🔑 API Key'leri Alma

### OpenAI API Key
1. [OpenAI Platform](https://platform.openai.com/) → API Keys
2. "Create new secret key" → Key'i kopyalayın

### Google AI API Key  
1. [Google AI Studio](https://makersuite.google.com/) → Get API key
2. Key'i kopyalayın

### Anthropic API Key
1. [Anthropic Console](https://console.anthropic.com/) → Settings → API Keys
2. "Create Key" → Key'i kopyalayın

## 🏗️ Teknoloji Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI Framework**: Vercel AI SDK
- **AI Providers**: OpenAI GPT-4, Google Gemini, Anthropic Claude
- **Real-time**: Server-Sent Events

## 📖 Kullanım

### Temel Tartışma
1. Sorunuzu girin
2. AI modellerini seçin (GPT-4, Gemini, Claude)
3. Round sayısını ayarlayın
4. "Tartışmayı Başlat" butonuna tıklayın
5. AI'lar tartışarak fikir birliğine varana kadar devam eder
6. Final cevabı alın

### Follow-up Sorular
- Conversation hafızası sayesinde devam soruları sorabilirsiniz
- AI'lar önceki context'i hatırlayarak tutarlı cevaplar verir

### Streaming Tartışma
- "Canlı Tartışma" seçeneği ile real-time takip
- Her agent'ın cevabını anlık olarak görebilirsiniz

## 🔧 Konfigürasyon

### Environment Variables

| Variable | Açıklama | Zorunlu | Default |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API anahtarı | ✅ | - |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API anahtarı | ✅ | - |
| `ANTHROPIC_API_KEY` | Anthropic Claude API anahtarı | ✅ | - |
| `DISCUSSION_MAX_ROUNDS` | Maksimum round sayısı | ❌ | 3 |
| `OLLAMA_BASE_URL` | Ollama sunucu adresi | ❌ | http://localhost:11434 |

### Health Check

```bash
curl http://localhost:3000/api/health
```

## 📚 Dokümantasyon

- 📋 [Requirements](docs/REQUIREMENTS.md) - Detaylı gereksinim analizi
- 🏗️ [Design](docs/DESIGN.md) - Sistem mimarisi ve tasarım kararları  
- 🔌 [API](docs/API.md) - Complete API reference
- 🚀 [Deployment](docs/DEPLOYMENT.md) - Production deployment rehberi
- ⚙️ [Environment Setup](docs/ENVIRONMENT_SETUP.md) - Environment variables kurulum rehberi

## 🛠️ Geliştirme

### Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   └── page.tsx           # Ana sayfa
├── components/            # React bileşenleri
├── lib/                   # Core business logic
│   ├── agents/           # AI agent implementations
│   ├── config/           # Configuration management
│   └── types.ts          # TypeScript type definitions
└── docs/                 # Dokümantasyon
```

### Yeni Agent Ekleme

```typescript
// src/lib/agents/custom-agent.ts
import { BaseAgent } from './base-agent';

export class CustomAgent extends BaseAgent {
  id = 'custom';
  name = 'Custom AI';
  
  async generateResponse(question, previousMessages, round, context) {
    // Implementation
  }
}
```

### Test

```bash
# Unit testler
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📦 Deployment

### Vercel (Önerilen)

```bash
# Vercel CLI
npm i -g vercel
vercel login
vercel

# Environment variables ayarlayın Vercel dashboard'da
```

### Docker

```bash
docker build -t ai-konsultasyon .
docker run -p 3000:3000 ai-konsultasyon
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 🐛 Sorun Giderme

### Environment Variables Bulunamıyor

```bash
# Environment'ı kontrol edin
echo $OPENAI_API_KEY

# Terminal'i yeniden başlatın
source ~/.zshrc

# Manuel kontrol
node -e "console.log('OpenAI:', !!process.env.OPENAI_API_KEY)"
```

### API Hatası

- API key'lerin doğru format olduğunu kontrol edin
- Rate limit'lere dikkat edin
- Network bağlantısını kontrol edin

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🆘 Destek

- 📧 Email: support@example.com
- 💬 Issues: GitHub Issues
- 📖 Docs: [Dokümantasyon](docs/)

## 🗺️ Roadmap

- [ ] Ollama entegrasyonu (local models)
- [ ] Database persistency  
- [ ] User authentication
- [ ] Advanced analytics
- [ ] Plugin sistemi
- [ ] Multi-language support

---

**🎉 Proje kullanıma hazır!** Environment variables'ınızı ayarlayıp `npm run dev` ile başlayın.
