import express from 'express';
import Rule from '../models/Rule';

const router = express.Router();

// GET /rules - Get all rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await Rule.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /rules - Create new rule
router.post('/rules', async (req, res) => {
  try {
    const rule = new Rule(req.body);
    await rule.save();
    
    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /rules/:id - Update rule
router.put('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await Rule.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;