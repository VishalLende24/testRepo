import { spawn } from 'child_process';
import path from 'path';
import { createHash } from 'crypto';
import Application from '../models/Application';
import DuplicateMatch from '../models/DuplicateMatch';
import Rule from '../models/Rule';
import RiskScore from '../models/RiskScore';
import Explanation from '../models/Explanation';

export class FraudDetectionService {
  
  private hashAadhaar(aadhaar: string): string {
    return createHash('sha256').update(aadhaar).digest('hex');
  }

  private runPythonScript(scriptName: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '..', 'ml', scriptName);
      const python = spawn('python', [scriptPath, JSON.stringify(data)]);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${stderr}`));
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${stdout}`));
          }
        }
      });
    });
  }

  async processApplication(applicationData: any) {
    // Hash Aadhaar before saving
    const aadhaarHash = this.hashAadhaar(applicationData.aadhaar);
    
    // Save application
    const application = new Application({
      fullName: applicationData.fullName,
      email: applicationData.email,
      phone: applicationData.phone,
      aadhaarHash,
      address: applicationData.address,
      jobId: applicationData.jobId
    });
    await application.save();

    // Get existing applications for comparison
    const existingApps = await Application.find({ _id: { $ne: application._id } }).lean();
    
    // Detect duplicates
    const duplicateResults = await this.runPythonScript('duplicate_detection.py', {
      current: { ...applicationData, aadhaarHash, _id: application._id },
      existing: existingApps
    });

    // Save duplicate matches
    const duplicateMatches = [];
    for (const exactMatch of duplicateResults.exactMatches || []) {
      const match = new DuplicateMatch({
        applicationId: application._id,
        matchedApplicationId: exactMatch.applicationId,
        matchType: 'exact',
        field: exactMatch.field,
        score: exactMatch.score
      });
      await match.save();
      duplicateMatches.push(match);
    }

    for (const fuzzyMatch of duplicateResults.fuzzyMatches || []) {
      const match = new DuplicateMatch({
        applicationId: application._id,
        matchedApplicationId: fuzzyMatch.applicationId,
        matchType: 'fuzzy',
        field: fuzzyMatch.field,
        score: fuzzyMatch.score
      });
      await match.save();
      duplicateMatches.push(match);
    }

    // Load and evaluate rules
    const activeRules = await Rule.find({ active: true }).lean();
    const triggeredRules = [];

    for (const rule of activeRules) {
      let triggered = false;
      
      if (rule.condition.type === 'exact') {
        triggered = duplicateResults.exactMatches?.some((match: any) => match.field === rule.condition.field) || false;
      } else if (rule.condition.type === 'fuzzy') {
        const threshold = rule.condition.threshold || 0.8;
        triggered = duplicateResults.fuzzyMatches?.some((match: any) => 
          match.field === rule.condition.field && match.score >= threshold
        ) || false;
      }
      
      if (triggered) {
        triggeredRules.push(rule);
      }
    }

    // Calculate risk score
    const riskResult = await this.runPythonScript('risk_scoring.py', triggeredRules);
    
    const riskScore = new RiskScore({
      applicationId: application._id,
      totalScore: riskResult.totalScore,
      normalizedScore: riskResult.normalizedScore,
      riskBand: riskResult.riskBand,
      triggeredRules: triggeredRules.map(r => r.ruleId)
    });
    await riskScore.save();

    // Generate explanations
    const explanationResults = await this.runPythonScript('explain.py', {
      duplicateMatches: duplicateResults,
      triggeredRules: triggeredRules
    });

    const explanation = new Explanation({
      applicationId: application._id,
      explanations: explanationResults
    });
    await explanation.save();

    return {
      application,
      duplicateMatches,
      riskScore,
      explanations: explanationResults
    };
  }

  async getApplicationDetails(applicationId: string) {
    const application = await Application.findById(applicationId);
    const duplicateMatches = await DuplicateMatch.find({ applicationId }).populate('matchedApplicationId');
    const riskScore = await RiskScore.findOne({ applicationId });
    const explanation = await Explanation.findOne({ applicationId });
    
    return {
      application,
      duplicateMatches,
      riskScore,
      explanation
    };
  }
}