# 🚀 Panduan Deploy SPK Beasiswa - GRATIS

## Platform Gratis Terbaik untuk Deploy

### 1. **VERCEL** (Recommended) - Frontend + Backend
- ✅ **Gratis selamanya** untuk personal projects
- ✅ **Otomatis deploy** dari GitHub
- ✅ **Custom domain** gratis
- ✅ **HTTPS** otomatis
- ✅ **Serverless functions** untuk backend

### 2. **NETLIFY** - Frontend + Backend Functions
- ✅ **Gratis** dengan fitur lengkap
- ✅ **Deploy otomatis** dari GitHub
- ✅ **Form handling** gratis
- ✅ **Serverless functions**

### 3. **RAILWAY** - Full Stack
- ✅ **$5 credit gratis** per bulan
- ✅ **Database** included
- ✅ **Auto deploy** dari GitHub

## 🎯 Rekomendasi: Deploy dengan VERCEL

### Step 1: Persiapan Frontend (React)
```bash
cd my-app-main
npm run build
```

### Step 2: Deploy ke Vercel
1. **Daftar di Vercel**: https://vercel.com
2. **Connect GitHub**: Import repository `spk-beasiswa`
3. **Configure Build**:
   - Framework: `React`
   - Root Directory: `my-app-main`
   - Build Command: `npm run build`
   - Output Directory: `build`

### Step 3: Deploy Backend sebagai Serverless Functions
1. **Buat folder** `api/` di root project
2. **Pindahkan backend** ke serverless functions
3. **Configure** `vercel.json`

## 📁 Struktur untuk Vercel
```
spk-beasiswa/
├── my-app-main/          # Frontend React
├── api/                  # Backend Serverless Functions
│   ├── applicants.js     # API endpoints
│   ├── selection.js      # C4.5 endpoints
│   └── reports.js        # Report endpoints
├── vercel.json           # Vercel configuration
└── package.json          # Root package.json
```

## ⚡ Quick Deploy Commands

### Option 1: Vercel CLI (Fastest)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from root directory
cd "d:\data warehouse\spkBeasiswa"
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name: spk-beasiswa
# - Directory: ./
# - Override settings? N
```

### Option 2: GitHub Integration
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import `ZidanBagus/spk-beasiswa`
4. Configure settings
5. Deploy!

## 🔧 Configuration Files Needed

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "my-app-main/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "api/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/my-app-main/$1"
    }
  ]
}
```

### package.json (Root)
```json
{
  "name": "spk-beasiswa",
  "version": "1.0.0",
  "scripts": {
    "build": "cd my-app-main && npm install && npm run build"
  }
}
```

## 🌐 Alternative: Deploy Frontend Only (Netlify)

### Quick Netlify Deploy
1. **Drag & Drop**: Build folder ke https://app.netlify.com/drop
2. **GitHub Integration**: Connect repository
3. **Build Settings**:
   - Base directory: `my-app-main`
   - Build command: `npm run build`
   - Publish directory: `my-app-main/build`

## 💾 Database Options (Gratis)

### 1. **Supabase** (PostgreSQL)
- ✅ **500MB** database gratis
- ✅ **Real-time** features
- ✅ **Authentication** built-in

### 2. **PlanetScale** (MySQL)
- ✅ **5GB** storage gratis
- ✅ **Branching** database
- ✅ **Serverless** driver

### 3. **MongoDB Atlas**
- ✅ **512MB** gratis
- ✅ **Cloud** database
- ✅ **Easy** integration

## 🚀 Langkah Cepat Deploy

### 1. Siapkan untuk Deploy
```bash
cd "d:\data warehouse\spkBeasiswa"

# Install Vercel CLI
npm install -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel
```

### 2. Konfigurasi Environment
- Set environment variables di Vercel dashboard
- Configure database connection
- Test API endpoints

### 3. Custom Domain (Optional)
- Beli domain murah di Namecheap/GoDaddy
- Atau gunakan subdomain gratis: `your-app.vercel.app`

## 📱 Hasil Akhir
Setelah deploy, Anda akan mendapat:
- ✅ **URL Live**: `https://spk-beasiswa.vercel.app`
- ✅ **HTTPS** otomatis
- ✅ **Auto deploy** setiap push ke GitHub
- ✅ **Global CDN** untuk performa cepat
- ✅ **Analytics** gratis

## 🔥 Pro Tips
1. **Optimize Build**: Hapus console.log dan unused code
2. **Environment Variables**: Jangan commit API keys
3. **Error Handling**: Tambahkan proper error pages
4. **SEO**: Tambahkan meta tags
5. **Performance**: Optimize images dan assets

## 💡 Troubleshooting
- **Build Error**: Check package.json dependencies
- **API Error**: Verify serverless function syntax
- **Database**: Check connection strings
- **CORS**: Configure proper headers

Pilih platform mana yang ingin Anda gunakan, dan saya akan bantu setup detailnya!