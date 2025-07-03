# GitHub Setup Instructions

## Step 1: Create GitHub Repository
1. Go to https://github.com
2. Click "New repository" or "+"
3. Repository name: `spk-beasiswa`
4. Description: `Sistem Pendukung Keputusan Beasiswa menggunakan Algoritma C4.5`
5. Choose Public or Private
6. **DO NOT** initialize with README, .gitignore, or license (we already have them)
7. Click "Create repository"

## Step 2: Connect Local Repository to GitHub
After creating the repository on GitHub, run these commands:

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/spk-beasiswa.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify Upload
1. Go to your GitHub repository
2. You should see all files including:
   - `backend-main/` folder (Node.js backend)
   - `my-app-main/` folder (React frontend)
   - `README.md` (project documentation)
   - `.gitignore` (ignore unnecessary files)

## Alternative: Using GitHub CLI
If you have GitHub CLI installed:

```bash
# Create repository and push
gh repo create spk-beasiswa --public --source=. --remote=origin --push
```

## Repository Structure
```
spk-beasiswa/
├── backend-main/           # Node.js + Express Backend
│   ├── controllers/        # API Controllers
│   ├── models/            # Database Models
│   ├── routes/            # API Routes
│   ├── utils/             # C4.5 Algorithm Implementation
│   └── server.js          # Main server file
├── my-app-main/           # React Frontend
│   ├── src/
│   │   ├── components/    # React Components
│   │   ├── pages/         # Page Components
│   │   ├── services/      # API Services
│   │   └── App.jsx        # Main App Component
│   └── package.json       # Frontend Dependencies
├── README.md              # Project Documentation
└── .gitignore            # Git Ignore Rules
```

## Next Steps After Upload
1. Update README.md with your GitHub username
2. Add screenshots of the application
3. Create releases for different versions
4. Set up GitHub Actions for CI/CD (optional)
5. Add issues and project boards for tracking

## Cloning the Repository
Others can clone your repository with:
```bash
git clone https://github.com/YOUR_USERNAME/spk-beasiswa.git
cd spk-beasiswa

# Install backend dependencies
cd backend-main
npm install

# Install frontend dependencies
cd ../my-app-main
npm install
```