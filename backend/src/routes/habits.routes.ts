import express, { Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Habit from '../models/Habit.model';
import HabitCompletion from '../models/HabitCompletion.model';

const router = express.Router();

// Get all habits for user
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habits = await Habit.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ habits });
  } catch (error: any) {
    console.error('Get habits error:', error);
    res.status(500).json({ error: 'Failed to get habits' });
  }
});

// Create new habit
router.post('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, emoji, goal } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const habit = new Habit({
      userId: req.userId,
      name,
      emoji,
      goal: goal || 30,
    });

    await habit.save();
    res.status(201).json({ habit });
  } catch (error: any) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// Update habit
router.put('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, emoji, goal } = req.body;

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, emoji, goal },
      { new: true, runValidators: true }
    );

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    res.json({ habit });
  } catch (error: any) {
    console.error('Update habit error:', error);
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

// Delete habit
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    // Delete all completions for this habit
    await HabitCompletion.deleteMany({ habitId: req.params.id });

    res.json({ message: 'Habit deleted successfully' });
  } catch (error: any) {
    console.error('Delete habit error:', error);
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// Get habit completions
router.get('/completions', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const query: any = { userId: req.userId };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const completions = await HabitCompletion.find(query);
    res.json({ completions });
  } catch (error: any) {
    console.error('Get completions error:', error);
    res.status(500).json({ error: 'Failed to get completions' });
  }
});

// Toggle habit completion
router.post('/completions', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { habitId, date } = req.body;

    if (!habitId || !date) {
      res.status(400).json({ error: 'habitId and date are required' });
      return;
    }

    // Check if completion exists
    const existing = await HabitCompletion.findOne({
      habitId,
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
      const completion = new HabitCompletion({
        habitId,
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
