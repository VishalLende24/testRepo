import express from 'express';
import { FraudDetectionService } from '../services/FraudDetectionService';
import Application from '../models/Application';
import RiskScore from '../models/RiskScore';
import OfficerAction from '../models/OfficerAction';

const router = express.Router();
const fraudService = new FraudDetectionService();

// POST /applications - Submit new application
router.post('/applications', async (req, res) => {
  try {
    debugger
    const { fullName, email, phone, aadhaar, address, jobId } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !phone || !aadhaar || !address || !jobId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await fraudService.processApplication({ fullName, email, phone, aadhaar, address, jobId });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error processing application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /applications - Get all applications sorted by risk
router.get('/applications', async (req, res) => {
  try {
    const applications = await Application.aggregate([
      {
        $lookup: {
          from: 'riskscores',
          localField: '_id',
          foreignField: 'applicationId',
          as: 'riskScore'
        }
      },
      {
        $unwind: {
          path: '$riskScore',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { 'riskScore.normalizedScore': -1 }
      }
    ]);

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /applications/:id - Get application details
router.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const details = await fraudService.getApplicationDetails(id);
    
    if (!details.application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /applications/:id/action - Officer action (approve/reject)
router.post('/applications/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, officerId, notes } = req.body;
    
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const officerAction = new OfficerAction({
      applicationId: id,
      action,
      officerId: officerId || 'officer1',
      notes
    });
    
    await officerAction.save();

    res.json({
      success: true,
      data: officerAction
    });
  } catch (error) {
    console.error('Error saving officer action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;