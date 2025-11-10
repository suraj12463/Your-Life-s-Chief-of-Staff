// utils/goalUtils.ts
import { Goal, GoalStatus } from '../types';

const LOCAL_STORAGE_GOALS_KEY = 'ava_goals';

/**
 * Saves an array of goals to localStorage.
 * @param goals The array of Goal objects to save.
 */
export const saveGoalsToLocalStorage = (goals: Goal[]): void => {
  try {
    const serializedGoals = JSON.stringify(goals);
    localStorage.setItem(LOCAL_STORAGE_GOALS_KEY, serializedGoals);
  } catch (error) {
    console.error("Error saving goals to localStorage:", error);
  }
};

/**
 * Loads goals from localStorage.
 * @returns An array of Goal objects, or an empty array if none are found or an error occurs.
 */
export const loadGoalsFromLocalStorage = (): Goal[] => {
  try {
    const serializedGoals = localStorage.getItem(LOCAL_STORAGE_GOALS_KEY);
    if (serializedGoals === null) {
      return [];
    }
    const parsedGoals: Goal[] = JSON.parse(serializedGoals);
    // Ensure default values for progress and status for older entries
    return parsedGoals
      .map(goal => ({
        ...goal,
        progress: goal.progress ?? 0,
        status: goal.status ?? GoalStatus.NotStarted,
        creationDate: goal.creationDate || new Date().toISOString().split('T')[0], // Default if missing
      }))
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()); // Sort by target date
  } catch (error) {
    console.error("Error loading goals from localStorage:", error);
    return [];
  }
};

/**
 * Formats a goal's target date for display.
 * @param date YYYY-MM-DD string.
 * @returns A user-friendly formatted date string.
 */
export const formatGoalDate = (date: string): string => {
  try {
    const goalDate = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return goalDate.toLocaleString(undefined, options);
  } catch (error) {
    console.error("Error formatting goal date:", error);
    return date;
  }
};

/**
 * Identifies goals that are approaching their target date or are past due.
 * Only considers goals that are not yet completed.
 * @param goals The array of Goal objects.
 * @param daysThreshold The number of days before a target date to trigger a reminder (default 7 days).
 * @returns An array of Goal objects that need a reminder.
 */
export const getUpcomingGoalReminders = (goals: Goal[], daysThreshold: number = 7): Goal[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const reminders: Goal[] = [];

  goals.forEach(goal => {
    // Only consider goals that are not completed
    if (goal.status === GoalStatus.Completed || goal.status === GoalStatus.Cancelled) return;

    const targetDate = new Date(goal.targetDate);
    targetDate.setHours(0, 0, 0, 0); // Normalize to start of day

    const timeDiff = targetDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // If target date is within threshold (including today) or it's past due
    if ((daysDiff >= 0 && daysDiff <= daysThreshold) || daysDiff < 0) {
      reminders.push(goal);
    }
  });

  return reminders;
};