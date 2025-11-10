// types.ts
import { FunctionDeclaration, Type } from '@google/genai'; // Added for function calling types

/**
 * Defines the role of a message sender in the chat.
 */
export enum MessageRole {
  User = 'user',
  AI = 'ai',
}

/**
 * Represents a single message in the chat conversation.
 */
export interface Message {
  role: MessageRole;
  content: string;
  // Optional property for displaying grounding sources like URLs if present
  groundingSources?: { uri: string; title: string }[];
}

/**
 * Represents a calendar event to be scheduled.
 */
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

/**
 * Defines the recurrence types for tasks.
 */
export enum RecurrenceType {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
}

/**
 * Defines the sorting criteria for recurring tasks.
 */
export enum SortCriterion {
  CreationDate = 'creationDate',
  DueDate = 'dueDate',
  Title = 'title',
  LastExecutionDate = 'lastExecutionDate',
  CompletionStatus = 'completionStatus',
}

/**
 * Represents a recurring task.
 */
export interface RecurringTask {
  id: string;
  title: string;
  recurrence: RecurrenceType;
  lastExecutionDate: string; // YYYY-MM-DD, to track when it was last "done" or reminded
  dueDate?: string; // YYYY-MM-DD, optional due date for the task
  completed: boolean; // New field to indicate if the task is completed
}

/**
 * Represents a bill payment.
 */
export interface PaymentDetail {
  id: string;
  biller: string;
  amount: number; // Stored as number for calculations, display with currency
  dueDate: string; // YYYY-MM-DD
  paymentDate: string; // YYYY-MM-DD, when the payment was initiated
}

/**
 * Defines the status of a goal.
 */
export enum GoalStatus {
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Completed = 'completed',
  OnHold = 'on-hold',
  Cancelled = 'cancelled',
}

/**
 * Defines filtering options for goals.
 */
export enum GoalFilter {
  All = 'all',
  Active = 'active', // Not Started, In Progress, On Hold
  Completed = 'completed',
}

/**
 * Represents a personal or professional goal.
 */
export interface Goal {
  id: string;
  title: string;
  description?: string; // Optional detailed description
  targetDate: string; // YYYY-MM-DD
  progress: number; // Percentage, 0-100
  status: GoalStatus;
  creationDate: string; // YYYY-MM-DD
}


export { FunctionDeclaration, Type };