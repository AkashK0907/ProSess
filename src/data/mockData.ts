// Mock data for the application

export interface Subject {
  id: string;
  name: string;
  color: string;
  todayMinutes: number;
}

export interface Task {
  id: string;
  name: string;
  weeklyStatus: boolean[]; // 4 weeks, true = done
}

export interface MusicTrack {
  id: string;
  name: string;
  duration: string;
  bpm: number;
}

export interface SessionStats {
  date: string;
  minutes: number;
  subject: string;
}

export const subjects: Subject[] = [
  { id: "1", name: "Mathematics", color: "#B85C38", todayMinutes: 45 },
  { id: "2", name: "Physics", color: "#6B7280", todayMinutes: 30 },
  { id: "3", name: "Literature", color: "#059669", todayMinutes: 0 },
  { id: "4", name: "Programming", color: "#7C3AED", todayMinutes: 90 },
  { id: "5", name: "Chemistry", color: "#DC2626", todayMinutes: 15 },
];

export const tasks: Task[] = [
  { id: "1", name: "Practice problems", weeklyStatus: [true, true, false, true] },
  { id: "2", name: "Read chapter", weeklyStatus: [true, true, true, true] },
  { id: "3", name: "Review notes", weeklyStatus: [false, true, true, false] },
  { id: "4", name: "Exercise set", weeklyStatus: [true, false, true, true] },
  { id: "5", name: "Project work", weeklyStatus: [true, true, true, false] },
];

export const musicTracks: MusicTrack[] = [
  { id: "1", name: "Deep Focus", duration: "45:00", bpm: 72 },
  { id: "2", name: "Ambient Study", duration: "60:00", bpm: 65 },
  { id: "3", name: "Lo-Fi Beats", duration: "30:00", bpm: 85 },
  { id: "4", name: "Classical Piano", duration: "55:00", bpm: 90 },
  { id: "5", name: "Nature Sounds", duration: "40:00", bpm: 0 },
];

export const dailyStats: SessionStats[] = [
  { date: "Mon", minutes: 120, subject: "Mathematics" },
  { date: "Tue", minutes: 90, subject: "Physics" },
  { date: "Wed", minutes: 150, subject: "Programming" },
  { date: "Thu", minutes: 60, subject: "Literature" },
  { date: "Fri", minutes: 180, subject: "Mathematics" },
  { date: "Sat", minutes: 45, subject: "Chemistry" },
  { date: "Sun", minutes: 75, subject: "Physics" },
];

// Generate monthly progress data for all days in current month
export const generateMonthlyProgress = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  
  const progress = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    // Generate realistic completion percentages with some variation
    // Past days: random between 60-95%
    // Future days: 0% (not yet completed)
    let completion;
    
    if (day <= currentDay) {
      // Add some variation: base of 70% with random variation of ±20%
      const base = 70;
      const variation = Math.sin(day * 0.5) * 15 + Math.cos(day * 0.3) * 10;
      completion = Math.round(Math.max(50, Math.min(95, base + variation)));
    } else {
      completion = 0;
    }
    
    progress.push({ date: day, completion });
  }
  
  return progress;
};

export const monthlyProgress = generateMonthlyProgress();

export const profileData = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  phone: "+1 (555) 123-4567",
  currentStreak: 12,
  highestStreak: 28,
  bestDay: "Jan 15, 2024",
  bestDayMinutes: 312,
  bestMonth: "December 2023",
  bestMonthHours: 68,
};
