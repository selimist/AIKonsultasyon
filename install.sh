#!/bin/bash

echo "🤖 AI Konsültasyon - Kurulum Script'i"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js bulunamadı!"
    echo "📥 Node.js'i şu adresten indirin: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js bulundu: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm bulunamadı!"
    exit 1
fi

echo "✅ npm bulundu: $(npm --version)"

# Install dependencies
echo "📦 Bağımlılıklar yükleniyor..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 .env.local dosyası oluşturuluyor..."
    cp .env.example .env.local
    echo "📝 Lütfen .env.local dosyasını düzenleyip API key'lerinizi ekleyin!"
    echo "   nano .env.local"
fi

echo "🚀 Uygulama başlatılıyor..."
echo "🌐 Tarayıcıda açın: http://localhost:3333"
echo "⏹️  Durdurmak için: Ctrl+C"

npm run dev 