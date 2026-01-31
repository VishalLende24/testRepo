import mongoose, { Schema, Document } from 'mongoose';

export interface ICondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex' | 'in_range';
  value: any;
  weight: number;
}

export interface IRule extends Document {
  ruleId: string;
  name: string;
  description: string;
  conditions: ICondition[];
  logic: 'AND' | 'OR';
  score: number;
  priority: number;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConditionSchema = new Schema({
  field: { type: String, required: true },
  operator: { 
    type: String, 
    enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'regex', 'in_range'], 
    required: true 
  },
  value: { type: Schema.Types.Mixed, required: true },
  weight: { type: Number, default: 1, min: 0, max: 1 }
});

const RuleSchema: Schema = new Schema({
  ruleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  conditions: [ConditionSchema],
  logic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
  score: { type: Number, required: true, min: 0, max: 100 },
  priority: { type: Number, default: 1, min: 1 },
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  createdBy: { type: String, default: 'ADMIN' }
}, {
  timestamps: true
});

export default mongoose.model<IRule>('Rule', RuleSchema);