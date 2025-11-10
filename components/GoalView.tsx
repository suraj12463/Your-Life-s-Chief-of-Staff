// components/GoalView.tsx
import React from 'react';
import { Goal, GoalStatus, GoalFilter } from '../types';
import { formatGoalDate } from '../utils/goalUtils';

interface GoalViewProps {
  goals: Goal[];
  onUpdateGoalStatus: (goalId: string, newStatus: GoalStatus) => void; // Prop for updating goal status
  currentGoalFilter: GoalFilter; // Current filter selected
  onGoalFilterChange: (filter: GoalFilter) => void; // Callback to change filter
}

const GoalView: React.FC<GoalViewProps> = ({ goals, onUpdateGoalStatus, currentGoalFilter, onGoalFilterChange }) => {
  const getProgressBarColor = (progress: number, status: GoalStatus) => {
    if (status === GoalStatus.Completed) return 'bg-green-500';
    if (status === GoalStatus.Cancelled || status === GoalStatus.OnHold) return 'bg-gray-400';
    if (progress >= 80) return 'bg-teal-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const getStatusText = (status: GoalStatus) => {
    switch (status) {
      case GoalStatus.NotStarted: return 'Not Started';
      case GoalStatus.InProgress: return 'In Progress';
      case GoalStatus.Completed: return 'Completed';
      case GoalStatus.OnHold: return 'On Hold';
      case GoalStatus.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex flex-col h-full mt-6">
      <div className="mb-4 border-b pb-2">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Your Goals</h2>
        <div className="flex items-center">
          <label htmlFor="goalFilter" className="text-sm text-gray-700 mr-2">Show:</label>
          <select
            id="goalFilter"
            className="p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentGoalFilter}
            onChange={(e) => onGoalFilterChange(e.target.value as GoalFilter)}
          >
            <option value={GoalFilter.All}>All Goals</option>
            <option value={GoalFilter.Active}>Active Goals</option>
            <option value={GoalFilter.Completed}>Completed Goals</option>
          </select>
        </div>
      </div>
      {goals.length === 0 ? (
        <p className="text-gray-600 text-sm">
          {currentGoalFilter === GoalFilter.Completed
            ? "No completed goals yet. Keep pushing!"
            : "No goals defined. Ask Ava to help you set one!"}
        </p>
      ) : (
        <ul className="space-y-3 overflow-y-auto flex-1">
          {goals.map((goal) => (
            <li key={goal.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 text-base">{goal.title}</h3>
              {goal.description && <p className="text-xs text-gray-600 italic mt-1">{goal.description}</p>}
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium mr-1">Target Date:</span>
                {formatGoalDate(goal.targetDate)}
              </p>
              <div className="mt-2 text-sm">
                <p className="text-gray-700">Progress: {goal.progress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div
                    className={`${getProgressBarColor(goal.progress, goal.status)} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${goal.progress}%` }}
                    role="progressbar"
                    aria-valuenow={goal.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500 mr-2">Status:</span>
                  <select
                    value={goal.status}
                    onChange={(e) => onUpdateGoalStatus(goal.id, e.target.value as GoalStatus)}
                    className="p-0.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label={`Change status of goal ${goal.title}`}
                  >
                    {Object.values(GoalStatus).map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {getStatusText(statusOption)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GoalView;