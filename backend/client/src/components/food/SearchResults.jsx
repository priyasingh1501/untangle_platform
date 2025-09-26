import React, { useState } from 'react';
import { Plus, Info, Database, Globe, TrendingUp, PlusCircle } from 'lucide-react';
import { Card, Button, Badge } from '../ui';
import CreateCustomFood from './CreateCustomFood';

const SearchResults = ({ results, onFoodCreated }) => {
  const [showCreateCustom, setShowCreateCustom] = useState(false);
  const [createCustomQuery, setCreateCustomQuery] = useState('');
  // Helper function to normalize nutrient data from different sources
  const getNormalizedNutrients = (food) => {
    if (!food) return null;
    
    // Handle local database format
    if (food.nutrients) {
      return food.nutrients;
    }
    
    // Handle Open Food Facts format
    if (food.nutriments100g) {
      return {
        kcal: food.nutriments100g.kcal || 0,
        protein: food.nutriments100g.protein || 0,
        fat: food.nutriments100g.fat || 0,
        carbs: food.nutriments100g.carbs || 0,
        fiber: food.nutriments100g.fiber || 0,
        sugar: food.nutriments100g.sugar || 0
      };
    }
    
    return null;
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'local': return <Database className="w-4 h-4" />;
      case 'usda': return <TrendingUp className="w-4 h-4" />;
      case 'off': return <Globe className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'local': return 'Local DB';
      case 'usda': return 'USDA';
      case 'off': return 'Open Food Facts';
      default: return 'Unknown';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'local': return 'success';
      case 'usda': return 'info';
      case 'off': return 'warning';
      default: return 'base';
    }
  };

  const formatNutrient = (value, unit = 'g') => {
    if (value === null || value === undefined) return 'N/A';
    return `${value}${unit}`;
  };

  const getNutritionSummary = (food) => {
    const nutrients = getNormalizedNutrients(food);
    console.log('Food:', food.name, 'Normalized nutrients:', nutrients); // Debug log
    if (!nutrients) return null;

    const { kcal, protein, carbs, fat, fiber, sugar } = nutrients;
    
    return (
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="font-semibold text-gray-800">{formatNutrient(kcal, ' kcal')}</div>
          <div className="text-gray-600 text-xs">Calories</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="font-semibold text-gray-800">{formatNutrient(protein)}</div>
          <div className="text-gray-600 text-xs">Protein</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="font-semibold text-gray-800">{formatNutrient(carbs)}</div>
          <div className="text-gray-600 text-xs">Carbs</div>
        </div>
      </div>
    );
  };

  const handleAddToMeal = (food) => {
    // TODO: Implement meal building functionality
    console.log('Adding to meal:', food);
  };

  const handleCreateCustom = (query = '') => {
    setCreateCustomQuery(query);
    setShowCreateCustom(true);
  };

  const handleCustomFoodCreated = (food) => {
    setShowCreateCustom(false);
    if (onFoodCreated) {
      onFoodCreated(food);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">
          Search Results ({results.length})
        </h3>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleCreateCustom()}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Missing Food
          </Button>
          <Badge variant="info" className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            Combined from all sources
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {results.map((food, index) => (
          <Card key={`${food.id || food.barcode || 'food'}-${index}`} variant="elevated" className="p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Food Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 text-xl mb-1">{food.name}</h4>
                    {food.brand && (
                      <p className="text-gray-600 text-sm font-medium">{food.brand}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Relevance Score */}
                    {food.relevanceScore && (
                      <Badge 
                        variant="base"
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {Math.round(food.relevanceScore * 100)}% match
                      </Badge>
                    )}
                    
                    {/* Source Badge */}
                    <Badge 
                      variant={getSourceColor(food.source || 'unknown')}
                      className="flex items-center gap-2 px-3 py-1"
                    >
                      {getSourceIcon(food.source || 'unknown')}
                      {getSourceLabel(food.source || 'unknown')}
                    </Badge>
                  </div>
                </div>

                {/* Tags and Badges */}
                {food.tags && food.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {food.tags.slice(0, 6).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="base" size="sm" className="px-2 py-1 text-xs">
                        {tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                    {food.tags.length > 6 && (
                      <Badge variant="info" size="sm" className="px-2 py-1 text-xs">
                        +{food.tags.length - 6} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Nutrition Summary */}
                <div className="mb-4">
                  {getNutritionSummary(food) || (
                    <div className="text-sm text-gray-500 italic">
                      Nutritional information not available
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  {food.servingSize && (
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <span className="font-medium text-blue-800">Serving:</span> {food.servingSize}
                    </div>
                  )}
                  {food.quantity && (
                    <div className="bg-[#1E49C9]/10 p-2 rounded-lg">
                      <span className="font-medium text-[#1E49C9]">Quantity:</span> {food.quantity}
                    </div>
                  )}
                  {food.novaClass && (
                    <div className="bg-purple-50 p-2 rounded-lg">
                      <span className="font-medium text-purple-800">NOVA:</span> {food.novaClass}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 lg:flex-shrink-0">
                <Button
                  onClick={() => handleAddToMeal(food)}
                  variant="primary"
                  size="md"
                  className="flex items-center gap-2 min-w-[140px]"
                >
                  <Plus className="w-4 h-4" />
                  Add to Meal
                </Button>
                
                <Button
                  variant="secondary"
                  size="md"
                  className="flex items-center gap-2 min-w-[140px]"
                >
                  <Info className="w-4 h-4" />
                  Details
                </Button>
              </div>
            </div>

            {/* Provenance Info */}
            {food.provenance && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Source:</span>
                    <span className="text-gray-700">{food.provenance.source}</span>
                  </div>
                  {food.provenance.lastUpdated && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Updated:</span>
                      <span className="text-gray-700">{new Date(food.provenance.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create Custom Food Modal */}
      <CreateCustomFood
        isOpen={showCreateCustom}
        onClose={() => setShowCreateCustom(false)}
        onFoodCreated={handleCustomFoodCreated}
        searchQuery={createCustomQuery}
      />
    </div>
  );
};

export default SearchResults;
