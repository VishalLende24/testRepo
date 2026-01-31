import mongoose, { Schema, Document } from 'mongoose';

export interface IOfficerAction extends Document {
  applicationId: string;
  action: 'APPROVE' | 'REJECT';
  officerId: string;
  notes?: string;
  createdAt: Date;
}

const OfficerActionSchema: Schema = new Schema({
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  action: { type: String, enum: ['APPROVE', 'REJECT'], required: true },
  officerId: { type: String, required: true },
  notes: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<IOfficerAction>('OfficerAction', OfficerActionSchema);