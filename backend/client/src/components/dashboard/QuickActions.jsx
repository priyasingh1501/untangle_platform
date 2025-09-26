import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Utensils, 
  BookOpen, 
  Target, 
  Brain, 
  DollarSign,
  Clock,
  Heart
} from 'lucide-react';
import Card from '../ui/Card';

const QuickActions = () => {
  const actions = [
    {
      id: 'add-task',
      label: 'Add Task',
      icon: Plus,
      href: '/goal-aligned-day',
      color: 'bg-[#1E49C9]',
      hoverColor: 'hover:bg-[#1E49C9]/80',
      description: 'Quick task creation'
    },
    {
      id: 'log-meal',
      label: 'Log Meal',
      icon: Utensils,
      href: '/food',
      color: 'bg-[#1E49C9]',
      hoverColor: 'hover:bg-[#1E49C9]/80',
      description: 'Track nutrition'
    },
    {
      id: 'journal-entry',
      label: 'Journal',
      icon: BookOpen,
      href: '/journal',
      color: 'bg-[#1E49C9]',
      hoverColor: 'hover:bg-[#1E49C9]/80',
      description: 'Capture thoughts'
    },
    {
      id: 'mindfulness',
      label: 'Mindfulness',
      icon: Brain,
      href: '/goal-aligned-day',
      color: 'bg-[#1E49C9]',
      hoverColor: 'hover:bg-[#1E49C9]/80',
      description: 'Check-in'
    },
    {
      id: 'add-expense',
      label: 'Add Expense',
      icon: DollarSign,
      href: '/finance',
      color: 'bg-[#1E49C9]',
      hoverColor: 'hover:bg-[#1E49C9]/80',
      description: 'Track spending'
    },
    {
      id: 'set-goal',
      label: 'Set Goal',
      icon: Target,
      href: '/goal-aligned-day',
      color: 'bg-[#1E49C9]',
      hoverColor: 'hover:bg-[#1E49C9]/80',
      description: 'Create objective'
    }
  ];

  return (
    <Card>
      <div className="p-4">
        <h3 className="font-jakarta text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
        
        {/* Actions Grid */}
        <div className="grid grid-cols-1 gap-4">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <motion.a
              key={action.id}
              href={action.href}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden bg-white/10 hover:bg-white/15 backdrop-blur-md text-white rounded-xl p-4 transition-all duration-300 group cursor-pointer border border-white/20 shadow-lg shadow-black/10 hover:shadow-black/20`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-200">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-jakarta text-sm leading-relaxed tracking-wider font-semibold">
                    {action.label}
                  </div>
                  <div className="font-jakarta text-xs leading-relaxed opacity-80">
                    {action.description}
                  </div>
                </div>
              </div>
            </motion.a>
          );
        })}
        </div>
      </div>
    </Card>
  );
};

export default QuickActions;
