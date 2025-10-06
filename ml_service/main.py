from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

# ML imports
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

# Optional social scraping
try:
    import snscrape.modules.twitter as sntwitter
except Exception:
    sntwitter = None

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = (BASE_DIR.parent / 'data' / 'fakeaccounts.csv').resolve()
MODEL_PATH = BASE_DIR / 'model.joblib'

app = FastAPI(title='Fake Account ML Service', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# -----------------------------
# Pydantic payload
# -----------------------------
class PredictPayload(BaseModel):
    Social_Media_Handles: Optional[str] = None
    accountId: Optional[str] = None
    follower_count: Optional[float] = None
    following_count: Optional[float] = None
    posts_count: Optional[float] = None
    account_age_days: Optional[float] = None
    Bio: Optional[str] = None
    sample_post: Optional[str] = None

# -----------------------------
# ML Pipeline
# -----------------------------
def build_pipeline():
    numeric_features = ['Followers', 'Following', 'Posts', 'account_age_days']
    text_features = ['Bio', 'sample_post']

    numeric_transformer = StandardScaler(with_mean=False)
    text_transformer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('bio', text_transformer, 'Bio'),
            ('post', text_transformer, 'sample_post'),
        ],
        remainder='drop',
        sparse_threshold=0.3,
    )

    clf = LogisticRegression(max_iter=200)

    pipeline = Pipeline(
        steps=[
            ('pre', preprocessor),
            ('clf', clf),
        ]
    )
    return pipeline

def load_model():
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    return None

def save_model(model):
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

# -----------------------------
# Health check
# -----------------------------
@app.get('/health')
def health():
    model_loaded = MODEL_PATH.exists()
    return {'ok': True, 'model': model_loaded}

# -----------------------------
# Train model
# -----------------------------
@app.post('/train')
def train():
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail=f'Dataset not found at {str(DATA_PATH)}')

    df = pd.read_csv(DATA_PATH)

    target_col = 'Labels'
    if target_col not in df.columns:
        raise HTTPException(status_code=400, detail='Labels column not found in CSV.')

    feature_cols = ['Followers', 'Following', 'Posts', 'Bio']

    if len(feature_cols) == 0:
        raise HTTPException(status_code=400, detail='No expected feature columns found in CSV.')

    # Minimal cleaning
    df = df.copy()
    df['Followers'] = pd.to_numeric(df['Followers'], errors='coerce').fillna(0)
    df['Following'] = pd.to_numeric(df['Following'], errors='coerce').fillna(0)
    df['Posts'] = pd.to_numeric(df['Posts'], errors='coerce').fillna(0)

    df['account_age_days'] = 0
    df['sample_post'] = ''
    df['Bio'] = df['Bio'].astype(str).fillna('')

    # Map Labels to numeric
    label_mapping = {'Real': 0, 'Bot': 1, 'Scam': 1}  # 0 = Real, 1 = Fake
    df[target_col] = df[target_col].map(label_mapping)
    y = df[target_col].astype(int)

    X = df[feature_cols]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # Evaluate
    try:
        y_proba = pipeline.predict_proba(X_test)[:, 1]
        auc = float(roc_auc_score(y_test, y_proba))
    except Exception:
        auc = None

    save_model(pipeline)
    return {'success': True, 'metrics': {'roc_auc': auc}, 'features': feature_cols, 'target': target_col}

# -----------------------------
# Predict
# -----------------------------
@app.post('/predict')
def predict(payload: PredictPayload):
    model = load_model()
    if model is None:
        raise HTTPException(status_code=400, detail='Model not trained. Call /train first.')

    data = {
        'Followers': payload.follower_count or 0,
        'Following': payload.following_count or 0,
        'Posts': payload.posts_count or 0,
        'account_age_days': payload.account_age_days or 0,
        'Bio': payload.Bio or '',
        'sample_post': payload.sample_post or '',
    }

    X = pd.DataFrame([data])
    proba = float(model.predict_proba(X)[0, 1])
    label = int(proba >= 0.5)
    return {
        'success': True,
        'prob_fake': proba,
        'label': label,
        'data_used': data
    }

# -----------------------------
# Scan Twitter/X username
# -----------------------------
@app.get('/scan/{platform}/{username}')
def scan_username(platform: str, username: str):
    if sntwitter is None:
        raise HTTPException(status_code=400, detail='snscrape not available on server')

    platform = platform.lower()
    if platform not in ['twitter', 'x']:
        raise HTTPException(status_code=400, detail='Only Twitter/X scanning supported currently')

    tweets = []
    try:
        for i, tweet in enumerate(sntwitter.TwitterUserScraper(username).get_items()):
            tweets.append(tweet)
            if i >= 50:
                break
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Failed to scrape: {e}')

    texts = [getattr(t, 'rawContent', '') or '' for t in tweets]
    sample_post = ' '.join(texts[:5]) if texts else ''
    follower_count = getattr(tweets[0].user, 'followersCount', 0) if tweets else 0
    following_count = getattr(tweets[0].user, 'friendsCount', 0) if tweets else 0
    posts_count = getattr(tweets[0].user, 'statusesCount', len(tweets)) if tweets else 0
    account_age_days = 0
    try:
        created = getattr(tweets[0].user, 'created', None)
        if created is not None:
            account_age_days = max(0, int((pd.Timestamp.utcnow() - pd.to_datetime(created)).days))
    except Exception:
        account_age_days = 0

    model = load_model()
    score = None
    label = None
    if model is not None:
        X = pd.DataFrame([{
            'Followers': follower_count,
            'Following': following_count,
            'Posts': posts_count,
            'account_age_days': account_age_days,
            'Bio': '',
            'sample_post': sample_post,
        }])
        try:
            score = float(model.predict_proba(X)[0, 1])
            label = int(score >= 0.5)
        except Exception:
            score = None
            label = None

    return {
        'success': True,
        'platform': platform,
        'username': username,
        'features': {
            'Followers': follower_count,
            'Following': following_count,
            'Posts': posts_count,
            'account_age_days': account_age_days,
            'sample_post_excerpt': sample_post[:200]
        },
        'prediction': {
            'prob_fake': score,
            'label': label
            
        }
    }

# -----------------------------
# Run server
# -----------------------------
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8000)
