// components/RecurringTaskView.tsx
import React from 'react';
import { RecurringTask, SortCriterion } from '../types';
import { formatRecurringTask } from '../utils/taskUtils';

interface RecurringTaskViewProps {
  tasks: RecurringTask[];
  onEditTask: (task: RecurringTask) => void; // New prop for editing tasks
  // FIX: Update onToggleComplete signature to pass taskId and currentCompletedStatus
  onToggleComplete: (taskId: string, currentCompletedStatus: boolean) => void;
  onSortChange: (criterion: SortCriterion) => void; // New prop for sorting
  currentSortCriterion: SortCriterion; // New prop to indicate current sort
}

const RecurringTaskView: React.FC<RecurringTaskViewProps> = ({
  tasks,
  onEditTask,
  onToggleComplete,
  onSortChange,
  currentSortCriterion,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Your Recurring Tasks</h2>
        <div className="flex items-center">
          <label htmlFor="sortTasks" className="text-sm text-gray-700 mr-2">Sort by:</label>
          <select
            id="sortTasks"
            className="p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentSortCriterion}
            onChange={(e) => onSortChange(e.target.value as SortCriterion)}
          >
            <option value={SortCriterion.CreationDate}>Creation Date</option>
            <option value={SortCriterion.DueDate}>Due Date</option>
            <option value={SortCriterion.Title}>Title</option>
            <option value={SortCriterion.LastExecutionDate}>Last Updated</option>
            <option value={SortCriterion.CompletionStatus}>Completion Status</option>
          </select>
        </div>
      </div>
      {tasks.length === 0 ? (
        <p className="text-gray-600 text-sm">No recurring tasks set. Ask Ava to create one for you!</p>
      ) : (
        <ul className="space-y-3 overflow-y-auto flex-1">
          {tasks.map((task) => (
            <li key={task.id} className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center ${task.completed ? 'opacity-70' : ''}`}>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={task.completed}
                  // FIX: Pass task.completed as the second argument
                  onChange={() => onToggleComplete(task.id, task.completed)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  aria-label={`Mark task ${task.title} as completed`}
                />
                <div>
                  <h3 className={`font-semibold text-gray-800 text-base ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</h3>
                  <p className={`text-sm text-gray-600 mt-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    <span className="font-medium mr-1">Repeats:</span>
                    {task.recurrence}
                  </p>
                  {task.dueDate && (
                    <p className={`text-sm text-gray-600 mt-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                      <span className="font-medium mr-1">Due:</span>
                      {task.dueDate}
                    </p>
                  )}
                  <p className={`text-xs text-gray-500 mt-1 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                    Last updated: {task.lastExecutionDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4"> {/* Container for buttons */}
                <button
                  // FIX: Pass task.completed as the second argument
                  onClick={() => onToggleComplete(task.id, task.completed)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 ${
                    task.completed
                      ? 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400'
                      : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400'
                  }`}
                  aria-label={task.completed ? `Mark task ${task.title} as undone` : `Mark task ${task.title} as done`}
                >
                  {task.completed ? 'Undo Done' : 'Mark Done'}
                </button>
                <button
                  onClick={() => onEditTask(task)}
                  className="px-3 py-1 bg-indigo-500 text-white text-sm rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  aria-label={`Edit task ${task.title}`}
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecurringTaskView;