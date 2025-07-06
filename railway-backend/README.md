# SPK Beasiswa Railway Backend

## Deploy to Railway

1. Connect this specific folder to Railway
2. Set environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
3. Deploy automatically

## Local Development

```bash
npm install
npm start
```

## API Endpoints

- POST /api/auth/login
- GET /api/applicants/stats
- GET /api/applicants
- POST /api/applicants
- GET /api/attributes
- GET /api/reports
- POST /api/selection