# 🔗 Cara Mendapatkan URL Railway yang Benar

## ❌ URL yang SALAH:
```
https://railway.com/project/2b245e52-3aee-418d-886f-fbf4a7768606?environmentId=b8945a31-3dca-4d02-bf78-4cb33ac468aa
```
**Ini adalah URL dashboard Railway, bukan URL aplikasi!**

## ✅ URL yang BENAR:

### 1. Cari di Railway Dashboard
1. Buka project Railway Anda
2. Klik tab **"Deployments"**
3. Cari deployment yang **"Active"** (hijau)
4. Klik deployment tersebut
5. Copy URL yang muncul, contoh:
   ```
   https://spk-beasiswa-production.up.railway.app
   ```

### 2. Atau di Tab Settings
1. Di Railway dashboard, klik **"Settings"**
2. Scroll ke **"Domains"**
3. Copy **"Public Domain"**, contoh:
   ```
   https://spk-beasiswa-production.up.railway.app
   ```

### 3. Format URL untuk Frontend
Tambahkan `/api` di akhir URL Railway:
```
VITE_API_BASE_URL=https://spk-beasiswa-production.up.railway.app/api
```

## 🧪 Test URL yang Benar:

Buka di browser:
- **Root**: `https://your-app.up.railway.app/`
- **Login**: `https://your-app.up.railway.app/api/auth/login`

Jika muncul JSON response, URL sudah benar!

## 📝 Update Frontend:

1. Update `.env.production` dengan URL yang benar
2. Deploy ulang frontend ke Vercel
3. Test login dengan `admin/admin123`

**URL Railway selalu berformat**: `https://nama-app.up.railway.app` 🎯