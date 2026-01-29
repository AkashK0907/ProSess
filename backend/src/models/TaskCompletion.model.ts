import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskCompletion extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskCompletionSchema = new Schema<ITaskCompletion>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
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
taskCompletionSchema.index({ userId: 1, taskId: 1, date: 1 }, { unique: true });
taskCompletionSchema.index({ userId: 1, date: 1 });

const TaskCompletion = mongoose.model<ITaskCompletion>(
  'TaskCompletion',
  taskCompletionSchema
);

export default TaskCompletion;
