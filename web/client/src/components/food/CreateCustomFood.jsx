import React, { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, Button, Input, Textarea } from '../ui';
import { buildApiUrl } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

const CreateCustomFood = ({ isOpen, onClose, onFoodCreated, searchQuery = '' }) => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: searchQuery,
    nutrients: {
      kcal: '',
      protein: '',
      fat: '',
      carbs: '',
      fiber: '',
      sugar: '',
      vitaminC: '',
      zinc: '',
      selenium: '',
      iron: '',
      omega3: ''
    },
    portionGramsDefault: 100,
    tags: '',
    gi: '',
    fodmap: 'Unknown',
    novaClass: 1,
    aliases: ''
  });

  const handleInputChange = (field, value) => {
    if (field.startsWith('nutrients.')) {
      const nutrient = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        nutrients: {
          ...prev.nutrients,
          [nutrient]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate required fields
    if (!formData.name.trim()) {
      errors.name = 'Food name is required';
    }
    
    // Validate required nutrients
    const requiredNutrients = ['kcal', 'protein', 'fat', 'carbs'];
    requiredNutrients.forEach(nutrient => {
      const value = formData.nutrients[nutrient];
      if (!value || value === '') {
        errors[`nutrients.${nutrient}`] = `${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)} is required`;
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          errors[`nutrients.${nutrient}`] = 'Must be a valid positive number';
        }
      }
    });

    // Validate portion size
    const portionSize = parseFloat(formData.portionGramsDefault);
    if (isNaN(portionSize) || portionSize < 1 || portionSize > 10000) {
      errors.portionGramsDefault = 'Portion size must be between 1 and 10,000 grams';
    }

    // Validate GI if provided
    if (formData.gi && formData.gi !== '') {
      const giValue = parseFloat(formData.gi);
      if (isNaN(giValue) || giValue < 0 || giValue > 110) {
        errors.gi = 'Glycemic Index must be between 0 and 110';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    setValidationErrors({});

    try {
      // Prepare data for API
      const apiData = {
        ...formData,
        nutrients: Object.fromEntries(
          Object.entries(formData.nutrients).map(([key, value]) => [
            key,
            value === '' ? 0 : parseFloat(value) || 0
          ])
        ),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        aliases: formData.aliases ? formData.aliases.split(',').map(alias => alias.trim()) : [],
        gi: formData.gi ? parseFloat(formData.gi) : null,
        portionGramsDefault: parseFloat(formData.portionGramsDefault) || 100
      };

      const response = await fetch(buildApiUrl('/api/food/custom'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create custom food');
      }

      setSuccess('Custom food item created successfully!');
      
      // Call callback to refresh search results or add to meal
      if (onFoodCreated) {
        onFoodCreated(data.food);
      }

      // Reset form after a short delay
      setTimeout(() => {
        setFormData({
          name: '',
          nutrients: {
            kcal: '',
            protein: '',
            fat: '',
            carbs: '',
            fiber: '',
            sugar: '',
            vitaminC: '',
            zinc: '',
            selenium: '',
            iron: '',
            omega3: ''
          },
          portionGramsDefault: 100,
          tags: '',
          gi: '',
          fodmap: 'Unknown',
          novaClass: 1,
          aliases: ''
        });
        setSuccess('');
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card variant="elevated" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create Custom Food Item</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-[#1E49C9]/10 border border-[#1E49C9]/30 rounded-lg flex items-center gap-2 text-[#1E49C9]">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Basic Information</h3>
              
              <div>
                <Input
                  label="Food Name *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Homemade Chicken Curry"
                  required
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Default Portion (grams)"
                    type="number"
                    value={formData.portionGramsDefault}
                    onChange={(e) => handleInputChange('portionGramsDefault', e.target.value)}
                    placeholder="100"
                    className={validationErrors.portionGramsDefault ? 'border-red-500' : ''}
                  />
                  {validationErrors.portionGramsDefault && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.portionGramsDefault}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="Glycemic Index (optional)"
                    type="number"
                    value={formData.gi}
                    onChange={(e) => handleInputChange('gi', e.target.value)}
                    placeholder="e.g., 55"
                    className={validationErrors.gi ? 'border-red-500' : ''}
                  />
                  {validationErrors.gi && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.gi}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FODMAP Level
                  </label>
                  <select
                    value={formData.fodmap}
                    onChange={(e) => handleInputChange('fodmap', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NOVA Classification
                  </label>
                  <select
                    value={formData.novaClass}
                    onChange={(e) => handleInputChange('novaClass', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 - Unprocessed/Minimally Processed</option>
                    <option value={2}>2 - Processed Culinary Ingredients</option>
                    <option value={3}>3 - Processed Foods</option>
                    <option value={4}>4 - Ultra-Processed Foods</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tags (comma-separated)"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="e.g., indian, curry, homemade"
                />

                <Input
                  label="Aliases (comma-separated)"
                  value={formData.aliases}
                  onChange={(e) => handleInputChange('aliases', e.target.value)}
                  placeholder="e.g., chicken curry, curry chicken"
                />
              </div>
            </div>

            {/* Nutritional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Nutritional Information (per 100g)</h3>
              <p className="text-sm text-gray-600">Enter nutritional values per 100g. Leave empty for 0.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    label="Calories (kcal) *"
                    type="number"
                    step="0.1"
                    value={formData.nutrients.kcal}
                    onChange={(e) => handleInputChange('nutrients.kcal', e.target.value)}
                    placeholder="0"
                    required
                    className={validationErrors['nutrients.kcal'] ? 'border-red-500' : ''}
                  />
                  {validationErrors['nutrients.kcal'] && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors['nutrients.kcal']}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="Protein (g) *"
                    type="number"
                    step="0.1"
                    value={formData.nutrients.protein}
                    onChange={(e) => handleInputChange('nutrients.protein', e.target.value)}
                    placeholder="0"
                    required
                    className={validationErrors['nutrients.protein'] ? 'border-red-500' : ''}
                  />
                  {validationErrors['nutrients.protein'] && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors['nutrients.protein']}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="Fat (g) *"
                    type="number"
                    step="0.1"
                    value={formData.nutrients.fat}
                    onChange={(e) => handleInputChange('nutrients.fat', e.target.value)}
                    placeholder="0"
                    required
                    className={validationErrors['nutrients.fat'] ? 'border-red-500' : ''}
                  />
                  {validationErrors['nutrients.fat'] && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors['nutrients.fat']}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="Carbs (g) *"
                    type="number"
                    step="0.1"
                    value={formData.nutrients.carbs}
                    onChange={(e) => handleInputChange('nutrients.carbs', e.target.value)}
                    placeholder="0"
                    required
                    className={validationErrors['nutrients.carbs'] ? 'border-red-500' : ''}
                  />
                  {validationErrors['nutrients.carbs'] && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors['nutrients.carbs']}</p>
                  )}
                </div>

                <Input
                  label="Fiber (g)"
                  type="number"
                  step="0.1"
                  value={formData.nutrients.fiber}
                  onChange={(e) => handleInputChange('nutrients.fiber', e.target.value)}
                  placeholder="0"
                />

                <Input
                  label="Sugar (g)"
                  type="number"
                  step="0.1"
                  value={formData.nutrients.sugar}
                  onChange={(e) => handleInputChange('nutrients.sugar', e.target.value)}
                  placeholder="0"
                />

                <Input
                  label="Vitamin C (mg)"
                  type="number"
                  step="0.1"
                  value={formData.nutrients.vitaminC}
                  onChange={(e) => handleInputChange('nutrients.vitaminC', e.target.value)}
                  placeholder="0"
                />

                <Input
                  label="Zinc (mg)"
                  type="number"
                  step="0.1"
                  value={formData.nutrients.zinc}
                  onChange={(e) => handleInputChange('nutrients.zinc', e.target.value)}
                  placeholder="0"
                />

                <Input
                  label="Selenium (μg)"
                  type="number"
                  step="0.1"
                  value={formData.nutrients.selenium}
                  onChange={(e) => handleInputChange('nutrients.selenium', e.target.value)}
                  placeholder="0"
                />

                <Input
                  label="Iron (mg)"
                  type="number"
                  step="0.1"
                  value={formData.nutrients.iron}
                  onChange={(e) => handleInputChange('nutrients.iron', e.target.value)}
                  placeholder="0"
                />

                <Input
                  label="Omega-3 (g)"
                  type="number"
                  step="0.1"
                  value={formData.nutrients.omega3}
                  onChange={(e) => handleInputChange('nutrients.omega3', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
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
                    Create Food Item
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

export default CreateCustomFood;
