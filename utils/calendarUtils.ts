// utils/calendarUtils.ts
import { CalendarEvent } from '../types';

const LOCAL_STORAGE_KEY = 'ava_calendar_events';

/**
 * Saves an array of calendar events to localStorage.
 * @param events The array of CalendarEvent objects to save.
 */
export const saveEventsToLocalStorage = (events: CalendarEvent[]): void => {
  try {
    const serializedEvents = JSON.stringify(events);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedEvents);
  } catch (error) {
    console.error("Error saving calendar events to localStorage:", error);
  }
};

/**
 * Loads calendar events from localStorage.
 * @returns An array of CalendarEvent objects, or an empty array if none are found or an error occurs.
 */
export const loadEventsFromLocalStorage = (): CalendarEvent[] => {
  try {
    const serializedEvents = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedEvents === null) {
      return [];
    }
    // Filter out past events during loading to keep the view clean
    const parsedEvents: CalendarEvent[] = JSON.parse(serializedEvents);
    const now = new Date();
    return parsedEvents
      .filter(event => {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        return eventDateTime >= now;
      })
      .sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
        const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
        return dateTimeA - dateTimeB;
      });
  } catch (error) {
    console.error("Error loading calendar events from localStorage:", error);
    return [];
  }
};

/**
 * Formats a date and time string for display.
 * @param date YYYY-MM-DD
 * @param time HH:MM
 * @returns A user-friendly formatted date and time string.
 */
export const formatEventDateTime = (date: string, time: string): string => {
  try {
    const eventDate = new Date(`${date}T${time}`);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return eventDate.toLocaleString(undefined, options);
  } catch (error) {
    console.error("Error formatting date/time:", error);
    return `${date} ${time}`;
  }
};
