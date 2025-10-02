import React from 'react';
import { motion } from 'framer-motion';
import BioluminescentDotsRating from './BioluminescentDotsRating.tsx';

const MoonPhaseSlider = ({ 
  value, 
  onChange, 
  dimension
}) => {
  // Map dimension names to questions
  const getDimensionQuestion = (dim) => {
    const questions = {
      presence: "I noticed and enjoyed small moments.",
      emotionAwareness: "I recognized my feelings before reacting.",
      intentionality: "My actions matched my values/goals.",
      attentionQuality: "I gave full attention to tasks/people.",
      compassion: "I was kind to myself and others."
    };
    return questions[dim] || dim;
  };

  return (
    <div className="bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.2)] rounded-2xl p-6 backdrop-blur-[32px] backdrop-saturate-[180%] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]">
      {/* Question and Rating Dots Stacked */}
      <div className="space-y-4">
        {/* Question */}
        <h3 className="text-base leading-[150%] font-medium text-[#E8EEF2]">
          {getDimensionQuestion(dimension)}
        </h3>

        {/* Bioluminescent Dots Rating */}
        <BioluminescentDotsRating
          value={value}
          onChange={onChange}
          maxValue={5}
          minValue={1}
          aria-label={`Rate ${dimension} from 1 to 5`}
        />
      </div>
    </div>
  );
};

export default MoonPhaseSlider;
