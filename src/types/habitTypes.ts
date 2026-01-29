export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  goal: number;
}

export interface HabitCompletion {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
}

export interface HabitCompletionMap {
  [dateKey: string]: { [habitId: string]: boolean };
}

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDate(date1) === formatDate(date2);
};

export const isBeforeDay = (date1: Date, date2: Date): boolean => {
  return formatDate(date1) < formatDate(date2);
};

export const isAfterDay = (date1: Date, date2: Date): boolean => {
  return formatDate(date1) > formatDate(date2);
};
