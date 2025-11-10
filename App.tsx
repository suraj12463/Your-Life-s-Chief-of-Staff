// App.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { generateContent, createCalendarEventFunctionDeclaration, createRecurringTaskFunctionDeclaration, payBillFunctionDeclaration, createGoalFunctionDeclaration } from './services/geminiService';
import { Message, MessageRole, CalendarEvent, RecurringTask, RecurrenceType, SortCriterion, PaymentDetail, Goal, GoalStatus, GoalFilter } from './types'; // Added PaymentDetail, Goal, GoalStatus, GoalFilter
import ChatBubble from './components/ChatBubble';
import { saveEventsToLocalStorage, loadEventsFromLocalStorage, formatEventDateTime } from './utils/calendarUtils';
import { saveRecurringTasksToLocalStorage, loadRecurringTasksFromLocalStorage, formatRecurringTask, getUpcomingDueDates, sortRecurringTasks } from './utils/taskUtils';
import { savePaymentHistoryToLocalStorage, loadPaymentHistoryFromLocalStorage, formatPaymentDetail, formatCurrency } from './utils/paymentUtils'; // New payment utilities
import { saveGoalsToLocalStorage, loadGoalsFromLocalStorage, getUpcomingGoalReminders } from './utils/goalUtils'; // New goal utilities
import CalendarView from './components/CalendarView';
import RecurringTaskView from './components/RecurringTaskView';
import PaymentHistoryView from './components/PaymentHistoryView'; // New PaymentHistoryView component
import GoalView from './components/GoalView'; // New GoalView component
import ConfirmationDialog from './components/ConfirmationDialog';
import EditRecurringTaskDialog from './components/EditRecurringTaskDialog';

declare global { // To avoid TypeScript errors for window.SpeechRecognition and event types
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  // Added global declarations for SpeechRecognition event types
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
  }

  type SpeechRecognitionErrorCode =
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported';
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentDetail[]>([]); // New state for payment history
  const [goals, setGoals] = useState<Goal[]>([]); // New state for goals
  const [isListening, setIsListening] = useState(false);

  // State for confirmation dialog
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [pendingActionDetails, setPendingActionDetails] = useState<CalendarEvent | RecurringTask | PaymentDetail | Goal | null>(null); // Can be event, task, payment, or goal
  const [pendingActionType, setPendingActionType] = useState<'event' | 'task' | 'payment' | 'goal' | 'confirmTaskCompletion' | null>(null); // To differentiate action type, added 'confirmTaskCompletion'
  const [pendingFunctionCall, setPendingFunctionCall] = useState<any>(null); // Can be null for UI-initiated actions

  // State for editing recurring tasks
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null);
  // State for sorting recurring tasks
  const [sortCriterion, setSortCriterion] = useState<SortCriterion>(SortCriterion.CreationDate);
  // State for filtering goals
  const [goalFilter, setGoalFilter] = useState<GoalFilter>(GoalFilter.All); // New state for goal filtering

  // Using useRef for chat session to maintain a single instance across renders
  const chatSessionRef = useRef<Chat | null>(null);
  const recognitionRef = useRef<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session on component mount
  useEffect(() => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY is not defined. Please ensure it's configured.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `You are Ava, an AI Concierge and personal Chief of Staff. Your role is to automate administrative burdens, manage tasks, schedule, and assist with recurring personal and professional chores.
      
          You can create calendar events. When a user asks you to schedule a meeting or appointment, use the 'createCalendarEvent' tool. Be sure to extract the event title, date (in YYYY-MM-DD format), and time (in HH:MM 24-hour format) accurately from the user's request.
          
          You can also create recurring tasks. When a user asks you to set up a recurring task or reminder, use the 'createRecurringTask' tool. Be sure to extract the task title, the recurrence pattern (daily, weekly, or monthly), and any optional due date (in YYYY-MM-DD format) accurately.

          You can also pay bills. When a user asks you to pay a bill, use the 'payBill' tool. Be sure to extract the biller name, the amount (as a number), and the due date (in YYYY-MM-DD format) accurately from the user's request.

          You can also define goals. When a user asks you to set a personal or professional goal, use the 'createGoal' tool. Be sure to extract the goal's title, optional description, and target date (in YYYY-MM-DD format) accurately.
          
          Your responses should be concise and focus on facilitating task execution.`,
          tools: [{ functionDeclarations: [createCalendarEventFunctionDeclaration, createRecurringTaskFunctionDeclaration, payBillFunctionDeclaration, createGoalFunctionDeclaration] }],
        },
      });
    } catch (e) {
      console.error("Failed to initialize Gemini client or chat session:", e);
      setError("Failed to initialize AI. Please check your API Key configuration.");
    }

    // Load data from localStorage
    setCalendarEvents(loadEventsFromLocalStorage());
    setRecurringTasks(loadRecurringTasksFromLocalStorage());
    setPaymentHistory(loadPaymentHistoryFromLocalStorage()); // Load payment history
    setGoals(loadGoalsFromLocalStorage()); // Load goals

    // Initial welcome message from Ava
    setMessages([
      {
        role: MessageRole.AI,
        content: `Hello! I'm Ava, your personal AI Concierge. How can I assist you with your administrative tasks today?`,
      },
    ]);
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Effect for SpeechRecognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not supported in this browser.");
      recognitionRef.current = null;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setError(`Speech recognition error: ${event.error}. Please ensure microphone access and try again.`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);


  // Scroll to the bottom of the chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save data to localStorage whenever states change
  useEffect(() => {
    saveEventsToLocalStorage(calendarEvents);
  }, [calendarEvents]);

  useEffect(() => {
    saveRecurringTasksToLocalStorage(recurringTasks);
  }, [recurringTasks]);

  useEffect(() => {
    savePaymentHistoryToLocalStorage(paymentHistory); // Save payment history
  }, [paymentHistory]);

  useEffect(() => {
    saveGoalsToLocalStorage(goals); // Save goals
  }, [goals]);


  // Check for upcoming recurring task due dates
  useEffect(() => {
    if (recurringTasks.length === 0) return;

    const checkAndPostReminders = () => {
      const upcoming = getUpcomingDueDates(recurringTasks);
      if (upcoming.length > 0) {
        const reminderMessages = upcoming.map(task => 
          `Reminder: Your recurring task "${task.title}" is due on ${task.dueDate}!`
        );
        const newReminders = reminderMessages.filter(msg => 
          !messages.some(m => m.content === msg)
        );
        if (newReminders.length > 0) {
          setMessages(prevMessages => [...prevMessages, ...newReminders.map(content => ({ role: MessageRole.AI, content }))]);
        }
      }
    };

    checkAndPostReminders(); // Initial check
    const reminderInterval = setInterval(checkAndPostReminders, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(reminderInterval);
  }, [recurringTasks, messages]);

  // Check for upcoming goal target dates
  useEffect(() => {
    if (goals.length === 0) return;

    const checkAndPostGoalReminders = () => {
      const upcomingGoalReminders = getUpcomingGoalReminders(goals);
      if (upcomingGoalReminders.length > 0) {
        const reminderMessages = upcomingGoalReminders.map(goal => 
          `Goal Reminder: Your goal "${goal.title}" is ${goal.status === GoalStatus.InProgress ? 'approaching its' : 'past its'} target date of ${goal.targetDate}!`
        );
        const newReminders = reminderMessages.filter(msg => 
          !messages.some(m => m.content === msg)
        );
        if (newReminders.length > 0) {
          setMessages(prevMessages => [...prevMessages, ...newReminders.map(content => ({ role: MessageRole.AI, content }))]);
        }
      }
    };

    checkAndPostGoalReminders(); // Initial check
    const goalReminderInterval = setInterval(checkAndPostGoalReminders, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(goalReminderInterval);
  }, [goals, messages]);


  const handleConfirm = useCallback(async () => {
    if (!pendingActionDetails || !pendingActionType) return;

    setShowConfirmationDialog(false);
    setLoading(true);

    let resultMessage = '';
    let aiResponseNeeded = false; // Flag to indicate if AI needs a functionResponse
    let functionResponseResult = '';

    if (pendingActionType === 'event') {
      const { title, date, time } = pendingActionDetails as CalendarEvent;
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: title,
        date: date,
        time: time,
      };
      setCalendarEvents((prevEvents) => [...prevEvents, newEvent]);
      resultMessage = `Calendar event "${title}" for ${formatEventDateTime(date, time)} successfully created.`;
      functionResponseResult = resultMessage;
      aiResponseNeeded = true;
    } else if (pendingActionType === 'task') {
      const { title, recurrence, dueDate } = pendingActionDetails as RecurringTask;
      const newTask: RecurringTask = {
        id: Date.now().toString(),
        title: title,
        recurrence: recurrence,
        lastExecutionDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate,
        completed: false,
      };
      setRecurringTasks((prevTasks) => [...prevTasks, newTask]);
      resultMessage = `Recurring task "${title}" (${recurrence})${dueDate ? ` with due date ${dueDate}` : ''} successfully created.`;
      functionResponseResult = resultMessage;
      aiResponseNeeded = true;
    } else if (pendingActionType === 'payment') { // Handle payment confirmation
      const { biller, amount, dueDate } = pendingActionDetails as PaymentDetail;
      const newPayment: PaymentDetail = {
        id: Date.now().toString(),
        biller: biller,
        amount: amount,
        dueDate: dueDate,
        paymentDate: new Date().toISOString().split('T')[0], // Today's date
      };
      setPaymentHistory((prevPayments) => [...prevPayments, newPayment]);
      resultMessage = `Payment of ${formatCurrency(amount)} to ${biller} (due ${dueDate}) has been initiated.`;
      functionResponseResult = resultMessage;
      aiResponseNeeded = true;
    } else if (pendingActionType === 'goal') { // Handle goal confirmation
      const { title, description, targetDate } = pendingActionDetails as Goal;
      const newGoal: Goal = {
        id: Date.now().toString(),
        title: title,
        description: description,
        targetDate: targetDate,
        progress: 0, // Goals start at 0% progress
        status: GoalStatus.NotStarted, // Default status
        creationDate: new Date().toISOString().split('T')[0], // Set creation date
      };
      setGoals((prevGoals) => [...prevGoals, newGoal]);
      resultMessage = `Goal "${title}" targeting ${targetDate} successfully created.`;
      functionResponseResult = resultMessage;
      aiResponseNeeded = true;
    } else if (pendingActionType === 'confirmTaskCompletion') { // Handle UI-initiated task completion
      const toggledTask = pendingActionDetails as RecurringTask;
      setRecurringTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === toggledTask.id ? { ...task, completed: toggledTask.completed } : task
        )
      );
      resultMessage = `Task "${toggledTask.title}" marked as ${toggledTask.completed ? 'completed' : 'not completed'}.`;
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: MessageRole.AI, content: resultMessage },
      ]);
      aiResponseNeeded = false; // No AI function response needed for this UI action
    }
    
    if (aiResponseNeeded && pendingFunctionCall && chatSessionRef.current) {
      // Send function response back to the model to continue the conversation
      try {
        const response = await chatSessionRef.current.sendMessage({
          message: [
            {
              functionResponse: {
                id: pendingFunctionCall.id,
                name: pendingFunctionCall.name,
                response: { result: functionResponseResult },
              },
            },
          ],
        });
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: MessageRole.AI, content: response.text || resultMessage },
        ]);
      } catch (e) {
        console.error("Error sending function response to AI:", e);
        setError("Failed to communicate action result to AI.");
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: MessageRole.AI, content: resultMessage + " (Error: Failed to get AI's follow-up message)" },
        ]);
      }
    }

    setPendingActionDetails(null);
    setPendingFunctionCall(null);
    setPendingActionType(null);
    setLoading(false);
  }, [pendingActionDetails, pendingFunctionCall, pendingActionType, calendarEvents, recurringTasks, paymentHistory, goals, messages]); // Added messages as a dependency to prevent stale closures

  const handleCancel = useCallback(() => {
    setShowConfirmationDialog(false);
    setPendingActionDetails(null);
    setPendingFunctionCall(null);
    setPendingActionType(null);
    setLoading(true); // Still loading while sending cancellation to AI

    if (pendingActionType !== 'confirmTaskCompletion' && chatSessionRef.current && pendingFunctionCall) {
      chatSessionRef.current.sendMessage({
        message: [
          {
            functionResponse: {
              id: pendingFunctionCall.id,
              name: pendingFunctionCall.name,
              response: { result: 'User cancelled the action.' },
            },
          },
        ],
      }).then((response) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: MessageRole.AI, content: response.text || "Action cancelled." },
        ]);
      }).catch((e) => {
        console.error("Error sending cancellation response to AI:", e);
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: MessageRole.AI, content: "Action cancelled (Error: Failed to get AI's follow-up message)" },
        ]);
      }).finally(() => {
        setLoading(false);
      });
    } else { // For UI-initiated actions like task completion, just cancel and stop loading
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: MessageRole.AI, content: "Action cancelled." },
      ]);
      setLoading(false);
    }
  }, [pendingFunctionCall, pendingActionType]);


  const getConfirmationMessage = useCallback(() => {
    if (!pendingActionDetails || !pendingActionType) return "Are you sure?";

    if (pendingActionType === 'event') {
      const event = pendingActionDetails as CalendarEvent;
      return `Schedule event "${event.title}" for ${formatEventDateTime(event.date, event.time)}?`;
    } else if (pendingActionType === 'task') {
      const task = pendingActionDetails as RecurringTask;
      return `Create recurring task "${task.title}" to repeat ${task.recurrence}${task.dueDate ? ` with due date ${task.dueDate}` : ''}?`;
    } else if (pendingActionType === 'payment') {
      const payment = pendingActionDetails as PaymentDetail;
      return `Initiate payment of ${formatCurrency(payment.amount)} to ${payment.biller} with due date ${payment.dueDate}?`;
    } else if (pendingActionType === 'goal') {
      const goal = pendingActionDetails as Goal;
      return `Set goal: "${goal.title}"${goal.description ? ` ('${goal.description}')` : ''} with target date ${goal.targetDate}?`;
    } else if (pendingActionType === 'confirmTaskCompletion') {
      const task = pendingActionDetails as RecurringTask;
      return `Are you sure you want to mark "${task.title}" as ${task.completed ? 'completed' : 'not completed'}?`;
    }
    return "Are you sure?";
  }, [pendingActionDetails, pendingActionType]);


  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    setError(null);
    const newMessage: Message = { role: MessageRole.User, content: text };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput('');
    setLoading(true);

    try {
      let response: GenerateContentResponse;
      if (chatSessionRef.current) {
        response = await generateContent(text, chatSessionRef.current);
      } else {
        response = await generateContent(text); // Fallback if chat session isn't ready
      }

      if (response.functionCalls && response.functionCalls.length > 0) {
        const fc = response.functionCalls[0]; // Assuming one function call at a time for simplicity

        if (fc.name === createCalendarEventFunctionDeclaration.name) {
          const { title, date, time } = fc.args as { title: string; date: string; time: string };
          setPendingActionDetails({
            id: '', // Temp ID, real ID generated on confirm
            title: title,
            date: date,
            time: time,
          });
          setPendingActionType('event');
          setPendingFunctionCall(fc);
          setShowConfirmationDialog(true);
        } else if (fc.name === createRecurringTaskFunctionDeclaration.name) {
          const { title, recurrence, dueDate } = fc.args as { title: string; recurrence: RecurrenceType; dueDate?: string };
          setPendingActionDetails({
            id: '', // Temp ID
            title: title,
            recurrence: recurrence,
            lastExecutionDate: '', // Temp date
            dueDate: dueDate,
            completed: false,
          });
          setPendingActionType('task');
          setPendingFunctionCall(fc);
          setShowConfirmationDialog(true);
        } else if (fc.name === payBillFunctionDeclaration.name) { // Handle payBill function call
          const { biller, amount, dueDate } = fc.args as { biller: string; amount: number; dueDate: string };
          setPendingActionDetails({
            id: '', // Temp ID
            biller: biller,
            amount: amount,
            dueDate: dueDate,
            paymentDate: '', // Temp date
          });
          setPendingActionType('payment');
          setPendingFunctionCall(fc);
          setShowConfirmationDialog(true);
        } else if (fc.name === createGoalFunctionDeclaration.name) { // Handle goal creation
          const { title, description, targetDate } = fc.args as { title: string; description?: string; targetDate: string };
          setPendingActionDetails({
            id: '', // Temp ID, real ID generated on confirm
            title: title,
            description: description,
            targetDate: targetDate,
            progress: 0,
            status: GoalStatus.NotStarted,
            creationDate: '', // Temp, real date generated on confirm
          });
          setPendingActionType('goal');
          setPendingFunctionCall(fc);
          setShowConfirmationDialog(true);
        } else {
          // If a function call is not explicitly handled, respond with a generic message
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: MessageRole.AI, content: `I received a request to perform "${fc.name}", but I'm not configured to directly execute it without confirmation yet.` },
          ]);
          setLoading(false);
        }
      } else {
        // Handle regular text response
        const aiContent = response.text || "I couldn't generate a text response.";
        const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          uri: chunk.web?.uri || chunk.maps?.uri || '#', // Use maps uri if available
          title: chunk.web?.title || chunk.maps?.title || 'Source',
        })) || [];

        setMessages((prevMessages) => [...prevMessages, { role: MessageRole.AI, content: aiContent, groundingSources }]);
        setLoading(false);
      }
    } catch (e: any) {
      console.error("Error sending message:", e);
      setError(e.message || "Failed to get a response from AI.");
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: MessageRole.AI, content: `I'm sorry, I encountered an error: ${e.message}.` },
      ]);
      setLoading(false);
    }
  }, [loading, messages, calendarEvents, recurringTasks, paymentHistory, goals]); // Added all dependencies

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage(input);
    }
  };

  const handleVoiceInputToggle = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported or initialized.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setError(null); // Clear previous errors when starting to listen
    }
  };

  const handleEditTask = useCallback((task: RecurringTask) => {
    setEditingTask(task);
  }, []);

  const handleSaveEditedTask = useCallback((updatedTask: RecurringTask) => {
    setRecurringTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
    setEditingTask(null);
  }, []);

  const handleCancelEditTask = useCallback(() => {
    setEditingTask(null);
  }, []);

  const handleToggleTaskCompletion = useCallback((taskId: string, currentCompletedStatus: boolean) => {
    const taskToToggle = recurringTasks.find(task => task.id === taskId);
    if (taskToToggle) {
      setPendingActionDetails({ ...taskToToggle, completed: !currentCompletedStatus }); // Simulate the toggled state
      setPendingActionType('confirmTaskCompletion');
      // No actual AI function call, but we set a dummy pendingFunctionCall for the dialog flow
      setPendingFunctionCall({
        id: `toggle-${taskId}`,
        name: 'toggleTaskCompletion',
        args: { taskId: taskId, newStatus: !currentCompletedStatus }
      });
      setShowConfirmationDialog(true);
    }
  }, [recurringTasks]);

  const handleSortChange = useCallback((criterion: SortCriterion) => {
    setSortCriterion(criterion);
  }, []);

  const sortedRecurringTasks = useMemo(() => {
    return sortRecurringTasks(recurringTasks, sortCriterion);
  }, [recurringTasks, sortCriterion]);

  const handleUpdateGoalStatus = useCallback((goalId: string, newStatus: GoalStatus) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => (goal.id === goalId ? { ...goal, status: newStatus } : goal))
    );
  }, []);

  const handleGoalFilterChange = useCallback((filter: GoalFilter) => {
    setGoalFilter(filter);
  }, []);

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      switch (goalFilter) {
        case GoalFilter.All:
          return true;
        case GoalFilter.Active:
          return (
            goal.status === GoalStatus.NotStarted ||
            goal.status === GoalStatus.InProgress ||
            goal.status === GoalStatus.OnHold
          );
        case GoalFilter.Completed:
          return goal.status === GoalStatus.Completed;
        default:
          return true;
      }
    });
  }, [goals, goalFilter]);


  return (
    <div className="flex flex-col md:flex-row h-screen w-full max-w-7xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Left Sidebar for Utilities */}
      <div className="w-full md:w-1/3 bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
        <h1 className="text-2xl font-extrabold text-blue-700 mb-6">Ava: AI Concierge</h1>
        
        {/* Calendar View */}
        <div className="mb-8 h-1/3 flex flex-col">
          <CalendarView events={calendarEvents} />
        </div>

        {/* Recurring Tasks View */}
        <div className="mb-8 h-1/3 flex flex-col mt-6">
          <RecurringTaskView
            tasks={sortedRecurringTasks}
            onEditTask={handleEditTask}
            onToggleComplete={handleToggleTaskCompletion}
            onSortChange={handleSortChange}
            currentSortCriterion={sortCriterion}
          />
        </div>

        {/* Payment History View */}
        <div className="mb-8 h-1/3 flex flex-col">
          <PaymentHistoryView payments={paymentHistory} />
        </div>

        {/* Goals View */}
        <div className="mb-8 h-1/3 flex flex-col">
          <GoalView
            goals={filteredGoals}
            onUpdateGoalStatus={handleUpdateGoalStatus}
            currentGoalFilter={goalFilter}
            onGoalFilterChange={handleGoalFilterChange}
          />
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-white">
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <h2 className="text-xl font-semibold">Chat with Ava</h2>
        </header>

        <main className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg, index) => (
            <ChatBubble key={index} role={msg.role} content={msg.content} groundingSources={msg.groundingSources} />
          ))}
          {loading && (
            <div className="self-start bg-gray-200 text-gray-800 p-3 my-1 rounded-xl rounded-bl-none shadow animate-pulse">
              <p className="text-sm md:text-base">Ava is thinking...</p>
            </div>
          )}
          {error && (
            <div className="self-start bg-red-100 text-red-800 p-3 my-1 rounded-xl rounded-bl-none shadow">
              <p className="text-sm md:text-base">Error: {error}</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </main>

        <footer className="p-4 border-t border-gray-200 bg-white flex items-center">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Type your message..."}
            className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            disabled={loading || showConfirmationDialog}
            aria-label="Chat input"
          />
          <button
            onClick={handleVoiceInputToggle}
            className={`p-3 border-t border-b border-gray-300 ${
              isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            disabled={loading || showConfirmationDialog}
          >
            {isListening ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 11-14 0v-1a1 1 0 012 0v1a5 5 0 0010 0v-1a1 1 0 012 0v1z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 18H5a1 1 0 01-1-1v-4a1 1 0 011-1h5m0 6v-6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 18h5a1 1 0 001-1v-4a1 1 0 00-1-1h-5m0 6v-6" />
              </svg>
            )}
          </button>
          <button
            onClick={() => sendMessage(input)}
            className="p-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || !input.trim() || showConfirmationDialog}
            aria-label="Send message"
          >
            Send
          </button>
        </footer>
      </div>

      {showConfirmationDialog && (
        <ConfirmationDialog
          title="Confirm Action"
          message={getConfirmationMessage()}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {editingTask && (
        <EditRecurringTaskDialog
          task={editingTask}
          onSave={handleSaveEditedTask}
          onCancel={handleCancelEditTask}
        />
      )}
    </div>
  );
};

export default App;