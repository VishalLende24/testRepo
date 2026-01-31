import express from 'express';
import Rule from '../models/Rule';
import { RuleEngine } from '../services/RuleEngine';

const router = express.Router();
const ruleEngine = new RuleEngine();

// GET /rules - Get all rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await Rule.find().sort({ priority: 1, createdAt: -1 });
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
    const ruleData = {
      ...req.body,
      ruleId: req.body.ruleId || `RULE_${Date.now()}`,
      version: 1
    };
    
    const rule = new Rule(ruleData);
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
    const currentRule = await Rule.findById(id);
    
    if (!currentRule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const updatedData = {
      ...req.body,
      version: currentRule.version + 1
    };

    const rule = await Rule.findByIdAndUpdate(id, updatedData, { new: true });
    
    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /rules/:id - Delete rule
router.delete('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await Rule.findByIdAndDelete(id);
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /rules/test - Test rule evaluation
router.post('/rules/test', async (req, res) => {
  try {
    const { testData } = req.body;
    const result = await ruleEngine.evaluateRules(testData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error testing rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;