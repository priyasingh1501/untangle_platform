import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import toast from 'react-hot-toast';
import { Card, Button } from '../ui';
import FoodSearch from './FoodSearch';
import MealItems from './MealItems';
import MealContext from './MealContext';

const MealBuilder = ({ onMealSaved }) => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [mealItems, setMealItems] = useState([]);
  const [context, setContext] = useState({
    lateNightEating: false,
    sedentaryAfterMeal: false,
    stressEating: false,
    packagedStoredLong: false,
    mindlessEating: false
  });
  const [isSaving, setIsSaving] = useState(false);

  // Indian portion units with their gram equivalents
  const indianPortionUnits = useMemo(() => [
    { unit: 'katori', label: 'Katori', grams: 80, description: 'Small bowl' },
    { unit: 'bowl', label: 'Bowl', grams: 150, description: 'Medium bowl' },
    { unit: 'piece', label: 'Piece', grams: 50, description: 'Standard piece' },
    { unit: 'spoon', label: 'Spoon', grams: 15, description: 'Tablespoon' },
    { unit: 'roti', label: 'Roti', grams: 45, description: 'Flatbread' },
    { unit: 'idli', label: 'Idli', grams: 120, description: 'Steamed rice cake' },
    { unit: 'cup', label: 'Cup', grams: 200, description: 'Standard cup' },
    { unit: 'handful', label: 'Handful', grams: 30, description: 'Handful' }
  ], []);

  // Search for foods using multi-source search with fallback
  const searchFoods = useCallback(async (query) => {
    if (!query.trim() || !token) return;
    
    setIsSearching(true);
    try {
      // Try multi-source search first (POST endpoint)
      console.log('🔍 Attempting multi-source search for:', query.trim());
      const response = await fetch(buildApiUrl('/api/food/search'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query.trim(),
          source: 'combined', // Search all sources: local, USDA, and OpenFoodFacts
          limit: 20
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Multi-source search response:', data);
        
        // The POST endpoint returns 'results' with multi-source data
        const results = data.results || [];
        console.log('📊 Raw results:', results);
        
        if (results.length > 0) {
          // Transform results to match expected format
          const foods = results.map(result => {
            // Handle different source formats
            if (result.source === 'IFCT') {
              // Local database food
              return {
                _id: result.id || result._id,
                name: result.name,
                source: 'IFCT', // Use consistent source name
                portionGramsDefault: result.portionGramsDefault || 100,
                nutrients: result.nutrients || result.nutriments100g,
                tags: result.tags || [],
                gi: result.gi,
                fodmap: result.fodmap,
                novaClass: result.novaClass,
                aliases: result.aliases || [],
                provenance: result.provenance || { source: 'Local Database' }
              };
            } else if (result.source === 'usda') {
              // USDA food
              return {
                _id: result.id,
                name: result.name,
                source: 'USDA',
                portionGramsDefault: 100,
                nutrients: {
                  kcal: result.nutriments100g?.kcal || 0,
                  protein: result.nutriments100g?.protein || 0,
                  fat: result.nutriments100g?.fat || 0,
                  carbs: result.nutriments100g?.carbs || 0,
                  fiber: result.nutriments100g?.fiber || 0,
                  sugar: result.nutriments100g?.sugar || 0,
                  vitaminC: 0,
                  zinc: 0,
                  selenium: 0,
                  iron: 0,
                  omega3: 0
                },
                tags: [],
                brand: result.brand,
                relevanceScore: result.relevanceScore,
                provenance: result.provenance || { source: 'USDA Database' }
              };
            } else if (result.source === 'off') {
              // OpenFoodFacts food
              return {
                _id: result.id,
                name: result.name,
                source: 'OpenFoodFacts',
                portionGramsDefault: 100,
                nutrients: {
                  kcal: result.nutriments100g?.kcal || 0,
                  protein: result.nutriments100g?.protein || 0,
                  fat: result.nutriments100g?.fat || 0,
                  carbs: result.nutriments100g?.carbs || 0,
                  fiber: result.nutriments100g?.fiber || 0,
                  sugar: result.nutriments100g?.sugar || 0,
                  vitaminC: 0,
                  zinc: 0,
                  selenium: 0,
                  iron: 0,
                  omega3: 0
                },
                tags: result.tags || [],
                brand: result.brand,
                barcode: result.barcode,
                novaClass: result.novaClass,
                relevanceScore: result.relevanceScore,
                provenance: result.provenance || { source: 'Open Food Facts' }
              };
            }
            return result;
          });
          
          // Remove duplicates based on name and source
          const uniqueFoods = foods.reduce((acc, food) => {
            const existingFood = acc.find(f => 
              f._id === food._id || 
              (f.name.toLowerCase() === food.name.toLowerCase() && f.source === food.source)
            );
            
            if (!existingFood) {
              acc.push(food);
            }
            return acc;
          }, []);
          
          console.log('✅ Multi-source search successful, found:', uniqueFoods.length, 'foods');
          setSearchResults(uniqueFoods);
          return;
        }
      }
      
      // Fallback to local search if multi-source search fails or returns no results
      console.log('🔄 Multi-source search failed or no results, falling back to local search');
      const fallbackResponse = await fetch(buildApiUrl(`/api/food/search?q=${encodeURIComponent(query.trim())}&limit=20`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const foods = fallbackData.foods || [];
        
        // Transform fallback foods to ensure consistent source information
        const transformedFoods = foods.map(food => ({
          ...food,
          source: 'IFCT', // Local database foods are from IFCT
          provenance: food.provenance || { source: 'Local Database' }
        }));
        
        // Remove duplicates based on food ID and name
        const uniqueFoods = transformedFoods.reduce((acc, food) => {
          const existingFood = acc.find(f => 
            f._id === food._id || 
            f.name.toLowerCase() === food.name.toLowerCase()
          );
          
          if (!existingFood) {
            acc.push(food);
          }
          return acc;
        }, []);
        
        console.log('✅ Fallback local search successful, found:', uniqueFoods.length, 'foods');
        setSearchResults(uniqueFoods);
      } else {
        const errorData = await fallbackResponse.text();
        console.error('❌ Both searches failed:', response.status, errorData);
        toast.error(`Failed to search foods: ${fallbackResponse.status}`);
      }
    } catch (error) {
      console.error('Error searching foods:', error);
      toast.error('Error searching foods');
    } finally {
      setIsSearching(false);
    }
  }, [token]);

  // Add food to meal
  const addFoodToMeal = useCallback((food, selectedUnit = null) => {
    // Handle different ID formats from different sources
    const foodId = food._id || food.id || food.barcode;
    const existingItem = mealItems.find(item => item.foodId === foodId);
    
    // Determine the portion to add - default to 1 katori if no unit specified
    let portionToAdd = 80; // Default to 1 katori (80g)
    let unitDescription = '1 katori';
    let defaultUnit = indianPortionUnits[0]; // Default to katori
    
    if (selectedUnit) {
      portionToAdd = selectedUnit.grams;
      unitDescription = `1 ${selectedUnit.unit}`;
    } else {
      // Use default Indian portion unit (1 katori)
      portionToAdd = defaultUnit.grams;
      unitDescription = `1 ${defaultUnit.unit}`;
      selectedUnit = defaultUnit;
    }
    
    if (existingItem) {
      // Update existing item
      setMealItems(prev => prev.map(item => 
        item.foodId === foodId 
          ? { ...item, grams: item.grams + portionToAdd }
          : item
      ));
      const message = selectedUnit 
        ? `Updated ${food.name} with +${unitDescription} (${portionToAdd}g)`
        : `Updated ${food.name} portion`;
      toast.success(message);
    } else {
      // Add new item
      const newItem = {
        foodId: foodId,
        customName: food.name,
        grams: portionToAdd,
        food: food, // Store full food object for analysis
        selectedUnit: selectedUnit // Store the selected unit for display
      };
      setMealItems(prev => [...prev, newItem]);
      const message = selectedUnit 
        ? `Added ${food.name} (${unitDescription} = ${portionToAdd}g)`
        : `Added ${food.name} to meal`;
      toast.success(message);
    }
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  }, [mealItems, indianPortionUnits]);

  // Remove food from meal
  const removeFoodFromMeal = useCallback((foodId) => {
    setMealItems(prev => prev.filter(item => item.foodId !== foodId));
    toast.success('Food removed from meal');
  }, []);

  // Update food portion
  const updateFoodPortion = useCallback((foodId, grams) => {
    setMealItems(prev => prev.map(item => 
      item.foodId === foodId 
        ? { ...item, grams: Math.max(0, grams) }
        : item
    ));
  }, []);

  // Save meal
  const saveMeal = useCallback(async () => {
    if (mealItems.length === 0) {
      toast.error('Please add at least one food item');
      return;
    }

    setIsSaving(true);
    try {
      const mealData = {
        items: mealItems.map(item => ({
          foodId: item.foodId,
          grams: item.grams
        })),
        context
      };

      console.log('MealBuilder: Sending meal data:', mealData);
      console.log('MealBuilder: Token exists:', !!token);
      
      // Show initial loading message
      toast.loading('Processing meal data...', { id: 'meal-saving' });

      const response = await fetch(buildApiUrl('/api/meals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(mealData)
      });

      if (response.ok) {
        await response.json();
        toast.dismiss('meal-saving');
        toast.success('Meal saved successfully!');
        
        // Clear form
        setMealItems([]);
        setContext({
          lateNightEating: false,
          sedentaryAfterMeal: false,
          stressEating: false,
          packagedStoredLong: false,
          mindlessEating: false
        });

        // Notify parent component to refresh meal data
        if (onMealSaved) {
          console.log('MealBuilder: Meal saved, notifying parent to refresh');
          onMealSaved();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save meal:', response.status, errorData);
        toast.dismiss('meal-saving');
        toast.error(`Failed to save meal: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      toast.dismiss('meal-saving');
      toast.error(`Error saving meal: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [mealItems, context, token, onMealSaved]);

  // Handle search input - only update state, don't search
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear results and reset search state when input is empty
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setHasSearched(true);
      searchFoods(searchQuery);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Food Search */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card
            title="Search & Add Foods"
            className="h-full"
          >
              
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-5 w-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInput}
                      placeholder="Search foods..."
                      className="w-full pl-10 pr-4 py-3 bg-background-primary border border-border-primary rounded-xl text-text-primary focus:border-accent focus:outline-none placeholder-text-muted"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!searchQuery.trim()}
                    className="px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-jakarta text-sm leading-relaxed tracking-wider font-semibold"
                  >
                    Search
                  </button>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="px-4 py-3 bg-background-tertiary text-text-secondary rounded-xl hover:bg-background-tertiary/80 transition-colors duration-200 font-jakarta text-sm leading-relaxed tracking-wider"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>

              {/* Search Results */}
            <FoodSearch
              results={searchResults}
              isSearching={isSearching}
              hasSearched={hasSearched}
              onAddFood={addFoodToMeal}
              searchQuery={searchQuery}
            />
          </Card>
        </motion.div>

        {/* Right Column - Meal Items */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            title="Meal Items"
            className="h-full"
          >
            <MealItems
              items={mealItems}
              onRemoveFood={removeFoodFromMeal}
              onUpdatePortion={updateFoodPortion}
            />
          </Card>
        </motion.div>
          </div>

      {/* Full-width sections below */}
      <div className="space-y-6">
        {/* Meal Context */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card
            title="Meal Context"
          >
            <MealContext
              context={context}
              setContext={setContext}
            />
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Button
            onClick={saveMeal}
            disabled={isSaving || mealItems.length === 0}
            variant="primary"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold"
          >
            <Save className="h-5 w-5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Meal'}
          </Button>
        </motion.div>

        {/* Data Source Footnote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-text-muted"
        >
          <p className="flex items-center justify-center gap-2">
            <span>Powered by</span>
            <span className="font-medium text-text-secondary">IFCT</span>
            <span>•</span>
            <span className="font-medium text-text-secondary">USDA</span>
            <span>•</span>
            <span className="font-medium text-text-secondary">OpenFoodFacts</span>
            <span className="text-xs opacity-75">+ AI analysis</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default MealBuilder;
