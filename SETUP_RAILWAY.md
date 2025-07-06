# 🚀 Setup Railway Backend untuk SPK Beasiswa

## 1. Buat Account Railway

1. Buka [railway.app](https://railway.app)
2. Sign up dengan GitHub
3. Verify email

## 2. Deploy Backend

### Option 1: Deploy dari GitHub
1. Connect GitHub repository
2. Select `railway-backend` folder
3. Railway akan auto-deploy

### Option 2: Deploy Manual
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd railway-backend
railway deploy
```

## 3. Environment Variables

Di Railway Dashboard, set:
```
DATABASE_URL=postgresql://neondb_owner:npg_Hsczr6wXb1qC@ep-lively-lab-a1r820jx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=railway-spk-beasiswa-secret-2024
NODE_ENV=production
```

## 4. Update Frontend

Update `.env.production`:
```
VITE_API_BASE_URL=https://your-app.railway.app/api
```

## 5. Test Endpoints

- Root: `https://your-app.railway.app/`
- Login: `https://your-app.railway.app/api/auth/login`
- Stats: `https://your-app.railway.app/api/applicants/stats`

## 6. Login Credentials

- Username: `admin`
- Password: `admin123`

## ✅ Keunggulan Railway:

- ✅ **Mudah Deploy**: Langsung dari GitHub
- ✅ **Auto Scaling**: Otomatis scale berdasarkan traffic
- ✅ **Free Tier**: $5 credit gratis per bulan
- ✅ **Custom Domain**: Support domain sendiri
- ✅ **Environment Variables**: Easy management
- ✅ **Logs & Monitoring**: Built-in monitoring
- ✅ **Database Integration**: Easy PostgreSQL setup
- ✅ **No Cold Start**: Always warm instances

## 🔄 Auto Deploy

Railway akan otomatis deploy ulang setiap kali ada push ke GitHub repository!

## 📊 Complete API Endpoints:

- `POST /api/auth/login` - Authentication
- `GET /api/applicants/stats` - Dashboard statistics  
- `GET /api/applicants` - Get all applicants (with pagination)
- `POST /api/applicants` - Create new applicant
- `GET /api/attributes` - Get selection attributes
- `GET /api/reports` - Get selection results
- `POST /api/selection` - Run selection process

Railway adalah solusi terbaik untuk deployment yang mudah dan reliable! 🎯