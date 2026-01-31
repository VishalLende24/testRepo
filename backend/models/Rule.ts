import mongoose, { Schema, Document } from 'mongoose';

export interface IRule extends Document {
  ruleId: string;
  description: string;
  condition: {
    type: 'exact' | 'fuzzy';
    field: string;
    threshold?: number;
  };
  score: number;
  active: boolean;
  createdAt: Date;
}

const RuleSchema: Schema = new Schema({
  ruleId: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  condition: {
    type: { type: String, enum: ['exact', 'fuzzy'], required: true },
    field: { type: String, required: true },
    threshold: { type: Number }
  },
  score: { type: Number, required: true },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model<IRule>('Rule', RuleSchema);