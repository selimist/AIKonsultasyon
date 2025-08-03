@echo off
echo 🤖 AI Konsültasyon - Windows Kurulum Script'i
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js bulunamadı!
    echo 📥 Node.js'i şu adresten indirin: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js bulundu:
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm bulunamadı!
    pause
    exit /b 1
)

echo ✅ npm bulundu:
npm --version

REM Install dependencies
echo 📦 Bağımlılıklar yükleniyor...
npm install

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo 🔧 .env.local dosyası oluşturuluyor...
    copy .env.example .env.local
    echo 📝 Lütfen .env.local dosyasını düzenleyip API key'lerinizi ekleyin!
    echo    notepad .env.local
)

echo 🚀 Uygulama başlatılıyor...
echo 🌐 Tarayıcıda açın: http://localhost:3333
echo ⏹️  Durdurmak için: Ctrl+C

npm run dev 