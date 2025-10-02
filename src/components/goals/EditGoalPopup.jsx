import React, { useState, useEffect } from 'react';
import { Button, Input } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import ConsistentPopup from '../ui/ConsistentPopup.jsx';

const EditGoalPopup = ({ isOpen, onClose, onGoalUpdated, goal }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    targetHours: '1',
    priority: 'medium',
    color: '#10B981',
    isActive: true
  });

  // Update form data when goal prop changes
  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name || '',
        description: goal.description || '',
        category: goal.category || 'other',
        targetHours: goal.targetHours?.toString() || '1',
        priority: goal.priority || 'medium',
        color: goal.color || '#10B981',
        isActive: goal.isActive !== false
      });
    }
  }, [goal]);

  const categoryOptions = [
    { value: 'sleep', label: 'Sleep' },
    { value: 'partner', label: 'Partner' },
    { value: 'reading', label: 'Reading' },
    { value: 'deep-work', label: 'Deep Work' },
    { value: 'health', label: 'Health' },
    { value: 'mindfulness', label: 'Mindfulness' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'learning', label: 'Learning' },
    { value: 'social', label: 'Social' },
    { value: 'other', label: 'Other' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  const colorOptions = [
    { value: '#10B981', label: 'Emerald' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#EF4444', label: 'Red' },
    { value: '#06B6D4', label: 'Cyan' }
  ];

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
      console.log('🎯 Attempting to update goal:', formData);
      console.log('🎯 Goal ID:', goal?._id);
      
      const requestBody = {
        ...formData,
        targetHours: parseInt(formData.targetHours) || 1
      };
      
      console.log('🎯 Request body:', requestBody);
      
      const response = await fetch(buildApiUrl(`/api/goals/${goal._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🎯 Response status:', response.status);
      console.log('🎯 Response ok:', response.ok);

      if (response.ok) {
        const updatedGoal = await response.json();
        console.log('✅ Goal updated successfully:', updatedGoal);
        onGoalUpdated(updatedGoal);
        onClose();
      } else {
        const error = await response.json();
        console.error('❌ Goal update failed:', error);
        alert(`Error updating goal: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Error updating goal:', error);
      console.error('❌ Error details:', error.message);
      alert('Error updating goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!goal) return null;

  return (
    <ConsistentPopup
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Goal"
      maxWidth="md"
      showReasonStrip={true}
      reasonStripColor="from-accent-purple to-accent-blue"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Name */}
        <div>
          <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
            Goal Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your goal name..."
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your goal..."
            rows={3}
            className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-green focus:border-accent-green placeholder:text-text-secondary"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-green focus:border-accent-green"
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Target Hours */}
        <div>
          <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
            Target Hours per Day
          </label>
          <Input
            type="number"
            min="0.5"
            step="0.5"
            value={formData.targetHours}
            onChange={(e) => handleInputChange('targetHours', e.target.value)}
            placeholder="1"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-green focus:border-accent-green"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
            Color
          </label>
          <div className="grid grid-cols-3 gap-2">
            {colorOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange('color', option.value)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.color === option.value
                    ? 'border-accent-green ring-2 ring-accent-green/20'
                    : 'border-border-primary hover:border-accent-green/50'
                }`}
                style={{ backgroundColor: option.value }}
              >
                <span className="text-white text-xs font-medium">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            className="w-4 h-4 text-accent-green bg-background-secondary border-border-primary rounded focus:ring-accent-green focus:ring-2"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-[#E8EEF2]">
            Active Goal
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Goal'}
          </Button>
        </div>
      </form>
    </ConsistentPopup>
  );
};

export default EditGoalPopup;
