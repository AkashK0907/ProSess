import { Habit, HabitCompletionMap, formatDate } from "@/types/habitTypes";
import { habitsApi } from "./api";
import { isTokenValid } from "./auth";

const HABITS_KEY = "focus-flow-habits";
const COMPLETIONS_KEY = "focus-flow-completions";

// Default habits - task-based examples
const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "Morning Exercise", emoji: "🏃", goal: 30 },
  { id: "2", name: "Read Books", emoji: "📚", goal: 30 },
  { id: "3", name: "Meditation", emoji: "🧘", goal: 30 },
  { id: "4", name: "Study Session", emoji: "📝", goal: 30 },
  { id: "5", name: "Practice Coding", emoji: "💻", goal: 30 },
];

// Helper to use localStorage (fallback for offline)
const getLocalHabits = (): Habit[] => {
  try {
    const stored = localStorage.getItem(HABITS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_HABITS;
  } catch (error) {
    console.error("Error loading habits from localStorage:", error);
    return DEFAULT_HABITS;
  }
};

const saveLocalHabits = (habits: Habit[]): void => {
  try {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (error) {
    console.error("Error saving habits to localStorage:", error);
  }
};

// Get habits - try API first, fallback to localStorage
export const getHabits = async (): Promise<Habit[]> => {
  if (!isTokenValid()) {
    return getLocalHabits();
  }

  try {
    const response = await habitsApi.getAll();
    const habits = response.habits.map((h: any) => ({
      id: h._id,
      name: h.name,
      emoji: h.emoji,
      goal: h.goal,
    }));
    // Cache in localStorage
    saveLocalHabits(habits);
    return habits;
  } catch (error: any) {
    console.warn("Failed to fetch habits from API, using localStorage:", error.message);
    return getLocalHabits();
  }
};

export const saveHabits = (habits: Habit[]): void => {
  saveLocalHabits(habits);
};

export const addHabit = async (habit: Omit<Habit, "id">): Promise<Habit> => {
  if (!isTokenValid()) {
    // Offline mode - use localStorage
    const habits = getLocalHabits();
    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
    };
    habits.push(newHabit);
    saveLocalHabits(habits);
    return newHabit;
  }

  try {
    const response = await habitsApi.create({
      name: habit.name,
      emoji: habit.emoji,
      goal: habit.goal,
    });
    const newHabit: Habit = {
      id: response.habit._id,
      name: response.habit.name,
      emoji: response.habit.emoji,
      goal: response.habit.goal,
    };
    // Update localStorage cache
    const habits = getLocalHabits();
    habits.push(newHabit);
    saveLocalHabits(habits);
    return newHabit;
  } catch (error) {
    console.error("Failed to create habit via API, using localStorage:", error);
    const habits = getLocalHabits();
    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
    };
    habits.push(newHabit);
    saveLocalHabits(habits);
    return newHabit;
  }
};

export const updateHabit = async (id: string, updates: Partial<Omit<Habit, "id">>): Promise<void> => {
  if (!isTokenValid()) {
    const habits = getLocalHabits();
    const index = habits.findIndex((h) => h.id === id);
    if (index !== -1) {
      habits[index] = { ...habits[index], ...updates };
      saveLocalHabits(habits);
    }
    return;
  }

  try {
    await habitsApi.update(id, updates);
    // Update localStorage cache
    const habits = getLocalHabits();
    const index = habits.findIndex((h) => h.id === id);
    if (index !== -1) {
      habits[index] = { ...habits[index], ...updates };
      saveLocalHabits(habits);
    }
  } catch (error) {
    console.error("Failed to update habit via API:", error);
    // Still update localStorage
    const habits = getLocalHabits();
    const index = habits.findIndex((h) => h.id === id);
    if (index !== -1) {
      habits[index] = { ...habits[index], ...updates };
      saveLocalHabits(habits);
    }
  }
};

export const deleteHabit = async (id: string): Promise<void> => {
  if (!isTokenValid()) {
    const habits = getLocalHabits();
    const filtered = habits.filter((h) => h.id !== id);
    saveLocalHabits(filtered);
    return;
  }

  try {
    await habitsApi.delete(id);
    // Update localStorage cache
    const habits = getLocalHabits();
    const filtered = habits.filter((h) => h.id !== id);
    saveLocalHabits(filtered);
  } catch (error) {
    console.error("Failed to delete habit via API:", error);
    const habits = getLocalHabits();
    const filtered = habits.filter((h) => h.id !== id);
    saveLocalHabits(filtered);
  }
};

// Completions management
const getLocalCompletions = (): HabitCompletionMap => {
  try {
    const stored = localStorage.getItem(COMPLETIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch (error) {
    console.error("Error loading completions from localStorage:", error);
    return {};
  }
};

const saveLocalCompletions = (completions: HabitCompletionMap): void => {
  try {
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
  } catch (error) {
    console.error("Error saving completions to localStorage:", error);
  }
};

export const getCompletions = async (): Promise<HabitCompletionMap> => {
  if (!isTokenValid()) {
    return getLocalCompletions();
  }

  try {
    const response = await habitsApi.getCompletions();
    const map: HabitCompletionMap = {};
    response.completions.forEach((c: any) => {
      if (!map[c.date]) map[c.date] = {};
      map[c.date][c.habitId] = c.completed;
    });
    saveLocalCompletions(map);
    return map;
  } catch (error) {
    console.warn("Failed to fetch completions from API, using localStorage:", error);
    return getLocalCompletions();
  }
};

export const saveCompletions = (completions: HabitCompletionMap): void => {
  saveLocalCompletions(completions);
};

export const toggleCompletion = async (habitId: string, date: Date): Promise<boolean> => {
  const dateKey = formatDate(date);

  if (!isTokenValid()) {
    const completions = getLocalCompletions();
    if (!completions[dateKey]) {
      completions[dateKey] = {};
    }
    const currentStatus = completions[dateKey][habitId] || false;
    completions[dateKey][habitId] = !currentStatus;
    saveLocalCompletions(completions);
    return completions[dateKey][habitId];
  }

  try {
    const response = await habitsApi.toggleCompletion({ habitId, date: dateKey });
    // Update localStorage cache
    const completions = getLocalCompletions();
    if (!completions[dateKey]) {
      completions[dateKey] = {};
    }
    completions[dateKey][habitId] = response.completion.completed;
    saveLocalCompletions(completions);
    return response.completion.completed;
  } catch (error) {
    console.error("Failed to toggle completion via API:", error);
    const completions = getLocalCompletions();
    if (!completions[dateKey]) {
      completions[dateKey] = {};
    }
    const currentStatus = completions[dateKey][habitId] || false;
    completions[dateKey][habitId] = !currentStatus;
    saveLocalCompletions(completions);
    return completions[dateKey][habitId];
  }
};

export const isHabitCompleted = (habitId: string, date: Date): boolean => {
  const dateKey = formatDate(date);
  const completions = getLocalCompletions();
  return completions[dateKey]?.[habitId] || false;
};

export const initializeDefaultHabits = (): void => {
  const existing = localStorage.getItem(HABITS_KEY);
  if (!existing) {
    saveLocalHabits(DEFAULT_HABITS);
  }
};

