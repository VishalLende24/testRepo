import mongoose, { Schema, Document } from 'mongoose';

export interface IExplanation extends Document {
  applicationId: string;
  explanations: string[];
  createdAt: Date;
}

const ExplanationSchema: Schema = new Schema({
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  explanations: [{ type: String }]
}, {
  timestamps: true
});

export default mongoose.model<IExplanation>('Explanation', ExplanationSchema);