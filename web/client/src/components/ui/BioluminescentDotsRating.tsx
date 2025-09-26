import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BioluminescentDotsRatingProps {
  value: number;
  onChange: (value: number) => void;
  maxValue?: number;
  minValue?: number;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const BioluminescentDotsRating: React.FC<BioluminescentDotsRatingProps> = ({
  value,
  onChange,
  maxValue = 5,
  minValue = 1,
  disabled = false,
  className = '',
  'aria-label': ariaLabel = 'Rating',
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Generate array of values
  const values = Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = Math.max(0, currentIndex - 1);
        setFocusedIndex(prevIndex);
        dotRefs.current[prevIndex]?.focus();
        break;
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = Math.min(values.length - 1, currentIndex + 1);
        setFocusedIndex(nextIndex);
        dotRefs.current[nextIndex]?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onChange(values[currentIndex]);
        break;
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        dotRefs.current[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        const lastIndex = values.length - 1;
        setFocusedIndex(lastIndex);
        dotRefs.current[lastIndex]?.focus();
        break;
    }
  };

  // Handle dot click
  const handleDotClick = (dotValue: number) => {
    if (disabled) return;
    onChange(dotValue);
  };

  // Handle focus
  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  // Handle blur
  const handleBlur = () => {
    setFocusedIndex(null);
  };

  // Update refs array when values change
  useEffect(() => {
    dotRefs.current = dotRefs.current.slice(0, values.length);
  }, [values.length]);

  // Scale labels for 5-point scale
  const scaleLabels = ['Strong No', 'No', 'Maybe', 'Yes', 'Strong Yes'];

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Scale Labels */}
      <div className="flex justify-between w-full max-w-[280px] text-xs text-[#94A3B8]">
        {scaleLabels.map((label, index) => (
          <span key={index} className="text-center">
            {label}
          </span>
        ))}
      </div>

      {/* Dots Container */}
      <div
        ref={containerRef}
        className="flex items-center gap-3"
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {values.map((dotValue, index) => {
          const isActive = dotValue <= value;
          const isFocused = focusedIndex === index;

          return (
            <motion.button
              key={dotValue}
              ref={(el) => (dotRefs.current[index] = el)}
              onClick={() => handleDotClick(dotValue)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              disabled={disabled}
              className={`
                relative w-9 h-9 rounded-full
                flex items-center justify-center
                transition-all duration-200 ease-out
                focus:outline-none
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
              style={{
                background: isActive 
                  ? '#1E49C9' 
                  : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)',
                boxShadow: isActive 
                  ? '0 0 8px rgba(30,73,201,0.35)' 
                  : isFocused
                  ? '0 0 0 2px rgba(255,255,255,0.8), 0 0 8px rgba(30,73,201,0.25)'
                  : 'none',
              }}
              whileHover={disabled ? {} : { 
                scale: 1.05,
                boxShadow: '0 0 6px rgba(30,73,201,0.25)',
              }}
              whileTap={disabled ? {} : { scale: 0.95 }}
              aria-label={`Rate ${dotValue} out of ${maxValue}`}
              aria-checked={isActive}
              role="radio"
              tabIndex={isFocused ? 0 : -1}
            >
              {/* Inner glow effect for active dots */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              
              {/* Dot indicator */}
              <div 
                className={`
                  w-2 h-2 rounded-full
                  transition-all duration-200 ease-out
                  ${isActive ? 'bg-white' : 'bg-transparent'}
                `}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BioluminescentDotsRating;
