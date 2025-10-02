import React, { useState, useEffect } from 'react';
import { Button, Input } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import { componentStyles } from '../../styles/designTokens';
import ConsistentPopup from '../ui/ConsistentPopup.jsx';

const CreateHabitPopup = ({ isOpen, onClose, onHabitCreated, goals = [], selectedGoal = null }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Debug logging
  if (isOpen) {
    console.log('🎯 CreateHabitPopup - isOpen:', isOpen);
  }
  
  const [formData, setFormData] = useState({
    habit: '',
    valueMin: '',
    notes: '',
    endDate: '',
    goalId: ''
  });

  // Update formData when selectedGoal changes
  useEffect(() => {
    if (selectedGoal) {
      setFormData(prev => ({
        ...prev,
        goalId: selectedGoal._id
      }));
    }
  }, [selectedGoal]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🎯 Attempting to create habit:', formData);
      
      // Validate required fields
      if (!formData.habit.trim()) {
        alert('Habit name is required');
        return;
      }
      
      // Set default end date to 30 days from now if not provided
      const endDate = formData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const requestBody = {
        habit: formData.habit.trim(),
        valueMin: parseInt(formData.valueMin) || 0,
        notes: formData.notes.trim(),
        endDate: endDate,
        quality: 'good',
        goalId: formData.goalId || null
      };
      
      console.log('🎯 Request body:', requestBody);
      console.log('🎯 Selected goal ID:', formData.goalId);
      console.log('🎯 Available goals:', goals);
      
      const response = await fetch(buildApiUrl('/api/habits'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🎯 Response status:', response.status);

      if (response.ok) {
        const newHabit = await response.json();
        console.log('✅ Habit created successfully:', newHabit);
        onHabitCreated(newHabit);
        onClose();
        // Reset form
        setFormData({
          habit: '',
          valueMin: '',
          notes: '',
          endDate: '',
          goalId: ''
        });
      } else {
        const error = await response.json();
        console.error('❌ Habit creation failed:', error);
        alert(`Error creating habit: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Error creating habit:', error);
      alert('Error creating habit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ConsistentPopup
      isOpen={isOpen}
      onClose={onClose}
      title="ADD HABIT"
      maxWidth="md"
    >
      {selectedGoal && (
        <p className="text-sm text-text-secondary mb-4 font-jakarta">for goal: {selectedGoal.name}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Habit Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta tracking-wider">
            HABIT NAME *
          </label>
          <input
            type="text"
            value={formData.habit}
            onChange={(e) => handleInputChange('habit', e.target.value)}
            placeholder="e.g., Morning Exercise"
            required
            className={componentStyles.input.base}
          />
        </div>

        {/* Goal Selection */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta tracking-wider">
            ASSOCIATED GOAL (OPTIONAL)
          </label>
          <select
            value={formData.goalId}
            onChange={(e) => handleInputChange('goalId', e.target.value)}
            className={componentStyles.input.base}
          >
            <option value="">Select a goal (optional)</option>
            {goals && goals.map((goal) => (
              <option key={goal._id} value={goal._id}>
                {goal.name}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta tracking-wider">
            DURATION (MINUTES) *
          </label>
          <input
            type="number"
            value={formData.valueMin}
            onChange={(e) => handleInputChange('valueMin', e.target.value)}
            placeholder="30"
            min="0"
            required
            className={componentStyles.input.base}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text sm font-medium text-text-secondary mb-2 font-jakarta tracking-wider">
            END DATE (OPTIONAL)
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={componentStyles.input.base}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta tracking-wider">
            NOTES (OPTIONAL)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Describe your habit goal..."
            className={componentStyles.input.base}
            rows={3}
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
            disabled={loading || !formData.habit || !formData.valueMin}
            className={componentStyles.button.primary + " flex-1"}
          >
            {loading ? 'CREATING...' : 'ADD HABIT'}
          </button>
        </div>
      </form>
    </ConsistentPopup>
  );
};

export default CreateHabitPopup;
