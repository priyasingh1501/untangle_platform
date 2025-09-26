import React, { useState } from 'react';
import { Button, Input } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import ConsistentPopup from '../ui/ConsistentPopup.jsx';

const CreateGoalPopup = ({ isOpen, onClose, onGoalCreated }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    targetHours: '1',
    priority: 'medium',
    color: '#10B981'
  });

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
      console.log('🎯 Attempting to create goal:', formData);
      console.log('🎯 API URL:', buildApiUrl('/api/goals'));
      console.log('🎯 Token present:', !!token);
      
      const requestBody = {
        ...formData,
        targetHours: parseInt(formData.targetHours) || 1
      };
      
      console.log('🎯 Request body:', requestBody);
      
      const response = await fetch(buildApiUrl('/api/goals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🎯 Response status:', response.status);
      console.log('🎯 Response ok:', response.ok);

      if (response.ok) {
        const newGoal = await response.json();
        console.log('✅ Goal created successfully:', newGoal);
        onGoalCreated(newGoal);
        onClose();
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: 'other',
          targetHours: '1',
          priority: 'medium',
          color: '#10B981'
        });
      } else {
        const error = await response.json();
        console.error('❌ Goal creation failed:', error);
        alert(`Error creating goal: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Error creating goal:', error);
      console.error('❌ Error details:', error.message);
      alert('Error creating goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConsistentPopup
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Goal"
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
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Target Hours */}
        <div>
          <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
            Daily Target (hours)
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
            {priorityOptions.map((option) => (
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
          <div className="grid grid-cols-6 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => handleInputChange('color', color.value)}
                className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                  formData.color === color.value
                    ? 'border-[#0EA5E9] ring-2 ring-[#0EA5E9] ring-opacity-50'
                    : 'border-[#2A313A] hover:border-[#0EA5E9]'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name}
            className="flex-1"
          >
            {loading ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </ConsistentPopup>
  );
};

export default CreateGoalPopup;
