// services/geminiService.ts
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { FunctionDeclaration, Type, RecurrenceType } from '../types'; // Import from types.ts

/**
 * Initializes the GoogleGenAI client with the API key from environment variables.
 * Assumes process.env.API_KEY is pre-configured and accessible.
 */
let ai: GoogleGenAI | null = null; // Initialize lazily

function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY is not defined. Please ensure it's configured.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
}

/**
 * Function declaration for the AI to create a calendar event.
 */
export const createCalendarEventFunctionDeclaration: FunctionDeclaration = {
  name: 'createCalendarEvent',
  parameters: {
    type: Type.OBJECT,
    description: 'Creates a new calendar event with a title, date, and time.',
    properties: {
      title: {
        type: Type.STRING,
        description: 'The title or description of the event.',
      },
      date: {
        type: Type.STRING,
        description: 'The date of the event in YYYY-MM-DD format (e.g., 2024-12-31).',
      },
      time: {
        type: Type.STRING,
        description: 'The time of the event in HH:MM 24-hour format (e.g., 14:30 for 2:30 PM).',
      },
    },
    required: ['title', 'date', 'time'],
  },
};

/**
 * Function declaration for the AI to create a recurring task.
 */
export const createRecurringTaskFunctionDeclaration: FunctionDeclaration = {
  name: 'createRecurringTask',
  parameters: {
    type: Type.OBJECT,
    description: 'Creates a new recurring task with a title, a recurrence pattern (daily, weekly, or monthly), and an optional due date.',
    properties: {
      title: {
        type: Type.STRING,
        description: 'The title or description of the recurring task.',
      },
      recurrence: {
        type: Type.STRING,
        description: 'The recurrence pattern for the task: "daily", "weekly", or "monthly".',
        enum: Object.values(RecurrenceType),
      },
      dueDate: { // New optional parameter
        type: Type.STRING,
        description: 'Optional due date for the task in YYYY-MM-DD format (e.g., 2024-12-31).',
      },
    },
    required: ['title', 'recurrence'], // dueDate is optional
  },
};

/**
 * Function declaration for the AI to pay a bill.
 */
export const payBillFunctionDeclaration: FunctionDeclaration = {
  name: 'payBill',
  parameters: {
    type: Type.OBJECT,
    description: 'Initiates a bill payment to a specified biller for a given amount, with an optional due date.',
    properties: {
      biller: {
        type: Type.STRING,
        description: 'The name of the company or service provider to whom the bill is to be paid.',
      },
      amount: {
        type: Type.NUMBER,
        description: 'The amount of the bill to be paid, in USD.',
      },
      dueDate: {
        type: Type.STRING,
        description: 'The due date of the bill in YYYY-MM-DD format (e.g., 2024-12-31).',
      },
    },
    required: ['biller', 'amount'], // dueDate is optional but highly recommended for context
  },
};

/**
 * Function declaration for the AI to create a new goal.
 */
export const createGoalFunctionDeclaration: FunctionDeclaration = {
  name: 'createGoal',
  parameters: {
    type: Type.OBJECT,
    description: 'Defines a new personal or professional goal with a title, an optional description, and a target date.',
    properties: {
      title: {
        type: Type.STRING,
        description: 'The main title or short description of the goal.',
      },
      description: {
        type: Type.STRING,
        description: 'An optional detailed description of the goal.',
      },
      targetDate: {
        type: Type.STRING,
        description: 'The target completion date for the goal in YYYY-MM-DD format (e.g., 2025-06-30).',
      },
    },
    required: ['title', 'targetDate'],
  },
};


/**
 * Sends a text prompt to the Gemini model and returns the generated content or function calls.
 * @param prompt The user's input text.
 * @param chatSession Optional chat session for persistent context.
 * @returns A promise that resolves to the full `GenerateContentResponse` object.
 * @throws Error if the API call fails.
 */
export const generateContent = async (
  prompt: string,
  chatSession?: Chat, // Optional chat session for persistent context
): Promise<GenerateContentResponse> => {
  try {
    const aiClient = getGeminiClient();

    const config = {
      systemInstruction: `You are Ava, an AI Concierge and personal Chief of Staff. Your role is to automate administrative burdens, manage tasks, schedule, and assist with recurring personal and professional chores.
      
      You can create calendar events. When a user asks you to schedule a meeting or appointment, use the 'createCalendarEvent' tool. Be sure to extract the event title, date (in YYYY-MM-DD format), and time (in HH:MM 24-hour format) accurately from the user's request.
      
      You can also create recurring tasks. When a user asks you to set up a recurring task or reminder, use the 'createRecurringTask' tool. Be sure to extract the task title, the recurrence pattern (daily, weekly, or monthly), and any optional due date (in YYYY-MM-DD format) accurately.
      
      You can also pay bills. When a user asks you to pay a bill, use the 'payBill' tool. Be sure to extract the biller name, the amount (as a number), and the due date (in YYYY-MM-DD format) accurately from the user's request.

      You can also define goals. When a user asks you to set a personal or professional goal, use the 'createGoal' tool. Be sure to extract the goal's title, optional description, and target date (in YYYY-MM-DD format) accurately.
      
      Your responses should be concise and focus on facilitating task execution.`,
      tools: [{ functionDeclarations: [createCalendarEventFunctionDeclaration, createRecurringTaskFunctionDeclaration, payBillFunctionDeclaration, createGoalFunctionDeclaration] }],
    };

    let response: GenerateContentResponse;
    if (chatSession) {
      response = await chatSession.sendMessage({ message: prompt, config });
    } else {
      // Use direct generateContent for single-turn (or first-turn) with full config
      response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash', // Using gemini-2.5-flash for general text tasks
        contents: prompt,
        config,
      });
    }

    return response;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Failed to get response from AI: ${(error as Error).message || 'Unknown error'}`);
  }
};