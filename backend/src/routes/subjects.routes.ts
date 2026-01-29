import express, { Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Subject from '../models/Subject.model';

const router = express.Router();

// Get all subjects for user
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjects = await Subject.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json({ subjects });
  } catch (error: any) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Failed to get subjects' });
  }
});

// Create new subject
router.post('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, color } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const subject = new Subject({
      userId: req.userId,
      name,
      color: color || '#c77541',
    });

    await subject.save();
    res.status(201).json({ subject });
  } catch (error: any) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Update subject
router.put('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, color } = req.body;

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, color },
      { new: true, runValidators: true }
    );

    if (!subject) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }

    res.json({ subject });
  } catch (error: any) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// Delete subject
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subject = await Subject.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!subject) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }

    res.json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

export default router;
