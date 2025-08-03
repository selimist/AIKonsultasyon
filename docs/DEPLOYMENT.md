# Deployment Rehberi

## 1. Vercel Deployment (Önerilen)

### 1.1 Hızlı Deployment

1. **GitHub'a Push Edin**
   ```bash
   git add .
   git commit -m "AI Konsültasyon deployment ready"
   git push origin main
   ```

2. **Vercel'e Import Edin**
   - [Vercel Dashboard](https://vercel.com)'a gidin
   - "New Project" butonuna tıklayın
   - GitHub repository'sini seçin
   - Framework'ü "Next.js" olarak belirleyin

3. **Environment Variables Ayarlayın**
   ```
   OPENAI_API_KEY=your_openai_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
   ANTHROPIC_API_KEY=your_anthropic_key
   DISCUSSION_MAX_ROUNDS=5
   NODE_ENV=production
   ```

4. **Deploy Edin**
   - "Deploy" butonuna tıklayın
   - 2-3 dakika bekleyin
   - Canlı URL'yi alın

### 1.2 Vercel CLI ile Deployment

```bash
# Vercel CLI yükleyin
npm i -g vercel

# Login olun
vercel login

# Projeyi deploy edin
vercel

# Environment variables ayarlayın
vercel env add OPENAI_API_KEY
vercel env add GOOGLE_GENERATIVE_AI_API_KEY
vercel env add ANTHROPIC_API_KEY

# Production deploy
vercel --prod
```

### 1.3 Vercel Configuration

`vercel.json` dosyası:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "env": {
    "DISCUSSION_MAX_ROUNDS": "5"
  }
}
```

## 2. Docker Deployment

### 2.1 Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 2.2 Docker Compose

```yaml
version: '3.8'

services:
  ai-konsultasyon:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DISCUSSION_MAX_ROUNDS=5
    restart: unless-stopped
    
  # Optional: Add reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - ai-konsultasyon
    restart: unless-stopped
```

### 2.3 Build ve Run

```bash
# Build image
docker build -t ai-konsultasyon .

# Run container
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e GOOGLE_GENERATIVE_AI_API_KEY=your_key \
  -e ANTHROPIC_API_KEY=your_key \
  ai-konsultasyon

# Docker Compose ile
docker-compose up -d
```

## 3. Railway Deployment

### 3.1 Railway Setup

```bash
# Railway CLI yükleyin
npm install -g @railway/cli

# Login olun
railway login

# Proje oluşturun
railway init

# Environment variables ayarlayın
railway variables set OPENAI_API_KEY=your_key
railway variables set GOOGLE_GENERATIVE_AI_API_KEY=your_key
railway variables set ANTHROPIC_API_KEY=your_key

# Deploy edin
railway up
```

### 3.2 Railway Configuration

`railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

## 4. Netlify Deployment

### 4.1 Netlify Setup

```bash
# Netlify CLI yükleyin
npm install -g netlify-cli

# Login olun
netlify login

# Site oluşturun
netlify init

# Environment variables ayarlayın
netlify env:set OPENAI_API_KEY your_key
netlify env:set GOOGLE_GENERATIVE_AI_API_KEY your_key
netlify env:set ANTHROPIC_API_KEY your_key

# Deploy edin
netlify deploy --prod
```

### 4.2 Netlify Configuration

`netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  node_bundler = "esbuild"
```

## 5. Environment Variables Yönetimi

### 5.1 Gerekli Variables

| Variable | Açıklama | Zorunlu | Example |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API Key | Evet | `sk-...` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API Key | Evet | `AIza...` |
| `ANTHROPIC_API_KEY` | Anthropic API Key | Evet | `sk-ant-...` |
| `DISCUSSION_MAX_ROUNDS` | Max rounds | Hayır | `5` |
| `NODE_ENV` | Environment | Hayır | `production` |

### 5.2 API Keys Alma

#### OpenAI API Key
1. [OpenAI Platform](https://platform.openai.com/)'a gidin
2. Account → API Keys
3. "Create new secret key" tıklayın
4. Key'i kopyalayın ve güvenle saklayın

#### Google AI API Key
1. [Google AI Studio](https://makersuite.google.com/)'ya gidin
2. "Get API key" butonuna tıklayın
3. Key'i kopyalayın

#### Anthropic API Key
1. [Anthropic Console](https://console.anthropic.com/)'a gidin
2. Settings → API Keys
3. "Create Key" butonuna tıklayın

### 5.3 Security Best Practices

- **API key'leri asla kodda hardcode etmeyin**
- **Environment variables kullanın**
- **Key'leri güvenli yerlerde saklayın**
- **Key'leri düzenli olarak rotate edin**
- **Rate limiting uygulayın**

## 6. Production Checklist

### 6.1 Pre-deployment

- [ ] Tüm environment variables ayarlandı
- [ ] API key'ler test edildi
- [ ] Build hatasız çalışıyor
- [ ] TypeScript check'leri geçiyor
- [ ] Linting hataları düzeltildi

### 6.2 Post-deployment

- [ ] Health check endpoint çalışıyor
- [ ] Tüm API endpoints test edildi
- [ ] Error tracking aktif
- [ ] Monitoring dashboard kuruldu
- [ ] Backup stratejisi belirlendi

## 7. Monitoring ve Logging

### 7.1 Vercel Analytics

```bash
# Vercel Analytics ekleyin
npm install @vercel/analytics

# Next.js'e entegre edin
// _app.tsx
import { Analytics } from '@vercel/analytics/react'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
```

### 7.2 Error Tracking (Sentry)

```bash
# Sentry kurulumu
npm install @sentry/nextjs

# Configuration
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 7.3 Custom Health Check

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  // API key'lerin varlığını kontrol et
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const status = hasOpenAI && hasGoogle && hasAnthropic ? 'healthy' : 'unhealthy';

  res.status(200).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      openai: hasOpenAI,
      google: hasGoogle,
      anthropic: hasAnthropic
    }
  });
}
```

## 8. Performance Optimization

### 8.1 Next.js Optimizations

```javascript
// next.config.js
module.exports = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['example.com'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
    ]
  },
}
```

### 8.2 CDN Configuration

```javascript
// Vercel edge functions
export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sin1', 'syd1'], // Multiple regions
}
```

## 9. Backup ve Recovery

### 9.1 Conversation Backup

```typescript
// Backup utility
export async function backupConversations() {
  const conversations = conversationManager.exportConversations();
  
  // Send to cloud storage
  await uploadToS3(conversations);
  
  // Or save locally
  fs.writeFileSync(`backup-${Date.now()}.json`, conversations);
}

// Automated backup (cron job)
// vercel.json
{
  "crons": [
    {
      "path": "/api/backup",
      "schedule": "0 2 * * *" // Daily at 2 AM
    }
  ]
}
```

## 10. Scaling Strategies

### 10.1 Horizontal Scaling

- **Load Balancing**: Multiple Vercel regions
- **Database Sharding**: Future database implementation
- **Microservices**: API separation

### 10.2 Vertical Scaling

- **Memory Optimization**: Conversation cleanup
- **CPU Optimization**: Parallel API calls
- **Storage Optimization**: Efficient data structures

### 10.3 Cost Optimization

- **API Usage Monitoring**: Token tracking
- **Caching Strategies**: Response caching
- **Request Batching**: Combine API calls 