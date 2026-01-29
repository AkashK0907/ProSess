import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      default: '#c77541', // Default orange color
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups
subjectSchema.index({ userId: 1 });

const Subject = mongoose.model<ISubject>('Subject', subjectSchema);

export default Subject;
