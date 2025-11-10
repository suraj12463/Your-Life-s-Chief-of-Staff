// components/CalendarView.tsx
import React from 'react';
import { CalendarEvent } from '../types';
import { formatEventDateTime } from '../utils/calendarUtils';

interface CalendarViewProps {
  events: CalendarEvent[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 border-b pb-2">Your Upcoming Events</h2>
      {events.length === 0 ? (
        <p className="text-gray-600 text-sm">No upcoming events scheduled. Ask Ava to book one for you!</p>
      ) : (
        <ul className="space-y-3 overflow-y-auto flex-1">
          {events.map((event) => (
            <li key={event.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 text-base">{event.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium mr-1">When:</span>
                {formatEventDateTime(event.date, event.time)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CalendarView;