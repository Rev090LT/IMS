import express from 'express';
import { Item } from '../models/Item.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/:qr_code', authenticateToken, async (req, res) => {
  const { qr_code } = req.params;
  try {
    const item = await Item.getByQR(qr_code);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dispose', authenticateToken, async (req, res) => {
  const { qr_code, quantity } = req.body;

  if (!qr_code || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'qr_code and quantity > 0 required' });
  }

  try {
    const updatedItem = await Item.dispose(qr_code, quantity);
    res.json({ message: 'Item disposed successfully', item: updatedItem });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;