import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, PlusCircle } from 'lucide-react';
import CreateCustomFood from '../food/CreateCustomFood';

const FoodSearch = ({ results, isSearching, hasSearched, onAddFood, searchQuery = '', aiAnalysisSuggestion = null, onAnalyzeWithAI = null, isAnalyzing = false }) => {
  const [showCreateCustom, setShowCreateCustom] = useState(false);
  // Don't show anything until user has searched
  if (!hasSearched) {
    return null;
  }

  if (isSearching) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-[#E8EEF2]">
            Search Results
          </h3>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#FFD200]" />
        </div>
      </div>
    );
  }

  if (hasSearched && results.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-[#E8EEF2]">
            Search Results
          </h3>
          <button
            onClick={() => setShowCreateCustom(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#FFD200] text-black text-sm font-medium rounded-lg hover:bg-[#FFE55C] transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add Missing Food
          </button>
        </div>
        
        {/* AI Analysis Suggestion */}
        {aiAnalysisSuggestion && (
          <div className="bg-gradient-to-r from-[#1E49C9]/20 to-[#3EA6FF]/20 border border-[#1E49C9]/30 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#1E49C9] rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[#E8EEF2] mb-2">AI Food Analysis Available</h4>
                <p className="text-sm text-[#C9D1D9] mb-3">
                  {aiAnalysisSuggestion.message}
                </p>
                <button
                  onClick={() => onAnalyzeWithAI && onAnalyzeWithAI(searchQuery)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1E49C9] text-white text-sm font-medium rounded-lg hover:bg-[#1E49C9]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center py-8 text-[#6B7280]">
          <p className="text-sm text-red-400">No results found. Try a different search term.</p>
          <p className="text-xs mt-2 text-[#6B7280]">Try: idli, roti, paneer, dal, etc.</p>
          <p className="text-xs mt-2 text-[#6B7280]">Or create a custom food item if it's not in our database.</p>
        </div>
        
        {/* Create Custom Food Modal */}
        <CreateCustomFood
          isOpen={showCreateCustom}
          onClose={() => setShowCreateCustom(false)}
          onFoodCreated={(food) => {
            setShowCreateCustom(false);
            if (onAddFood) {
              onAddFood(food);
            }
          }}
          searchQuery={searchQuery}
        />
      </div>
    );
  }


  const getTraditionalUnits = (food) => {
    // Standard Indian portion units
    const standardUnits = [
      { unit: 'katori', label: 'Katori', grams: 80, description: 'Small bowl', isDefault: true },
      { unit: 'bowl', label: 'Bowl', grams: 150, description: 'Medium bowl' },
      { unit: 'piece', label: 'Piece', grams: 50, description: 'Standard piece' },
      { unit: 'spoon', label: 'Spoon', grams: 15, description: 'Tablespoon' }
    ];

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        <span className="text-xs text-[#FFD200] font-medium">Click to add:</span>
        {standardUnits.map((unit, unitIndex) => (
          <button
            key={`unit-${food._id || food.id || food.barcode || unitIndex}-${unitIndex}`}
            onClick={() => onAddFood(food, unit)}
            className={`inline-flex items-center px-3 py-1 text-xs rounded-full border transition-all duration-200 hover:scale-105 cursor-pointer ${
              unit.isDefault
                ? 'bg-[#FFD200]/20 text-[#FFD200] border-[#FFD200]/50 hover:bg-[#FFD200]/30 hover:shadow-lg'
                : 'bg-[#2A313A] text-[#C9D1D9] border-[#2A313A] hover:bg-[#3A414A] hover:border-[#4A515A] hover:shadow-lg'
            }`}
            title={`Click to add 1 ${unit.description} (${unit.grams}g)`}
          >
            <span className="mr-1">+</span>
            {unit.unit}
            {unit.isDefault && <span className="ml-1 text-[10px]">★</span>}
            <span className="ml-1 text-[10px] opacity-75">({unit.grams}g)</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-[#E8EEF2]">
          Search Results
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6B7280]">
            Showing {results.length} results
          </span>
          <button
            onClick={() => setShowCreateCustom(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#FFD200] text-black text-sm font-medium rounded-lg hover:bg-[#FFE55C] transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add Missing Food
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {results.map((food, index) => (
          <motion.div
            key={`meal-food-${food._id || food.id || food.barcode || index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#0A0C0F] border border-[#2A313A] rounded-lg p-4 hover:border-[#FFD200] transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-[#E8EEF2]">
                    {food.name}
                  </h4>
                  {/* Source indicator */}
                  <span className={`px-2 py-1 text-xs rounded-full border ${
                    food.source === 'IFCT' 
                      ? 'bg-[#1E49C9]/30 text-[#1E49C9] border-[#1E49C9]/50'
                      : food.source === 'USDA'
                      ? 'bg-blue-900/30 text-blue-300 border-blue-700/50'
                      : food.source === 'OpenFoodFacts'
                      ? 'bg-purple-900/30 text-purple-300 border-purple-700/50'
                      : food.source === 'AI_ANALYZED'
                      ? 'bg-gradient-to-r from-[#1E49C9]/30 to-[#3EA6FF]/30 text-[#1E49C9] border-[#1E49C9]/50'
                      : 'bg-gray-900/30 text-gray-300 border-gray-700/50'
                  }`}>
                    {food.source === 'AI_ANALYZED' ? 'AI Analyzed' : food.source}
                  </span>
                </div>
                
                {/* Traditional Units */}
                {getTraditionalUnits(food)}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Create Custom Food Modal */}
      <CreateCustomFood
        isOpen={showCreateCustom}
        onClose={() => setShowCreateCustom(false)}
        onFoodCreated={(food) => {
          setShowCreateCustom(false);
          if (onAddFood) {
            onAddFood(food);
          }
        }}
        searchQuery={searchQuery}
      />
    </div>
  );
};

export default FoodSearch;
