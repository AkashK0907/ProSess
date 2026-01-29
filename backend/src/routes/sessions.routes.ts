import express, { Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import Session from '../models/Session.model';

const router = express.Router();

// Get sessions
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const query: any = { userId: req.userId };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const sessions = await Session.find(query).sort({ date: -1 });
    res.json({ sessions });
  } catch (error: any) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Create session
router.post('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subject, minutes, date, notes } = req.body;

    if (!subject || !minutes || !date) {
      res.status(400).json({ error: 'Subject, minutes, and date are required' });
      return;
    }

    const session = new Session({
      userId: req.userId,
      subject,
      minutes,
      date,
      notes,
    });

    await session.save();
    res.status(201).json({ session });
  } catch (error: any) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get statistics
router.get('/stats', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await Session.find({ userId: req.userId });

    // Calculate total minutes
    const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);

    // Find best day
    const dayTotals = sessions.reduce((acc: any, s) => {
      acc[s.date] = (acc[s.date] || 0) + s.minutes;
      return acc;
    }, {});

    let bestDay = '';
    let bestDayMinutes = 0;
    Object.entries(dayTotals).forEach(([date, minutes]) => {
      if ((minutes as number) > bestDayMinutes) {
        bestDay = date;
        bestDayMinutes = minutes as number;
      }
    });

    // Calculate streaks
    // Sort dates descending
    const dates = Object.keys(dayTotals).sort((a, b) => b.localeCompare(a));
    let currentStreak = 0;
    let highestStreak = 0;

    if (dates.length > 0) {
      // Calculate current streak (active)
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Since dates in DB might be local "YYYY-MM-DD" but here we construct simple ISO,
      // we need to be careful. Ideally we normalize.
      // However, assuming user and server are same timezone (local dev),
      // we can try to match the last date.
      
      const lastDate = dates[0];
      
      // Check if streak is alive (last session was today or yesterday)
      // Note: We use simple string comparison which works if formats match.
      // If formats differ (e.g. server UTC vs local), this might be fragile
      // but is an improvement over previous logic.
      
      // We'll calculate current streak by counting backwards from the most recent date
      // IF that date is recent enough.
      
      const lastDateObj = new Date(lastDate);
      const diffTime = Math.abs(now.getTime() - lastDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      // If last session was within last 48 hours (allows for some timezone offset safety)
      // or literally today/yesterday strings match
      const isStreakActive = (lastDate === todayStr || lastDate === yesterdayStr || diffDays <= 2);

      if (isStreakActive) {
         currentStreak = 1;
         for (let i = 0; i < dates.length - 1; i++) {
           const curr = new Date(dates[i]);
           const prev = new Date(dates[i+1]); // next in descending list is older
           const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
           
           if (diff === 1) {
             currentStreak++;
           } else {
             break;
           }
         }
      }

      // Calculate highest streak historically
      // Iterate through all dates sorted descending
      let tempStreak = 1;
      highestStreak = 1;
      
      for (let i = 0; i < dates.length - 1; i++) {
         const curr = new Date(dates[i]);
         const prev = new Date(dates[i+1]);
         const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
         
         if (diff === 1) {
           tempStreak++;
         } else {
           highestStreak = Math.max(highestStreak, tempStreak);
           tempStreak = 1;
         }
      }
      highestStreak = Math.max(highestStreak, tempStreak);
    }

    res.json({
      totalMinutes,
      bestDay,
      bestDayMinutes,
      currentStreak,
      highestStreak,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Update session
router.put('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { subject, minutes, date, notes } = req.body;

    const session = await Session.findOne({ _id: id, userId: req.userId });
    
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (subject !== undefined) session.subject = subject;
    if (minutes !== undefined) session.minutes = minutes;
    if (date !== undefined) session.date = date;
    if (notes !== undefined) session.notes = notes;

    await session.save();
    res.json({ session });
  } catch (error: any) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete session
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await Session.findOneAndDelete({ _id: id, userId: req.userId });
    
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error: any) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
