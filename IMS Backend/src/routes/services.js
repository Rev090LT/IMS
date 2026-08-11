import express from 'express';
import { readServicesExcel } from '../utils/excelReader.js';

const router = express.Router();

router.get('/api/services', (req, res) => {
  try {
    const { groups, items } = readServicesExcel();
    const query = req.query.q?.toLowerCase() || '';
    
    if (query) {
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.category?.toLowerCase().includes(query)
      );
      return res.json({ success: true, data: filtered, total: filtered.length });
    }
    
    res.json({ success: true, data: items, groups, total: items.length });
  } catch (error) {
    console.error('Error reading Excel:', error);
    res.status(500).json({ success: false, error: 'Failed to read services file' });
  }
});

router.get('/api/services/groups', (req, res) => {
  try {
    const { groups } = readServicesExcel();
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to read groups' });
  }
});

export default router;