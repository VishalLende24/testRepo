import mongoose, { Schema, Document } from 'mongoose';

export interface IDuplicateMatch extends Document {
  applicationId: string;
  matchedApplicationId: string;
  matchType: 'exact' | 'fuzzy';
  field: string;
  score?: number;
  createdAt: Date;
}

const DuplicateMatchSchema: Schema = new Schema({
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  matchedApplicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  matchType: { type: String, enum: ['exact', 'fuzzy'], required: true },
  field: { type: String, required: true },
  score: { type: Number }
}, {
  timestamps: true
});

export default mongoose.model<IDuplicateMatch>('DuplicateMatch', DuplicateMatchSchema);