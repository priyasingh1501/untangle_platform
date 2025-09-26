import React, { useEffect, useState, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';

const MindfulnessGlass = ({ totalScore, maxScore = 25 }) => {
  const controls = useAnimation();
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneText, setMilestoneText] = useState('');

  // Calculate fill percentage
  const fillPercentage = (totalScore / maxScore) * 100;

  const triggerMilestone = useCallback(async (text) => {
    setMilestoneText(text);
    setShowMilestone(true);
    
    // Animate the glass
    await controls.start({
      scale: [1, 1.1, 1],
      transition: { duration: 0.6, ease: "easeInOut" }
    });
    
    // Hide milestone after delay
    setTimeout(() => setShowMilestone(false), 2000);
  }, [controls]);

    // Check for milestones
  useEffect(() => {
    if (totalScore >= 20 && totalScore < 21) {
      triggerMilestone('Master Level! 🌟');
    } else if (totalScore >= 15 && totalScore < 16) {
      triggerMilestone('Advanced! 🚀');
    } else if (totalScore >= 10 && totalScore < 11) {
      triggerMilestone('Intermediate! 💪');
    }
  }, [totalScore, triggerMilestone]);

  // Get rectangle color based on score - using only primary blue
  const getRectangleColor = () => {
    if (totalScore === 0) return '#1a2332'; // Subtle dark blue for no activity
    if (totalScore <= 2) return '#1E49C9'; // Primary blue
    if (totalScore <= 4) return '#1E49C9'; // Primary blue
    if (totalScore <= 6) return '#1E49C9'; // Primary blue
    if (totalScore <= 8) return '#1E49C9'; // Primary blue
    if (totalScore <= 10) return '#1E49C9'; // Primary blue
    if (totalScore <= 12) return '#1E49C9'; // Primary blue
    if (totalScore <= 14) return '#1E49C9'; // Primary blue
    if (totalScore <= 16) return '#1E49C9'; // Primary blue
    if (totalScore <= 18) return '#1E49C9'; // Primary blue
    if (totalScore <= 20) return '#1E49C9'; // Primary blue
    if (totalScore <= 22) return '#1E49C9'; // Primary blue
    if (totalScore <= 24) return '#1E49C9'; // Primary blue
    return '#1E49C9'; // Primary blue
  };

  // Get assessment level
  const getAssessmentLevel = () => {
    if (totalScore >= 20) return 'Master';
    if (totalScore >= 17) return 'Advanced';
    if (totalScore >= 14) return 'Intermediate';
    if (totalScore >= 11) return 'Developing';
    return 'Beginner';
  };

  return (
    <div className="bg-[#11151A] border-2 border-[#2A313A] rounded-lg p-3 lg:p-4 text-center">
      {/* Header */}
      <h3 className="text-sm lg:text-base font-semibold text-[#E8EEF2] mb-3 font-oswald tracking-wide">
        Total Mindfulness Level
      </h3>

      {/* Rectangle Container */}
      <div className="relative mb-4">
        <motion.div
          animate={controls}
          className="relative w-24 h-32 lg:w-32 lg:h-40 mx-auto border-2 border-[#2A313A] rounded-lg overflow-hidden bg-[#0A0C0F] shadow-lg"
        >
          {/* Rectangle Fill with gradual color change */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
            style={{ 
              height: `${fillPercentage}%`,
              backgroundColor: getRectangleColor()
            }}
            initial={{ height: 0, backgroundColor: '#1a2332' }}
            animate={{ 
              height: `${fillPercentage}%`,
              backgroundColor: getRectangleColor()
            }}
          />
          
          {/* Subtle reflection effect */}
          <div className="absolute top-2 left-2 w-12 h-12 bg-white/5 rounded-lg blur-sm" />
          
          {/* Score Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-[#E8EEF2] font-mono">
                {totalScore}
              </div>
              <div className="text-xs lg:text-sm text-[#C9D1D9] font-oswald tracking-wide">
                of {maxScore}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Assessment Level */}
      <div className="mb-3">
        <div className="text-xs text-[#C9D1D9] font-oswald tracking-wide mb-1">
          Level
        </div>
        <div className={`text-sm lg:text-base font-bold font-oswald tracking-wide ${
          totalScore >= 20 ? 'text-[#FFD200]' :
          totalScore >= 17 ? 'text-[#1E49C9]' :
          totalScore >= 14 ? 'text-[#3EA6FF]' :
          totalScore >= 11 ? 'text-[#FFA500]' :
          'text-[#6B7280]'
        }`}>
          {getAssessmentLevel()}
        </div>
      </div>

      {/* Milestone Celebration */}
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[#FFD200] text-[#0A0C0F] px-4 py-2 rounded-full font-bold text-sm shadow-lg">
              {milestoneText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="w-full bg-[#0A0C0F] rounded-full h-2 border border-[#2A313A] overflow-hidden">
        <motion.div
          className="h-full transition-all duration-1000 ease-out"
          style={{ backgroundColor: getRectangleColor() }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPercentage}%` }}
        />
      </div>

      {/* Color Legend */}
      <div className="mt-4">
        <div className="text-xs text-[#C9D1D9] font-oswald tracking-wide mb-2 text-center">
          Color Progression
        </div>
        <div className="flex justify-center gap-1">
          <div className="w-3 h-3 rounded-sm border border-[#2A313A]/30" style={{ backgroundColor: '#1a2332' }}></div>
          <div className="w-3 h-3 rounded-sm border border-[#2A313A]/30" style={{ backgroundColor: '#1e3a8a' }}></div>
          <div className="w-3 h-3 rounded-sm border border-[#2A313A]/30" style={{ backgroundColor: '#2563eb' }}></div>
          <div className="w-3 h-3 rounded-sm border border-[#2A313A]/30" style={{ backgroundColor: '#60a5fa' }}></div>
          <div className="w-3 h-3 rounded-sm border border-[#2A313A]/30" style={{ backgroundColor: '#c7d2fe' }}></div>
          <div className="w-3 h-3 rounded-sm border border-[#2A313A]/30" style={{ backgroundColor: '#fef3c7' }}></div>
          <div className="w-3 h-3 rounded-sm border border-[#2A313A]/30" style={{ backgroundColor: '#fde68a' }}></div>
          <div className="w-3 h-3 rounded-sm border border-[#2A313A]/30" style={{ backgroundColor: '#fbbf24' }}></div>
          <div className="w-3 h-3 rounded-sm border border-[#2A313A]/30" style={{ backgroundColor: '#eab308' }}></div>
        </div>
        <div className="flex justify-between text-xs text-[#C9D1D9] font-inter mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
};

export default MindfulnessGlass;
