import express from "express";
import { FraudDetectionService } from "../services/FraudDetectionService";
import Application from "../models/Application";
import RiskScore from "../models/RiskScore";
import OfficerAction from "../models/OfficerAction";

const router = express.Router();
const fraudService = new FraudDetectionService();

// POST /applications - Submit new application
router.post("/applications", async (req, res) => {
  try {
    debugger;
    const { fullName, email, phone, aadhaar, address, jobId } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !aadhaar || !address || !jobId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await fraudService.processApplication({
      fullName,
      email,
      phone,
      aadhaar,
      address,
      jobId,
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

    const matchStage: any = {};
    if (status) {
      if (status === "PENDING") {
        matchStage["$or"] = [
          // { action: "PENDING" },
          { action: { $exists: false } },
          { action: null },
        ];
      } else {
        matchStage["action"] = status;
      }
    }
    const pipeline: any = [
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "applications",
          localField: "applicationId",
          foreignField: "_id",
          as: "application",
        },
      },
      {
        $unwind: {
          path: "$application",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "riskscores",
          localField: "applicationId",
          foreignField: "applicationId",
          as: "riskScore",
        },
      },
      {
        $unwind: {
          path: "$riskScore",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { "riskScore.normalizedScore": -1 },
      },
    ];

    const applications = await OfficerAction.aggregate(pipeline);

    res.json({
      success: true,
      data: applications,
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

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.status !== "PENDING") {
      return res
        .status(400)
        .json({ error: "Application has already been processed" });
    }

    // Update application status
    application.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    await application.save();

    // Log the officer action
    const officerAction = new OfficerAction({
      applicationId: id,
      action,
      officerId: officerId || "officer1",
      notes,
    });

    await officerAction.save();

    res.json({
      success: true,
      data: {
        application,
        action: officerAction,
      },
    });
  } catch (error) {
    console.error("Error saving officer action:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
