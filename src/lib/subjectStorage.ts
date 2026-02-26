// Subject management with localStorage and API
import { subjectsApi } from "./api";
import { isTokenValid } from "./auth";
import { dataCache } from "./cache";

export interface Subject {
  id: string;
  name: string;
  color: string;
}

const SUBJECTS_KEY = "focus-flow-subjects";

// Default color palette
const COLORS = [
  "#c77541", // Orange
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#10b981", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#14b8a6", // Teal
  "#f43f5e", // Rose
];

const getRandomColor = (): string => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};

// Helper to use localStorage (fallback for offline)
const getLocalSubjects = (): Subject[] => {
  try {
    const stored = localStorage.getItem(SUBJECTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Error loading subjects from localStorage:", error);
    return [];
  }
};

const saveLocalSubjects = (subjects: Subject[]): void => {
  try {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
  } catch (error) {
    console.error("Error saving subjects to localStorage:", error);
  }
};

// Get subjects - try API first, fallback to localStorage
export const getSubjects = async (): Promise<Subject[]> => {
  const cacheKey = 'all_subjects';
  
  // Try cache first
  const cached = dataCache.get<Subject[]>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!isTokenValid()) {
    return getLocalSubjects();
  }

  try {
    const response = await subjectsApi.getAll();
    const subjects = response.subjects.map((s: any) => ({
      id: s._id,
      name: s.name,
      color: s.color,
    }));
    // Cache for 60 seconds (subjects change less frequently)
    dataCache.set(cacheKey, subjects, 60000);
    saveLocalSubjects(subjects);
    return subjects;
  } catch (error: any) {
    console.warn("Failed to fetch subjects from API, using localStorage:", error.message);
    return getLocalSubjects();
  }
};

export const saveSubjects = (subjects: Subject[]): void => {
  saveLocalSubjects(subjects);
};

export const addSubject = async (name: string, color?: string): Promise<Subject> => {
  const subjectColor = color || getRandomColor();

  if (!isTokenValid()) {
    const subjects = getLocalSubjects();
    const newSubject: Subject = {
      id: Date.now().toString(),
      name,
      color: subjectColor,
    };
    subjects.push(newSubject);
    saveLocalSubjects(subjects);
    return newSubject;
  }

  try {
    const response = await subjectsApi.create({ name, color: subjectColor });
    const newSubject: Subject = {
      id: response.subject._id,
      name: response.subject.name,
      color: response.subject.color,
    };
    // Invalidate cache
    dataCache.invalidate('all_subjects');
    // Update localStorage cache
    const subjects = getLocalSubjects();
    subjects.push(newSubject);
    saveLocalSubjects(subjects);
    return newSubject;
  } catch (error) {
    console.error("Failed to create subject via API, using localStorage:", error);
    const subjects = getLocalSubjects();
    const newSubject: Subject = {
      id: Date.now().toString(),
      name,
      color: subjectColor,
    };
    subjects.push(newSubject);
    saveLocalSubjects(subjects);
    return newSubject;
  }
};

export const updateSubject = async (id: string, updates: { name?: string; color?: string }): Promise<void> => {
  if (!isTokenValid()) {
    const subjects = getLocalSubjects();
    const index = subjects.findIndex((s) => s.id === id);
    if (index !== -1) {
      subjects[index] = { ...subjects[index], ...updates };
      saveLocalSubjects(subjects);
    }
    return;
  }

  try {
    await subjectsApi.update(id, updates);
    // Invalidate cache
    dataCache.invalidate('all_subjects');
    // Update localStorage cache
    const subjects = getLocalSubjects();
    const index = subjects.findIndex((s) => s.id === id);
    if (index !== -1) {
      subjects[index] = { ...subjects[index], ...updates };
      saveLocalSubjects(subjects);
    }
  } catch (error) {
    console.error("Failed to update subject via API:", error);
    const subjects = getLocalSubjects();
    const index = subjects.findIndex((s) => s.id === id);
    if (index !== -1) {
      subjects[index] = { ...subjects[index], ...updates };
      saveLocalSubjects(subjects);
    }
  }
};

export const deleteSubject = async (id: string): Promise<void> => {
  if (!isTokenValid()) {
    const subjects = getLocalSubjects();
    const filtered = subjects.filter((s) => s.id !== id);
    saveLocalSubjects(filtered);
    return;
  }

  try {
    await subjectsApi.delete(id);
    // Invalidate cache
    dataCache.invalidate('all_subjects');
    // Update localStorage cache
    const subjects = getLocalSubjects();
    const filtered = subjects.filter((s) => s.id !== id);
    saveLocalSubjects(filtered);
  } catch (error) {
    console.error("Failed to delete subject via API:", error);
    const subjects = getLocalSubjects();
    const filtered = subjects.filter((s) => s.id !== id);
    saveLocalSubjects(filtered);
  }
};
