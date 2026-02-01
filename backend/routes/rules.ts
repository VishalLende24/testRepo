import express from 'express';
import Rule from '../models/Rule';
import { RuleEngine } from '../services/RuleEngine';
import { GenAIRuleGenerator } from '../services/GenAIRuleGenerator';

const router = express.Router();
const ruleEngine = new RuleEngine();
const genAI = new GenAIRuleGenerator();

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
    let ruleData = req.body;
    
    // If admin intent provided, generate rule using GenAI
    if (req.body.adminIntent) {
      ruleData = genAI.generateRule(req.body.adminIntent);
      console.log('Generated rule data:', JSON.stringify(ruleData, null, 2));
    } else {
      ruleData = {
        ...req.body,
        ruleId: req.body.ruleId || `RULE_${Date.now()}`,
        version: 1
      };
    }
    
    // Check for duplicate ruleId
    const existingRule = await Rule.findOne({ ruleId: ruleData.ruleId });
    if (existingRule) {
      ruleData.ruleId = `${ruleData.ruleId}_${Date.now()}`;
    }
    
    // Validate rule before saving
    const validation = genAI.validateRule(ruleData);
    if (!validation.valid) {
      console.error('Rule validation failed:', validation.errors);
      return res.status(400).json({ 
        error: 'Invalid rule', 
        details: validation.errors 
      });
    }
    
    const rule = new Rule({
      ruleId: ruleData.ruleId,
      name: ruleData.name,
      description: ruleData.description,
      conditions: ruleData.conditions,
      logic: ruleData.logic,
      score: ruleData.score,
      priority: ruleData.priority,
      isActive: ruleData.isActive,
      version: ruleData.version,
      createdBy: ruleData.createdBy
    });
    
    const savedRule = await rule.save();
    console.log('Rule saved successfully:', savedRule.ruleId);
    
    res.status(201).json({
      success: true,
      data: savedRule
    });
  } catch (error) {
    console.error('Error creating rule:', error);
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 11000) {
      return res.status(400).json({ error: 'Rule ID already exists' });
    }
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