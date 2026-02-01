import mongoose, { Schema, Document } from 'mongoose';

export interface IATSRule extends Document {
  ruleId: string;
  description: string;
  minATSScore: number;
  minRoleRelevance: number;
  riskScore: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ATSRuleSchema: Schema = new Schema({
  ruleId: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  minATSScore: { type: Number, required: true },
  minRoleRelevance: { type: Number, required: true },
  riskScore: { type: Number, required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model<IATSRule>('ATSRule', ATSRuleSchema);