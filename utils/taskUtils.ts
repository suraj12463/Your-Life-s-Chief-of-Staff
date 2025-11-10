// utils/taskUtils.ts
import { RecurringTask, RecurrenceType, SortCriterion } from '../types';

const LOCAL_STORAGE_RECURRING_TASKS_KEY = 'ava_recurring_tasks';

/**
 * Saves an array of recurring tasks to localStorage.
 * @param tasks The array of RecurringTask objects to save.
 */
export const saveRecurringTasksToLocalStorage = (tasks: RecurringTask[]): void => {
  try {
    const serializedTasks = JSON.stringify(tasks);
    localStorage.setItem(LOCAL_STORAGE_RECURRING_TASKS_KEY, serializedTasks);
  } catch (error) {
    console.error("Error saving recurring tasks to localStorage:", error);
  }
};

/**
 * Loads recurring tasks from localStorage.
 * @returns An array of RecurringTask objects, or an empty array if none are found or an error occurs.
 */
export const loadRecurringTasksFromLocalStorage = (): RecurringTask[] => {
  try {
    const serializedTasks = localStorage.getItem(LOCAL_STORAGE_RECURRING_TASKS_KEY);
    if (serializedTasks === null) {
      return [];
    }
    const parsedTasks: RecurringTask[] = JSON.parse(serializedTasks);
    // Ensure 'completed' property exists for older entries, defaulting to false
    return parsedTasks
      .map(task => ({ ...task, completed: task.completed ?? false }));
  } catch (error) {
    console.error("Error loading recurring tasks from localStorage:", error);
    return [];
  }
};

/**
 * Formats a recurring task for display.
 * @param task The RecurringTask object.
 * @returns A user-friendly string describing the task and its recurrence, including due date if present.
 */
export const formatRecurringTask = (task: RecurringTask): string => {
  let recurrenceText = '';
  switch (task.recurrence) {
    case RecurrenceType.Daily:
      recurrenceText = 'Daily';
      break;
    case RecurrenceType.Weekly:
      recurrenceText = 'Weekly';
      break;
    case RecurrenceType.Monthly:
      recurrenceText = 'Monthly';
      break;
    default:
      recurrenceText = 'Unknown Recurrence';
  }
  const dueDateText = task.dueDate ? ` (Due: ${task.dueDate})` : '';
  return `${task.title} (${recurrenceText})${dueDateText}`;
};

/**
 * Checks for recurring tasks with upcoming due dates.
 * @param tasks The array of RecurringTask objects.
 * @param daysThreshold The number of days before a due date to trigger a reminder (default 7 days).
 * @returns An array of RecurringTask objects that are due soon AND are NOT completed.
 */
export const getUpcomingDueDates = (tasks: RecurringTask[], daysThreshold: number = 7): RecurringTask[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const upcomingTasks: RecurringTask[] = [];

  tasks.forEach(task => {
    // Only consider incomplete tasks for reminders
    if (task.completed) return; // Skip completed tasks

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0); // Normalize to start of day

      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // If the task is due today or in the future, and within the threshold
      // Or if it's past due but hasn't been "executed" recently (e.g., lastExecutionDate is before dueDate)
      if (daysDiff >= 0 && daysDiff <= daysThreshold) {
        upcomingTasks.push(task);
      } else if (daysDiff < 0) { // Task is past due
        const lastExecutionDate = task.lastExecutionDate ? new Date(task.lastExecutionDate) : null;
        if (!lastExecutionDate || lastExecutionDate.getTime() < dueDate.getTime()) {
          // If past due and not marked as executed after its due date
          upcomingTasks.push(task);
        }
      }
    }
  });

  return upcomingTasks;
};

/**
 * Sorts an array of RecurringTask objects based on the specified criterion.
 * @param tasks The array of RecurringTask objects to sort.
 * @param criterion The sorting criterion.
 * @returns A new array with sorted RecurringTask objects.
 */
export const sortRecurringTasks = (tasks: RecurringTask[], criterion: SortCriterion): RecurringTask[] => {
  return [...tasks].sort((a, b) => {
    switch (criterion) {
      case SortCriterion.CreationDate:
        // Assuming 'id' is a timestamp string
        return parseInt(a.id) - parseInt(b.id);
      case SortCriterion.DueDate:
        // Tasks without due dates go to the end
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case SortCriterion.Title:
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      case SortCriterion.LastExecutionDate:
        if (!a.lastExecutionDate && !b.lastExecutionDate) return 0;
        if (!a.lastExecutionDate) return 1;
        if (!b.lastExecutionDate) return -1;
        return new Date(a.lastExecutionDate).getTime() - new Date(b.lastExecutionDate).getTime();
      case SortCriterion.CompletionStatus:
        // Incomplete tasks first (false comes before true)
        return (a.completed === b.completed) ? 0 : (a.completed ? 1 : -1);
      default:
        return 0;
    }
  });
};