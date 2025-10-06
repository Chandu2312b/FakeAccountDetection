Fake Account Detection — ML + Real-Time Social Integration
==========================================================

Overview
--------
This version extends the original rules-based detector with a Python FastAPI microservice trained on your Kaggle CSV (`data/fakeaccounts.csv.csv`). It provides:

- Supervised ML predictions from structured and text features
- On-demand Twitter/X username scanning via lightweight scraping
- Seamless proxying through the existing Node backend at `/api/ml/*`
- Frontend controls to train, predict, and scan in real-time

What's new vs original
----------------------
- Original: deterministic rules in Node (`backend/src/utils/rules.js`).
- New: ML microservice (`ml_service/`) that learns from data and outputs a probability of “fake”.
- New: Social integration `/api/ml/scan/:platform/:username` to fetch public signals and optionally score with the trained model.
- Frontend: Buttons in `ScanForm` to trigger ML training, feature-based prediction, and social scan.

Architecture
------------
- Frontend (Vite/React) → Node backend (Express) → Python ML service (FastAPI)
- Data source: `data/fakeaccounts.csv.csv` in project root `data/` folder

Key Paths
---------
- ML service: `ml_service/main.py`
- ML requirements: `ml_service/requirements.txt`
- Backend proxy routes: `backend/src/routes/ml.js`
- Frontend API helpers: `frontend/src/api.js`
- Frontend UI: `frontend/src/components/ScanForm.jsx`

Endpoints
---------
- Backend proxy (preferred by frontend/UI):
  - `GET /api/ml/health` → `{ ok, model }`
  - `POST /api/ml/train` → trains on Kaggle CSV; returns metrics
  - `POST /api/ml/predict` → body: features; returns `{ prob_fake, label }`
  - `GET /api/ml/scan/:platform/:username` → social scrape + optional ML score

- Under the hood (Python service):
  - `GET /health`
  - `POST /train`
  - `POST /predict`
  - `GET /scan/{platform}/{username}` (currently Twitter/X only)

Running locally
---------------
1) Start Mongo + Node backend

```
cd backend
npm install
npm run dev
```

Optional `.env` for backend:

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/fakeaccount
CORS_ORIGIN=*
ML_SERVICE_URL=http://127.0.0.1:8000
```

2) Start Python ML service

```
cd ml_service
python -m venv .venv
. .venv/Scripts/Activate.ps1   # PowerShell on Windows
pip install -r requirements.txt
python main.py                 # or: uvicorn main:app --host 127.0.0.1 --port 8000
```

3) Start frontend

```
cd frontend
npm install
npm run dev
```

Workflow
--------
1. Train model: in the UI click “Train Model” or POST `/api/ml/train`.
2. Predict (features): in the UI click “ML Predict” to score the form input.
3. Real-time scan (Twitter/X): enter a username and click “Scan Username”.

Notes
-----
- The ML pipeline uses TF‑IDF for `Bio` and `sample_post` text and StandardScaler for numeric features, then Logistic Regression. Adjust in `ml_service/main.py`.
- If your Kaggle CSV uses a different target column name (e.g. `is_fake`, `label`, `target`), the trainer tries to auto-detect it. Update the code if needed.
- Twitter/X scraping uses `snscrape` (no API keys). Heavy usage may be rate-limited; use responsibly.

Security & Ethics
-----------------
- Only process public data. Respect platform terms of service.
- Treat scores as signals, not ground truth; keep humans in the loop.



