import express, { Request } from "express";
import multer from "multer";
import { FraudDetectionService } from "../services/FraudDetectionService";
import Application from "../models/Application";
import RiskScore from "../models/RiskScore";
import OfficerAction from "../models/OfficerAction";
import { extractTextFromPDF } from "../utils/pdfExtractor";
import { parseResume } from "../../ats-parser";

interface MulterRequest extends Request {
  file?: any;
}

const router = express.Router();
const fraudService = new FraudDetectionService();

const upload = multer({ storage: multer.memoryStorage() });

// POST /applications - Submit new application
router.post("/applications", upload.single('resume'), async (req: MulterRequest, res) => {
  try {
    debugger;
    const { fullName, email, phone, aadhaar, address, jobId } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !aadhaar || !address || !jobId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let resumeText = '';
    let atsScore = 0;
    let roleRelevanceScore = 0;

    // Process resume if uploaded
    if (req.file) {
      try {
        resumeText = await extractTextFromPDF(req.file.buffer);
        const atsResult = parseResume(resumeText, jobId);
        atsScore = atsResult.atsScore;
        roleRelevanceScore = atsResult.roleRelevanceScore;
      } catch (error) {
        console.error('Resume processing error:', error);
      }
    }

    const result = await fraudService.processApplication({
      fullName,
      email,
      phone,
      aadhaar,
      address,
      jobId,
      resumeText,
      atsScore,
      roleRelevanceScore
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error processing application:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /applications - Get all applications sorted by risk, optionally filtered by status
router.get("/applications", async (req, res) => {
  try {
    const { status } = req.query;
    console.log('Fetching applications with status filter:', status);

    // Simple approach - get all applications with their related data
    const applications = await Application.find().lean();
    const enrichedApplications = [];

    for (const app of applications) {
      // Get risk score
      const riskScore = await RiskScore.findOne({ applicationId: app._id }).lean();
      
      // Get officer action
      const officerAction = await OfficerAction.findOne({ applicationId: app._id }).lean();
      
      // Apply status filter
      if (status) {
        if (status === 'PENDING' && officerAction?.action !== 'PENDING') continue;
        if (status !== 'PENDING' && officerAction?.action !== status) continue;
      }

      enrichedApplications.push({
        _id: app._id,
        application: app,
        riskScore: riskScore || { normalizedScore: 0, riskBand: 'LOW' },
        action: officerAction?.action || 'PENDING',
        officerId: officerAction?.officerId,
        notes: officerAction?.notes,
        createdAt: officerAction?.createdAt || app.createdAt
      });
    }

    // Sort by risk score (highest first)
    enrichedApplications.sort((a, b) => 
      (b.riskScore?.normalizedScore || 0) - (a.riskScore?.normalizedScore || 0)
    );

    console.log(`Found ${enrichedApplications.length} applications`);

    res.json({
      success: true,
      data: enrichedApplications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /applications/:id - Get application details
router.get("/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const details = await fraudService.getApplicationDetails(id);

    if (!details.application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error("Error fetching application details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /applications/:id/action - Officer action (approve/reject)
router.post("/applications/:id/action", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, officerId, notes } = req.body;
    console.log('Processing action:', { id, action, officerId, notes });

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Update application status
    await Application.findByIdAndUpdate(id, { 
      status: action === "APPROVE" ? "APPROVED" : "REJECTED" 
    });

    // Update or create officer action
    const existingAction = await OfficerAction.findOne({ applicationId: id });
    if (existingAction) {
      existingAction.action = action as any;
      existingAction.officerId = officerId || "admin";
      existingAction.notes = notes;
      await existingAction.save();
    } else {
      const officerAction = new OfficerAction({
        applicationId: id,
        action: action as any,
        officerId: officerId || "admin",
        notes,
      });
      await officerAction.save();
    }

    res.json({
      success: true,
      data: {
        message: `Application ${action.toLowerCase()}d successfully`
      },
    });
  } catch (error) {
    console.error("Error saving officer action:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
