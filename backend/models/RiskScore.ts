import mongoose, { Schema, Document } from 'mongoose';

export interface IRiskScore extends Document {
  applicationId: string;
  totalScore: number;
  normalizedScore: number;
  riskBand: 'LOW' | 'MEDIUM' | 'HIGH';
  triggeredRules: string[];
  createdAt: Date;
}

const RiskScoreSchema: Schema = new Schema({
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  totalScore: { type: Number, required: true },
  normalizedScore: { type: Number, required: true },
  riskBand: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  triggeredRules: [{ type: String }]
}, {
  timestamps: true
});

export default mongoose.model<IRiskScore>('RiskScore', RiskScoreSchema);