import express, { Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Task from '../models/Task.model';
import TaskCompletion from '../models/TaskCompletion.model';

const router = express.Router();

// Get all tasks for user
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Create new task
router.post('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const task = new Task({
      userId: req.userId,
      name,
    });

    await task.save();
    res.status(201).json({ task });
  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name },
      { new: true, runValidators: true }
    );

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Delete all completions for this task
    await TaskCompletion.deleteMany({ taskId: req.params.id });

    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get task completions
router.get('/completions', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const query: any = { userId: req.userId };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const completions = await TaskCompletion.find(query);
    res.json({ completions });
  } catch (error: any) {
    console.error('Get completions error:', error);
    res.status(500).json({ error: 'Failed to get completions' });
  }
});

// Toggle task completion
router.post('/completions', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId, date } = req.body;

    if (!taskId || !date) {
      res.status(400).json({ error: 'taskId and date are required' });
      return;
    }

    // Check if completion exists
    const existing = await TaskCompletion.findOne({
      taskId,
      userId: req.userId,
      date,
    });

    if (existing) {
      // Toggle completion status
      existing.completed = !existing.completed;
      await existing.save();
      res.json({ completion: existing });
    } else {
      // Create new completion
      const completion = new TaskCompletion({
        taskId,
        userId: req.userId,
        date,
        completed: true,
      });
      await completion.save();
      res.status(201).json({ completion });
    }
  } catch (error: any) {
    console.error('Toggle completion error:', error);
    res.status(500).json({ error: 'Failed to toggle completion' });
  }
});

export default router;
