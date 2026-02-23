// Session management with localStorage and API
import { sessionsApi } from "./api";
import { toast } from "sonner";
import { isAuthenticated } from "./auth";
import { dataCache } from "./cache";

export interface StudySession {
  id: string;
  subject: string;
  minutes: number;
  date: string; // YYYY-MM-DD format
  notes?: string; // Optional session notes
}

export interface SessionStats {
  totalMinutes: number;
  bestDay: string;
  bestDayMinutes: number;
  currentStreak: number;
  highestStreak: number;
}

const SESSIONS_KEY = "focus-flow-sessions";

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to use localStorage (fallback for offline)
const getLocalSessions = (): StudySession[] => {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Error loading sessions from localStorage:", error);
    return [];
  }
};

const saveLocalSessions = (sessions: StudySession[]): void => {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving sessions to localStorage:", error);
  }
};

// Sync offline sessions (short timestamp IDs) to the server.
// Returns true if any sessions were synced so the caller can invalidate caches.
export const syncOfflineSessions = async (): Promise<boolean> => {
  if (!isAuthenticated()) return false;

  const currentLocal = getLocalSessions();
  // Timestamp IDs are ~13 chars; Mongo IDs are 24 chars
  const offlineToSync = currentLocal.filter(s => s.id.length < 20);

  if (offlineToSync.length === 0) return false;

  console.log(`Found ${offlineToSync.length} offline sessions. Syncing to server...`);
  const toastId = toast.loading(`Syncing ${offlineToSync.length} offline session(s)...`);

  await Promise.all(
    offlineToSync.map(async (s) => {
      try {
        await sessionsApi.create({
          subject: s.subject,
          minutes: s.minutes,
          date: s.date,
          notes: s.notes,
        });
      } catch (err) {
        console.error("Failed to sync offline session:", s, err);
      }
    })
  );

  toast.dismiss(toastId);
  toast.success("Offline sessions synced successfully!");

  // Remove synced (offline) entries from localStorage so they aren't re-synced
  const onlyServerSessions = currentLocal.filter(s => s.id.length >= 20);
  saveLocalSessions(onlyServerSessions);

  // Bust the data cache so the next getSessions() hits the server
  dataCache.invalidate('all_sessions');

  return true;
};

// Get all sessions
export const getSessions = async (): Promise<StudySession[]> => {
  const cacheKey = 'all_sessions';
  
  // Try cache first
  const cached = dataCache.get<StudySession[]>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!isAuthenticated()) {
    return getLocalSessions();
  }

  try {
    const response = await sessionsApi.getAll();
    const serverSessions: StudySession[] = response.sessions.map((s: any) => ({
      id: s._id,
      subject: s.subject,
      minutes: s.minutes,
      date: s.date,
      notes: s.notes,
    }));

    // Keep any offline-only sessions that haven't reached the server yet
    const localSessions = getLocalSessions();
    const offlineSessions = localSessions.filter(local =>
      !serverSessions.some(server => server.id === local.id)
    );

    const mergedSessions = [...serverSessions, ...offlineSessions];

    // Cache for 30 seconds
    dataCache.set(cacheKey, mergedSessions, 30000);
    saveLocalSessions(mergedSessions);
    return mergedSessions;
  } catch (error) {
    console.error('Failed to fetch sessions from API, using localStorage:', error);
    return getLocalSessions();
  }
};

// Add a new session
export const addSession = async (subject: string, minutes: number, date?: Date, notes?: string): Promise<StudySession> => {
  const sessionDate = date ? formatDate(date) : formatDate(new Date());

  if (!isAuthenticated()) {
    const sessions = getLocalSessions();
    const newSession: StudySession = {
      id: Date.now().toString(),
      subject,
      minutes,
      date: sessionDate,
      notes,
    };
    sessions.push(newSession);
    saveLocalSessions(sessions);
    return newSession;
  }

  try {
    const response = await sessionsApi.create({
      subject,
      minutes,
      date: sessionDate,
      notes,
    });
    const newSession: StudySession = {
      id: response.session._id,
      subject: response.session.subject,
      minutes: response.session.minutes,
      date: response.session.date,
      notes: response.session.notes,
    };
    // Invalidate cache
    dataCache.invalidate('all_sessions');
    // Update localStorage cache
    const sessions = getLocalSessions();
    sessions.push(newSession);
    saveLocalSessions(sessions);
    return newSession;
  } catch (error) {
    console.error("Failed to create session via API, using localStorage:", error);
    const sessions = getLocalSessions();
    const newSession: StudySession = {
      id: Date.now().toString(),
      subject,
      minutes,
      date: sessionDate,
      notes,
    };
    sessions.push(newSession);
    saveLocalSessions(sessions);
    return newSession;
  }
};

// Update a session
export const updateSession = async (id: string, updates: Partial<Omit<StudySession, 'id'>>): Promise<StudySession> => {
  if (!isAuthenticated()) {
    const sessions = getLocalSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Session not found');
    }
    sessions[index] = { ...sessions[index], ...updates };
    saveLocalSessions(sessions);
    return sessions[index];
  }

  try {
    const response = await sessionsApi.update(id, updates);
    const updatedSession: StudySession = {
      id: response.session._id,
      subject: response.session.subject,
      minutes: response.session.minutes,
      date: response.session.date,
      notes: response.session.notes,
    };
    // Invalidate cache
    dataCache.invalidate('all_sessions');
    // Update localStorage cache
    const sessions = getLocalSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      sessions[index] = updatedSession;
      saveLocalSessions(sessions);
    }
    return updatedSession;
  } catch (error) {
    console.error('Failed to update session via API, using localStorage:', error);
    const sessions = getLocalSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Session not found');
    }
    sessions[index] = { ...sessions[index], ...updates };
    saveLocalSessions(sessions);
    return sessions[index];
  }
};

// Delete a session
export const deleteSession = async (id: string): Promise<void> => {
  if (!isAuthenticated()) {
    const sessions = getLocalSessions();
    const filtered = sessions.filter(s => s.id !== id);
    saveLocalSessions(filtered);
    return;
  }

  try {
    await sessionsApi.delete(id);
    // Invalidate cache
    dataCache.invalidate('all_sessions');
    // Update localStorage cache
    const sessions = getLocalSessions();
    const filtered = sessions.filter(s => s.id !== id);
    saveLocalSessions(filtered);
  } catch (error) {
    console.error('Failed to delete session via API, using localStorage:', error);
    const sessions = getLocalSessions();
    const filtered = sessions.filter(s => s.id !== id);
    saveLocalSessions(filtered);
  }
};

// Get session statistics
export const getSessionStats = async (): Promise<SessionStats> => {
  if (!isAuthenticated()) {
    const sessions = getLocalSessions();
    return calculateStats(sessions);
  }

  try {
    const stats = await sessionsApi.getStats();
    return stats;
  } catch (error) {
    console.warn("Failed to fetch stats from API, calculating from localStorage:", error);
    const sessions = getLocalSessions();
    return calculateStats(sessions);
  }
};

// Calculate stats from local sessions
export const calculateStats = (sessions: StudySession[]): SessionStats => {
  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);

  // Find best day
  const dayTotals: { [date: string]: number } = {};
  sessions.forEach(s => {
    dayTotals[s.date] = (dayTotals[s.date] || 0) + s.minutes;
  });

  let bestDay = '';
  let bestDayMinutes = 0;
  Object.entries(dayTotals).forEach(([date, minutes]) => {
    if (minutes > bestDayMinutes) {
      bestDay = date;
      bestDayMinutes = minutes;
    }
  });

  // Calculate streaks
  const sortedDates = Object.keys(dayTotals).sort();
  let currentStreak = 0;
  let highestStreak = 0;
  let tempStreak = 0;

  if (sortedDates.length > 0) {
    // Calculate highest streak historically
    tempStreak = 1;
    highestStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      highestStreak = Math.max(highestStreak, tempStreak);
    }

    // Calculate current streak
    // Check if user studied today or yesterday to keep streak alive
    const today = new Date();
    const todayStr = formatDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    const lastStudyDate = sortedDates[sortedDates.length - 1];

    if (lastStudyDate === todayStr || lastStudyDate === yesterdayStr) {
      // Streak is alive, count backwards
      currentStreak = 1;
      for (let i = sortedDates.length - 1; i > 0; i--) {
        const curr = new Date(sortedDates[i]);
        const prev = new Date(sortedDates[i - 1]);
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      // Streak is broken
      currentStreak = 0;
    }
  }

  return {
    totalMinutes,
    bestDay,
    bestDayMinutes,
    currentStreak,
    highestStreak,
  };
};

// Get today's sessions
export const getTodaySessions = async (): Promise<StudySession[]> => {
  const today = formatDate(new Date());
  const allSessions = await getSessions();
  return allSessions.filter(s => s.date === today);
};

// Get sessions for a specific date
export const getSessionsForDate = async (date: Date): Promise<StudySession[]> => {
  const dateStr = formatDate(date);
  const allSessions = await getSessions();
  return allSessions.filter(s => s.date === dateStr);
};
