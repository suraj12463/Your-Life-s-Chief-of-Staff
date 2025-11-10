// components/EditRecurringTaskDialog.tsx
import React, { useState, useEffect } from 'react';
import { RecurringTask, RecurrenceType } from '../types';

interface EditRecurringTaskDialogProps {
  task: RecurringTask;
  onSave: (updatedTask: RecurringTask) => void;
  onCancel: () => void;
}

const EditRecurringTaskDialog: React.FC<EditRecurringTaskDialogProps> = ({ task, onSave, onCancel }) => {
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedRecurrence, setEditedRecurrence] = useState<RecurrenceType>(task.recurrence);
  const [editedDueDate, setEditedDueDate] = useState<string>(task.dueDate || '');
  const [editedCompleted, setEditedCompleted] = useState<boolean>(task.completed); // New state for completed status

  // Reset state if the task prop changes (e.g., editing a different task)
  useEffect(() => {
    setEditedTitle(task.title);
    setEditedRecurrence(task.recurrence);
    setEditedDueDate(task.dueDate || '');
    setEditedCompleted(task.completed); // Reset completed status
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTask: RecurringTask = {
      ...task,
      title: editedTitle,
      recurrence: editedRecurrence,
      dueDate: editedDueDate || undefined, // Set to undefined if empty string
      completed: editedCompleted, // Include completed status
    };
    onSave(updatedTask);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Recurring Task</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="editTitle" className="block text-gray-700 text-sm font-bold mb-2">
              Title:
            </label>
            <input
              type="text"
              id="editTitle"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="editRecurrence" className="block text-gray-700 text-sm font-bold mb-2">
              Repeats:
            </label>
            <select
              id="editRecurrence"
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editedRecurrence}
              onChange={(e) => setEditedRecurrence(e.target.value as RecurrenceType)}
              required
            >
              <option value={RecurrenceType.Daily}>Daily</option>
              <option value={RecurrenceType.Weekly}>Weekly</option>
              <option value={RecurrenceType.Monthly}>Monthly</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="editDueDate" className="block text-gray-700 text-sm font-bold mb-2">
              Due Date (optional):
            </label>
            <input
              type="date"
              id="editDueDate"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editedDueDate}
              onChange={(e) => setEditedDueDate(e.target.value)}
            />
          </div>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="editCompleted"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
              checked={editedCompleted}
              onChange={(e) => setEditedCompleted(e.target.checked)}
            />
            <label htmlFor="editCompleted" className="text-gray-700 text-sm font-bold">
              Mark as Completed
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecurringTaskDialog;