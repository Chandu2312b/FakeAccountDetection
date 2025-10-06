import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

const ML_BASE = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

router.get('/health', async (_req, res) => {
  try {
    const r = await fetch(`${ML_BASE}/health`);
    const j = await r.json();
    res.json(j);
  } catch (e) {
    res.status(500).json({ ok: false, error: 'ML service not reachable' });
  }
});

router.post('/train', async (_req, res) => {
  try {
    const r = await fetch(`${ML_BASE}/train`, { method: 'POST' });
    const j = await r.json();
    res.json(j);
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to trigger training' });
  }
});

router.post('/predict', async (req, res) => {
  try {
    const r = await fetch(`${ML_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const j = await r.json();
    res.json(j);
  } catch (e) {
    res.status(500).json({ success: false, error: 'Prediction failed' });
  }
});

router.get('/scan/:platform/:username', async (req, res) => {
  const { platform, username } = req.params;
  try {
    const r = await fetch(`${ML_BASE}/scan/${encodeURIComponent(platform)}/${encodeURIComponent(username)}`);
    const j = await r.json();
    res.json(j);
  } catch (e) {
    res.status(500).json({ success: false, error: 'Scan failed' });
  }
});

export default router;



