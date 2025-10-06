Step-by-step: Push to GitHub and Deploy on Render
=================================================

Prereqs
-------
- Have a GitHub account
- Install Git and Node 18+ locally
- Python 3.10+ for the ML service (Render supports Python 3.11)

1) Initialize Git and push to GitHub
-----------------------------------
```bash
cd C:/Users/user/OneDrive/Desktop/fakeaccount
git init
git add .
git commit -m "feat: ML service + social scanning + render config"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

2) Prepare environment variables
--------------------------------
You will set these in Render per service:

- Backend (Web Service):
  - `MONGO_URI` = your MongoDB connection string (e.g. MongoDB Atlas)
  - `CORS_ORIGIN` = `*` (or restrict to your frontend domain)
  - `ML_SERVICE_URL` = Fill after ML service deploy, e.g. `https://fakeaccount-ml.onrender.com`

- ML service (Web Service):
  - none required by default

- Frontend (Static Site):
  - `VITE_API_BASE` = your backend base URL (e.g. `https://fakeaccount-backend.onrender.com`)

3) Create services in Render (using render.yaml)
-----------------------------------------------
Option A (recommended): One-click from repo render.yaml

1. Go to Render → New + → Blueprint → Choose your GitHub repo
2. Render will read `render.yaml` and propose three services:
   - `fakeaccount-backend` (Node Web Service)
   - `fakeaccount-ml` (Python Web Service)
   - `fakeaccount-frontend` (Static Site)
3. Review and create resources.
4. Set the env vars noted above.
5. Deploy. Wait for green status.

Option B: Manual services
-------------------------
- ML: New + → Web Service → Python → root `ml_service` → Build: `pip install -r requirements.txt` → Start: `uvicorn main:app --host 0.0.0.0 --port 8000`
- Backend: New + → Web Service → Node → root `backend` → Build: `npm install` → Start: `node src/index.js`
- Frontend: New + → Static Site → root `frontend` → Build: `npm install && npm run build` → Publish Dir: `dist`

4) Wire Backend to ML service
-----------------------------
- After ML deploys, copy its public URL (e.g., `https://fakeaccount-ml.onrender.com`).
- In the backend service on Render, set `ML_SERVICE_URL` to that URL.
- Redeploy backend.

5) Wire Frontend to Backend
---------------------------
- After backend deploys, copy its URL (e.g., `https://fakeaccount-backend.onrender.com`).
- In the frontend (Static Site) on Render, set `VITE_API_BASE` to that URL.
- Redeploy frontend.

6) Verify
---------
- Open the frontend URL → Scan panel
- Click “Train Model” to train on the Kaggle CSV
- Try “ML Predict” and “Scan Username”

Troubleshooting
---------------
- CORS errors: ensure `CORS_ORIGIN` in backend allows your deployed frontend origin.
- 500 errors from ML: ensure the ML service is healthy (`/health`) and that `ML_SERVICE_URL` in backend is correct.
- Dataset path: ML service expects `data/fakeaccounts.csv` at repo root. Include it in Git or switch to a remote storage if large.


