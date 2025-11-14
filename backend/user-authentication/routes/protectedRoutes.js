import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

router.get('/profile', requireAuth, (req, res) => {
  res.json({ email: req.user.email });
});

export default router;