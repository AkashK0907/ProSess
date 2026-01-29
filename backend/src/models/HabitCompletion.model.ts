import mongoose, { Document, Schema } from 'mongoose';

export interface IHabitCompletion extends Document {
  habitId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const habitCompletionSchema = new Schema<IHabitCompletion>(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookups
habitCompletionSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });
habitCompletionSchema.index({ userId: 1, date: 1 });

const HabitCompletion = mongoose.model<IHabitCompletion>(
  'HabitCompletion',
  habitCompletionSchema
);

export default HabitCompletion;
