import mongoose, { Document, Schema } from 'mongoose';

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  emoji?: string;
  goal: number;
  createdAt: Date;
  updatedAt: Date;
}

const habitSchema = new Schema<IHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    emoji: {
      type: String,
      trim: true,
    },
    goal: {
      type: Number,
      required: true,
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
habitSchema.index({ userId: 1, createdAt: -1 });

const Habit = mongoose.model<IHabit>('Habit', habitSchema);

export default Habit;
