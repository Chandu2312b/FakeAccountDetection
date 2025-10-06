import { Router } from 'express';
import simulateAttack from '../seed/simulateAttack.js';

const router = Router();

// POST /api/simulate/attack
router.post('/attack', async (_req, res) => {
  const results = await simulateAttack();
  res.json({ ok: true, ...results });
});

export default router;







