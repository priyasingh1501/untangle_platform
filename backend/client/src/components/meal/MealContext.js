import React from 'react';
import { motion } from 'framer-motion';

const MealContext = ({ context, setContext }) => {
  const updateContext = (key, value) => {
    setContext(prev => ({ ...prev, [key]: value }));
  };

  const contextOptions = [
    {
      key: 'lateNightEating',
      label: 'Late night eating',
      description: 'Eating after 9 PM',
      effects: ['fat formation', 'inflammatory']
    },
    {
      key: 'sedentaryAfterMeal',
      label: 'Sedentary after meal',
      description: 'No activity after eating',
      effects: ['fat formation', 'inflammatory']
    },
    {
      key: 'stressEating',
      label: 'Stress eating',
      description: 'Eating due to stress',
      effects: ['fat formation', 'inflammatory']
    },
    {
      key: 'packagedStoredLong',
      label: 'Packaged/Stored long',
      description: 'Processed or long-stored food',
      effects: ['fat formation', 'inflammatory']
    },
    {
      key: 'mindlessEating',
      label: 'Mindless eating',
      description: 'Eating while distracted',
      effects: ['fat formation', 'inflammatory']
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm text-text-secondary mb-3">
        Select any factors that apply to this meal. Each selection increases fat formation and inflammatory effects by 1 point.
      </div>
      
      <div className="flex flex-wrap gap-2">
        {contextOptions.map((option) => (
          <motion.button
            key={option.key}
            onClick={() => updateContext(option.key, !context[option.key])}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              context[option.key]
                ? 'bg-red-600 text-white border-2 border-red-500 shadow-lg'
                : 'bg-background-tertiary text-text-primary border-2 border-border-primary hover:border-red-400 hover:bg-red-900/20'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={option.description}
          >
            {option.label}
            {context[option.key] && (
              <span className="ml-2 text-xs">✓</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Selected effects info */}
      {Object.values(context).some(value => value === true) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-900/20 rounded-lg border border-red-500/30"
        >
          <div className="text-sm text-text-primary">
            <p className="font-medium text-red-400 mb-1">⚠️ Selected factors will increase:</p>
            <ul className="space-y-1 text-xs text-text-secondary">
              <li>• <strong>Fat Formation:</strong> +1 point per selected factor</li>
              <li>• <strong>Inflammatory Effect:</strong> +1 point per selected factor</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MealContext;
