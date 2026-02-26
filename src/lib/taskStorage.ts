// Shared task management with localStorage and API
import { tasksApi } from "./api";
import { isTokenValid } from "./auth";
import { dataCache } from "./cache";

export interface TrackedTask {
  id: string;
  name: string;
  createdAt: string; // ISO date string
}

export interface TaskCompletion {
  [dateKey: string]: { [taskId: string]: boolean };
}

const TASKS_KEY = "focus-flow-tasks";
const TASK_COMPLETIONS_KEY = "focus-flow-task-completions";

const DEFAULT_TASKS: TrackedTask[] = [
  { id: "1", name: "Practice problems", createdAt: new Date().toISOString() },
  { id: "2", name: "Read chapter", createdAt: new Date().toISOString() },
  { id: "3", name: "Review notes", createdAt: new Date().toISOString() },
  { id: "4", name: "Exercise set", createdAt: new Date().toISOString() },
  { id: "5", name: "Project work", createdAt: new Date().toISOString() },
];

// Helper to use localStorage (fallback for offline)
const getLocalTasks = (): TrackedTask[] => {
  try {
    const stored = localStorage.getItem(TASKS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_TASKS;
  } catch (error) {
    console.error("Error loading tasks from localStorage:", error);
    return DEFAULT_TASKS;
  }
};

const saveLocalTasks = (tasks: TrackedTask[]): void => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks to localStorage:", error);
  }
};

// Get tasks - try API first, fallback to localStorage
export const getTasks = async (): Promise<TrackedTask[]> => {
  const cacheKey = 'all_tasks';
  
  const cached = dataCache.get<TrackedTask[]>(cacheKey);
  if (cached) {
    return cached;
  }

  if (!isTokenValid()) {
    return getLocalTasks();
  }

  try {
    const response = await tasksApi.getAll();
    const tasks = response.tasks.map((t: any) => ({
      id: t._id,
      name: t.name,
      createdAt: t.createdAt || new Date().toISOString(),
    }));
    dataCache.set(cacheKey, tasks, 60000);
    saveLocalTasks(tasks);
    return tasks;
  } catch (error: any) {
    console.warn("Failed to fetch tasks from API, using localStorage:", error.message);
    return getLocalTasks();
  }
};

export const saveTasks = (tasks: TrackedTask[]): void => {
  saveLocalTasks(tasks);
};

export const addTask = async (name: string): Promise<TrackedTask> => {
  if (!isTokenValid()) {
    const tasks = getLocalTasks();
    const newTask: TrackedTask = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    saveLocalTasks(tasks);
    return newTask;
  }

  try {
    const response = await tasksApi.create({ name });
    const newTask: TrackedTask = {
      id: response.task._id,
      name: response.task.name,
      createdAt: response.task.createdAt,
    };
    dataCache.invalidate('all_tasks');
    // Update localStorage cache
    const tasks = getLocalTasks();
    tasks.push(newTask);
    saveLocalTasks(tasks);
    return newTask;
  } catch (error) {
    console.error("Failed to create task via API, using localStorage:", error);
    const tasks = getLocalTasks();
    const newTask: TrackedTask = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    saveLocalTasks(tasks);
    return newTask;
  }
};

export const updateTask = async (id: string, name: string): Promise<void> => {
  if (!isTokenValid()) {
    const tasks = getLocalTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      tasks[index].name = name;
      saveLocalTasks(tasks);
    }
    return;
  }

  try {
    await tasksApi.update(id, { name });
    dataCache.invalidate('all_tasks');
    // Update localStorage cache
    const tasks = getLocalTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      tasks[index].name = name;
      saveLocalTasks(tasks);
    }
  } catch (error) {
    console.error("Failed to update task via API:", error);
    const tasks = getLocalTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      tasks[index].name = name;
      saveLocalTasks(tasks);
    }
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  if (!isTokenValid()) {
    const tasks = getLocalTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    saveLocalTasks(filtered);
    return;
  }

  try {
    await tasksApi.delete(id);
    dataCache.invalidate('all_tasks');
    // Update localStorage cache
    const tasks = getLocalTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    saveLocalTasks(filtered);
  } catch (error) {
    console.error("Failed to delete task via API:", error);
    const tasks = getLocalTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    saveLocalTasks(filtered);
  }
};

// Task completion management
const getLocalTaskCompletions = (): TaskCompletion => {
  try {
    const stored = localStorage.getItem(TASK_COMPLETIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch (error) {
    console.error("Error loading task completions from localStorage:", error);
    return {};
  }
};

const saveLocalTaskCompletions = (completions: TaskCompletion): void => {
  try {
    localStorage.setItem(TASK_COMPLETIONS_KEY, JSON.stringify(completions));
  } catch (error) {
    console.error("Error saving task completions to localStorage:", error);
  }
};

export const getTaskCompletions = async (): Promise<TaskCompletion> => {
  if (!isTokenValid()) {
    return getLocalTaskCompletions();
  }

  try {
    const response = await tasksApi.getCompletions();
    const map: TaskCompletion = {};
    response.completions.forEach((c: any) => {
      if (!map[c.date]) map[c.date] = {};
      map[c.date][c.taskId] = c.completed;
    });
    saveLocalTaskCompletions(map);
    return map;
  } catch (error) {
    console.warn("Failed to fetch task completions from API, using localStorage:", error);
    return getLocalTaskCompletions();
  }
};

export const saveTaskCompletions = (completions: TaskCompletion): void => {
  saveLocalTaskCompletions(completions);
};

export const toggleTaskCompletion = async (taskId: string, dateKey: string): Promise<boolean> => {
  if (!isTokenValid()) {
    const completions = getLocalTaskCompletions();
    if (!completions[dateKey]) {
      completions[dateKey] = {};
    }
    const currentStatus = completions[dateKey][taskId] || false;
    completions[dateKey][taskId] = !currentStatus;
    saveLocalTaskCompletions(completions);
    return completions[dateKey][taskId];
  }

  try {
    const response = await tasksApi.toggleCompletion({ taskId, date: dateKey });
    // Update localStorage cache
    const completions = getLocalTaskCompletions();
    if (!completions[dateKey]) {
      completions[dateKey] = {};
    }
    completions[dateKey][taskId] = response.completion.completed;
    saveLocalTaskCompletions(completions);
    return response.completion.completed;
  } catch (error) {
    console.error("Failed to toggle task completion via API:", error);
    const completions = getLocalTaskCompletions();
    if (!completions[dateKey]) {
      completions[dateKey] = {};
    }
    const currentStatus = completions[dateKey][taskId] || false;
    completions[dateKey][taskId] = !currentStatus;
    saveLocalTaskCompletions(completions);
    return completions[dateKey][taskId];
  }
};

export const isTaskCompleted = (taskId: string, dateKey: string): boolean => {
  const completions = getLocalTaskCompletions();
  return completions[dateKey]?.[taskId] || false;
};

export const initializeDefaultTasks = (): void => {
  const existing = localStorage.getItem(TASKS_KEY);
  if (!existing) {
    saveLocalTasks(DEFAULT_TASKS);
  }
};

