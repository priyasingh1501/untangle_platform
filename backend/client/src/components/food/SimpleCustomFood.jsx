import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Card, Button, Input } from '../ui';

const SimpleCustomFood = ({ isOpen, onClose, onFoodCreated, searchQuery = '' }) => {
  const [name, setName] = useState(searchQuery);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockFood = {
        _id: 'mock_' + Date.now(),
        name: name,
        source: 'CUSTOM',
        nutrients: {
          kcal: 100,
          protein: 10,
          fat: 5,
          carbs: 15
        }
      };
      
      if (onFoodCreated) {
        onFoodCreated(mockFood);
      }
      
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card variant="elevated" className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Create Custom Food</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Food Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter food name"
              required
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default SimpleCustomFood;
