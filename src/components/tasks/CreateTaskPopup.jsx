import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import { componentStyles } from '../../styles/designTokens';
import ConsistentPopup from '../ui/ConsistentPopup.jsx';

const CreateTaskPopup = ({ isOpen, onClose, onTaskCreated, goalId, goalName }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    estimatedDuration: '30'
  });

  // Debug logging
  console.log('CreateTaskPopup props:', { isOpen, goalId, goalName, token: !!token });
  console.log('Token value:', token ? token.substring(0, 20) + '...' : 'No token');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const taskData = {
      ...formData,
      goalIds: goalId ? [goalId] : [],
      estimatedDuration: parseInt(formData.estimatedDuration) || 30,
      // Auto-complete tasks created in Goal Aligned Day
      status: 'completed',
      completedAt: new Date().toISOString(),
      actualDuration: parseInt(formData.estimatedDuration) || 30
    };

    console.log('Creating task with data:', taskData);
    console.log('API URL:', buildApiUrl('/api/tasks'));

    try {
      const response = await fetch(buildApiUrl('/api/tasks'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      console.log('Task creation response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Task created successfully:', data);
        onTaskCreated(data.task);
        onClose();
        // Reset form
        setFormData({
          title: '',
          estimatedDuration: '30'
        });
      } else {
        const error = await response.json();
        console.error('Task creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: error
        });
        alert(`Error creating task: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ConsistentPopup
      isOpen={isOpen}
      onClose={onClose}
      title="ADD TASK"
      maxWidth="md"
    >
      {goalName && (
        <p className="text-sm text-text-secondary mb-4 font-jakarta">for goal: {goalName}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Title */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta tracking-wider">
            TASK TITLE *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter task title..."
            required
            className={componentStyles.input.base}
          />
        </div>

        {/* Estimated Duration */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta tracking-wider">
            DURATION (MINUTES)
          </label>
          <input
            type="number"
            min="5"
            step="5"
            value={formData.estimatedDuration}
            onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
            placeholder="30"
            className={componentStyles.input.base}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className={componentStyles.button.outline + " flex-1"}
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title}
            className={componentStyles.button.primary + " flex-1"}
          >
            {loading ? 'CREATING...' : 'ADD & COMPLETE TASK'}
          </button>
        </div>
      </form>
    </ConsistentPopup>
  );
};

export default CreateTaskPopup;
