# 🚀 Setup Supabase Backend untuk SPK Beasiswa

## 1. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com)
2. Sign up/Login
3. Create New Project:
   - Name: `spk-beasiswa`
   - Database Password: `[password-anda]`
   - Region: `Southeast Asia (Singapore)`

## 2. Setup Database Tables

Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Create Users table
CREATE TABLE "Users" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "namaLengkap" VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert admin user
INSERT INTO "Users" (username, password, "namaLengkap") 
VALUES ('admin', 'admin123', 'Administrator Sistem');

-- Create Applicants table
CREATE TABLE "Applicants" (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nim VARCHAR(20) UNIQUE NOT NULL,
    ipk DECIMAL(3,2),
    "penghasilanOrtu" INTEGER,
    "jmlTanggungan" INTEGER,
    "ikutOrganisasi" VARCHAR(10),
    "ikutUKM" VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create SelectionAttributes table
CREATE TABLE "SelectionAttributes" (
    id SERIAL PRIMARY KEY,
    "attributeName" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "isSelected" BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert selection attributes
INSERT INTO "SelectionAttributes" ("attributeName", "displayName", "isSelected") VALUES
('ipk', 'IPK', true),
('penghasilanOrtu', 'Penghasilan Orang Tua', true),
('jmlTanggungan', 'Jumlah Tanggungan', true),
('ikutOrganisasi', 'Keikutsertaan Organisasi', true),
('ikutUKM', 'Keikutsertaan UKM', true);
```

## 3. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
cd supabase-backend
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy auth
supabase functions deploy stats
```

## 4. Get API URLs

Setelah deploy, Edge Functions akan tersedia di:
- Auth: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/auth`
- Stats: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stats`

## 5. Update Frontend

Update `.env.production` di frontend:
```
VITE_API_BASE_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1
```

## 6. Test Login

- Username: `admin`
- Password: `admin123`

## Keunggulan Supabase:
✅ Real-time database
✅ Built-in authentication
✅ Edge Functions (serverless)
✅ Dashboard yang user-friendly
✅ Automatic API generation
✅ Better error handling
✅ Free tier yang generous