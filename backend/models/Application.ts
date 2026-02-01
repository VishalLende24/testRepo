import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  fullName: string;
  email: string;
  phone: string;
  aadhaarHash: string;
  address: string;
  jobId: string;
  resumeText?: string;
  atsScore?: number;
  roleRelevanceScore?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  aadhaarHash: { type: String, required: true },
  address: { type: String, required: true },
  jobId: { type: String, required: true },
  resumeText: { type: String },
  atsScore: { type: Number },
  roleRelevanceScore: { type: Number },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  
}, {
  timestamps: true
});

export default mongoose.model<IApplication>('Application', ApplicationSchema);