# Environment Variables Kurulum Rehberi

## 📋 Öncelik Sırası

AI Konsültasyon uygulaması environment variables'ları şu öncelik sırasında arar:

1. **🥇 Sistem Environment Variables** (Önerilen)
2. **🥈 .env.local dosyası**
3. **🥉 .env dosyası**

## 🎯 Sistem Environment Variables (Önerilen)

### macOS/Linux (.zshrc veya .bashrc)

```bash
# ~/.zshrc veya ~/.bashrc dosyasına ekleyin
export OPENAI_API_KEY="sk-your-openai-key-here"
export GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key-here"
export ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"

# Optional
export DISCUSSION_MAX_ROUNDS="5"
export OLLAMA_BASE_URL="http://localhost:11434"
```

### Değişiklikleri Aktifleştirme

```bash
# Terminal'i yeniden başlatın veya:
source ~/.zshrc
# veya
source ~/.bashrc

# Kontrol edin:
echo $OPENAI_API_KEY
```

### Windows (PowerShell)

```powershell
# PowerShell profili düzenleyin
notepad $PROFILE

# Aşağıdakileri ekleyin:
$env:OPENAI_API_KEY = "sk-your-openai-key-here"
$env:GOOGLE_GENERATIVE_AI_API_KEY = "your-google-ai-key-here"  
$env:ANTHROPIC_API_KEY = "sk-ant-your-anthropic-key-here"

# PowerShell'i yeniden başlatın
```

## 📝 .env.local Dosyası (Alternatif)

Eğer sistem environment'ı kullanmak istemiyorsanız:

```bash
# Proje root'unda .env.local oluşturun
cp .env.example .env.local

# Düzenleyin:
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
DISCUSSION_MAX_ROUNDS=5
```

## 🔑 API Key'leri Alma

### OpenAI API Key

1. [OpenAI Platform](https://platform.openai.com/) → API Keys
2. "Create new secret key" tıklayın
3. Key'i kopyalayıp güvenle saklayın
4. Format: `sk-...`

### Google AI API Key

1. [Google AI Studio](https://makersuite.google.com/) → Get API key
2. Google Cloud project seçin veya oluşturun
3. API key'i kopyalayın
4. Format: `AIza...`

### Anthropic API Key

1. [Anthropic Console](https://console.anthropic.com/) → Settings → API Keys
2. "Create Key" butonuna tıklayın
3. Key'i kopyalayıp güvenle saklayın
4. Format: `sk-ant-...`

## ✅ Kurulum Doğrulama

### Otomatik Kontrol

Uygulama başladığında otomatik olarak kontrol eder:

```bash
npm run dev
```

Başarılı kurulum:
```
✅ All required environment variables are set
📊 Configuration loaded from: System environment
🤖 Discussion Engine initialized successfully
```

Hatalı kurulum:
```
🚨 Missing required environment variables:
  - OPENAI_API_KEY
  - GOOGLE_GENERATIVE_AI_API_KEY
```

### Manuel Kontrol

```bash
# Node.js ile kontrol
node -e "console.log('OpenAI:', !!process.env.OPENAI_API_KEY)"
node -e "console.log('Google:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY)"
node -e "console.log('Anthropic:', !!process.env.ANTHROPIC_API_KEY)"
```

## 🔧 Sorun Giderme

### Sorun: Environment variables bulunamıyor

**Çözüm 1: Terminal'i yeniden başlatın**
```bash
# Yeni terminal açın veya
source ~/.zshrc
```

**Çözüm 2: Export komutunu kontrol edin**
```bash
# Doğru format:
export OPENAI_API_KEY="key-here"
# Yanlış format:
OPENAI_API_KEY="key-here"  # export eksik
```

**Çözüm 3: Shell tipini kontrol edin**
```bash
echo $SHELL
# /bin/zsh ise ~/.zshrc
# /bin/bash ise ~/.bashrc
```

### Sorun: API Key formatı yanlış

**OpenAI**: `sk-` ile başlamalı
**Google**: `AIza` ile başlamalı  
**Anthropic**: `sk-ant-` ile başlamalı

### Sorun: Permission denied

```bash
# .env.local dosya izinleri
chmod 600 .env.local

# Shell profili izinleri
chmod 644 ~/.zshrc
```

## 🛡️ Güvenlik Best Practices

### ✅ Yapın

- Environment variables'ları sistem seviyesinde tanımlayın
- API key'leri düzenli olarak rotate edin
- `.env.local` dosyasını .gitignore'a ekleyin
- Prodüksiyon ve development key'lerini ayırın

### ❌ Yapmayın

- API key'leri kod içinde hardcode etmeyin
- Key'leri public repository'lerde paylaşmayın
- Screenshot'larda key'leri göstermeyin
- Key'leri email/chat'te paylaşmayın

## 🌍 Farklı Ortamlar

### Development

```bash
export NODE_ENV="development"
export DISCUSSION_MAX_ROUNDS="3"
```

### Production

```bash
export NODE_ENV="production"
export DISCUSSION_MAX_ROUNDS="5"
```

### Vercel Deployment

```bash
# Vercel dashboard'da environment variables
vercel env add OPENAI_API_KEY
vercel env add GOOGLE_GENERATIVE_AI_API_KEY
vercel env add ANTHROPIC_API_KEY
```

## 🔄 Key Rotation

### Adım 1: Yeni key'leri alın
### Adım 2: Test ortamında deneyin
### Adım 3: Production'da güncelleyin
### Adım 4: Eski key'leri devre dışı bırakın

```bash
# Örnek rotation script
#!/bin/bash
echo "🔄 Rotating API keys..."

# Backup old keys
export OLD_OPENAI_KEY=$OPENAI_API_KEY

# Set new keys
export OPENAI_API_KEY="new-key-here"

# Test
npm run test:api

echo "✅ Keys rotated successfully"
```

## 📊 Monitoring

### Environment Status Endpoint

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "openai": true,
    "google": true,
    "anthropic": true
  }
}
```

## 🚀 Quick Start

```bash
# 1. Set system environment variables
export OPENAI_API_KEY="your-key"
export GOOGLE_GENERATIVE_AI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"

# 2. Restart terminal
source ~/.zshrc

# 3. Clone and run
git clone <repo>
cd ai-konsultasyon
npm install
npm run dev

# 4. Verify
# ✅ Environment variables loaded successfully
``` 