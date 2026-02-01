import { spawn } from 'child_process';
import path from 'path';
import { createHash } from 'crypto';
import Application from '../models/Application';
import DuplicateMatch from '../models/DuplicateMatch';
import Rule from '../models/Rule';
import RiskScore from '../models/RiskScore';
import Explanation from '../models/Explanation';
import { RuleEngine } from './RuleEngine';

export class FraudDetectionService {
  private ruleEngine = new RuleEngine();
  
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
    try {
      // Hash Aadhaar before saving
      const aadhaarHash = this.hashAadhaar(applicationData.aadhaar);
      
      // Save application
      const application = new Application({
        fullName: applicationData.fullName,
        email: applicationData.email,
        phone: applicationData.phone,
        aadhaarHash,
        address: applicationData.address,
        jobId: applicationData.jobId,
        resumeText: applicationData.resumeText || '',
        atsScore: applicationData.atsScore || 0,
        roleRelevanceScore: applicationData.roleRelevanceScore || 0
      });
      await application.save();

      // Create initial officer action record
      const officerAction = new (await import('../models/OfficerAction')).default({
        applicationId: application._id,
        action: 'PENDING' as any,
        officerId: 'SYSTEM'
      });
      await officerAction.save();

      // Get existing applications for comparison
      const existingApps = await Application.find({ _id: { $ne: application._id } }).lean();
      
      let duplicateResults = { exactMatches: [], fuzzyMatches: [] };
      try {
        duplicateResults = await this.runPythonScript('duplicate_detection.py', {
          current: { ...applicationData, aadhaarHash, _id: application._id },
          existing: existingApps
        });
      } catch (error) {
        console.warn('Python duplicate detection failed, using fallback:', error);
        // Fallback duplicate detection
        duplicateResults = this.fallbackDuplicateDetection(application, existingApps);
      }

      // Save duplicate matches
      const duplicateMatches: any[] = [];
      const exactMatches = (duplicateResults.exactMatches || []) as any[];
      for (const exactMatch of exactMatches) {
        const match = new DuplicateMatch({
          applicationId: application._id,
          matchedApplicationId: exactMatch.applicationId,
          matchType: 'exact',
          field: exactMatch.field,
          score: exactMatch.score || 1.0
        });
        await match.save();
        duplicateMatches.push(match);
      }

      const fuzzyMatches = (duplicateResults.fuzzyMatches || []) as any[];
      for (const fuzzyMatch of fuzzyMatches) {
        const match = new DuplicateMatch({
          applicationId: application._id,
          matchedApplicationId: fuzzyMatch.applicationId,
          matchType: 'fuzzy',
          field: fuzzyMatch.field,
          score: fuzzyMatch.score || 0.8
        });
        await match.save();
        duplicateMatches.push(match);
      }

      // Evaluate rules using new rule engine
      const enrichedData = {
        ...applicationData,
        aadhaarHash,
        duplicateEmailCount: duplicateMatches.filter(m => m.field === 'email').length,
        duplicatePhoneCount: duplicateMatches.filter(m => m.field === 'phone').length,
        nameSimilarityScore: duplicateMatches.filter(m => m.field === 'fullName').length > 0 
          ? Math.max(...duplicateMatches.filter(m => m.field === 'fullName').map(m => m.score || 0)) 
          : 0,
        atsScore: applicationData.atsScore || 0,
        roleRelevanceScore: applicationData.roleRelevanceScore || 0,
        duplicateMatches: duplicateResults,
        exactMatches: duplicateResults.exactMatches || [],
        fuzzyMatches: duplicateResults.fuzzyMatches || []
      };

      const ruleEvaluation = await this.ruleEngine.evaluateRules(enrichedData);

      // Calculate risk score with fallback
      let riskResult = { normalizedScore: ruleEvaluation.ruleScore };
      try {
        riskResult = await this.runPythonScript('risk_scoring.py', ruleEvaluation.matchedRules);
      } catch (error) {
        console.warn('Python risk scoring failed, using rule score:', error);
      }
      
      const riskScore = new RiskScore({
        applicationId: application._id,
        totalScore: ruleEvaluation.ruleScore,
        normalizedScore: riskResult.normalizedScore || ruleEvaluation.ruleScore,
        riskBand: this.getRiskBand(ruleEvaluation.ruleScore),
        triggeredRules: ruleEvaluation.matchedRules.map(r => r.ruleId)
      });
      await riskScore.save();

      // Generate explanations with fallback
      let explanationResults = this.generateFallbackExplanations(duplicateResults, ruleEvaluation.matchedRules);
      try {
        explanationResults = await this.runPythonScript('explain.py', {
          duplicateMatches: duplicateResults,
          matchedRules: ruleEvaluation.matchedRules
        });
      } catch (error) {
        console.warn('Python explanation failed, using fallback:', error);
      }

      const explanation = new Explanation({
        applicationId: application._id,
        explanations: explanationResults
      });
      await explanation.save();

      return {
        application,
        duplicateMatches,
        riskScore,
        ruleEvaluation,
        explanations: explanationResults
      };
    } catch (error) {
      console.error('Error in processApplication:', error);
      throw error;
    }
  }

  private fallbackDuplicateDetection(application: any, existingApps: any[]): any {
    const exactMatches = [];
    const fuzzyMatches = [];

    for (const existing of existingApps) {
      // Check exact email match
      if (application.email === existing.email) {
        exactMatches.push({
          applicationId: existing._id,
          field: 'email',
          score: 1.0
        });
      }

      // Check exact phone match
      if (application.phone === existing.phone) {
        exactMatches.push({
          applicationId: existing._id,
          field: 'phone',
          score: 1.0
        });
      }

      // Check exact aadhaar hash match
      if (application.aadhaarHash === existing.aadhaarHash) {
        exactMatches.push({
          applicationId: existing._id,
          field: 'aadhaarHash',
          score: 1.0
        });
      }

      // Simple name similarity check
      if (application.fullName && existing.fullName) {
        const similarity = this.calculateSimpleSimilarity(application.fullName, existing.fullName);
        if (similarity > 0.8) {
          fuzzyMatches.push({
            applicationId: existing._id,
            field: 'fullName',
            score: similarity
          });
        }
      }
    }

    return { exactMatches, fuzzyMatches };
  }

  private calculateSimpleSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private generateFallbackExplanations(duplicateResults: any, matchedRules: any[]): string[] {
    const explanations = [];
    
    if (duplicateResults.exactMatches?.length > 0) {
      explanations.push(`Found ${duplicateResults.exactMatches.length} exact duplicate(s)`);
    }
    
    if (duplicateResults.fuzzyMatches?.length > 0) {
      explanations.push(`Found ${duplicateResults.fuzzyMatches.length} similar record(s)`);
    }
    
    for (const rule of matchedRules) {
      explanations.push(`Rule triggered: ${rule.ruleName || rule.ruleId}`);
    }
    
    if (explanations.length === 0) {
      explanations.push('No significant risk factors detected');
    }
    
    return explanations;
  }

  private getRiskBand(score: number): string {
    if (score <= 30) return 'LOW';
    if (score <= 70) return 'MEDIUM';
    return 'HIGH';
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