import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, CheckCircle, Clock, Sparkles } from 'lucide-react';
import MoonPhaseSlider from '../ui/MoonPhaseSlider';
import MindfulnessGlass from '../ui/MindfulnessGlass';
import { Card, Button } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import axios from 'axios';
import toast from 'react-hot-toast';

const MindfulnessCheckin = ({ 
  onCheckinComplete, 
  goals = [], 
  getTodayTasksForGoal = () => [], 
  getActivitiesForGoal = () => [], 
  getTodayHoursForGoal = () => 0,
  onSaveStateChange = () => {}
}) => {
  const { token } = useAuth();

  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState(null);
  
  // Date selection state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mindfulness dimensions state
  const [dimensions, setDimensions] = useState({
    presence: { rating: 0 },
    emotionAwareness: { rating: 0 },
    intentionality: { rating: 0 },
    attentionQuality: { rating: 0 },
    compassion: { rating: 0 }
  });

  const [dayReflection, setDayReflection] = useState('');

  const [dailyNotes, setDailyNotes] = useState('');

  // Manual save state
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Calculate total score
  const totalScore = Object.values(dimensions).reduce((sum, dim) => sum + dim.rating, 0);


  // Check if user has already checked in on the selected date
  const checkDateCheckin = useCallback(async (date) => {
    try {
      console.log('Checking for existing check-in on date:', date);
      const response = await axios.get(`${buildApiUrl('/api/mindfulness/date')}/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setHasCheckedInToday(true);
        setTodayCheckin(response.data);
        // Load existing data
        setDimensions(response.data.dimensions);
        setDailyNotes(response.data.dailyNotes || '');
        setDayReflection(response.data.dayReflection || '');
        console.log('Found existing check-in for date:', date);
      } else {
        setHasCheckedInToday(false);
        setTodayCheckin(null);
        // Reset to default values for new check-in
        setDimensions({
          presence: { rating: 0 },
          emotionAwareness: { rating: 0 },
          intentionality: { rating: 0 },
          attentionQuality: { rating: 0 },
          compassion: { rating: 0 }
        });
        setDailyNotes('');
        setDayReflection('');
        console.log('No existing check-in found for date:', date);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error checking check-in for date:', date, error);
      } else {
        // 404 means no check-in exists, which is fine
        setHasCheckedInToday(false);
        setTodayCheckin(null);
        // Reset to default values for new check-in
        setDimensions({
          presence: { rating: 0 },
          emotionAwareness: { rating: 0 },
          intentionality: { rating: 0 },
          attentionQuality: { rating: 0 },
          compassion: { rating: 0 }
        });
        setDailyNotes('');
        setDayReflection('');
        console.log('No existing check-in found for date:', date);
      }
    }
  }, [token]);

  // Check if user has already checked in today
  useEffect(() => {
    checkDateCheckin(selectedDate);
  }, [selectedDate, checkDateCheckin]);



  // Manual save function
  const saveCheckin = useCallback(async () => {
    console.log('Manual save triggered');
    console.log('=== VALIDATION DEBUG ===');
    console.log('Current dimensions state:', dimensions);
    console.log('Individual ratings:');
    Object.entries(dimensions).forEach(([key, value]) => {
      console.log(`  ${key}: ${value.rating} (type: ${typeof value.rating})`);
    });
    
    // Validate selected date is not in the future
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('🔍 Date validation:');
    console.log('🔍 Selected date:', selectedDate);
    console.log('🔍 Today string:', todayStr);
    console.log('🔍 Is future date?', selectedDate > todayStr);
    
    if (selectedDate > todayStr) {
      alert('Cannot create mindfulness check-ins for future dates. Please select today or a past date.');
      return;
    }
    
    // Check if all dimensions are rated (model requirement)
    const unratedDimensions = Object.values(dimensions).filter(dim => dim.rating === 0);
    console.log('Unrated dimensions count:', unratedDimensions.length);
    console.log('Unrated dimensions:', unratedDimensions);
    
    if (unratedDimensions.length > 0) {
      const unratedNames = Object.keys(dimensions).filter(key => dimensions[key].rating === 0);
      console.log('Validation failed - unrated dimensions found:', unratedNames);
      alert(`Please rate ALL mindfulness dimensions before saving:\n\nMissing ratings for: ${unratedNames.join(', ')}\n\nEach dimension must have a rating from 1-5.`);
      return;
    }
    
    console.log('Validation passed - all dimensions rated');
    
    // Validate that all ratings are between 1-5
    const invalidRatings = Object.values(dimensions).filter(dim => dim.rating < 1 || dim.rating > 5);
    console.log('Invalid ratings:', invalidRatings);
    
    if (invalidRatings.length > 0) {
      alert('All mindfulness ratings must be between 1 and 5.');
      return;
    }
    
    // Calculate total score and overall assessment (server expects these)
    const ratings = [
      parseInt(dimensions.presence.rating),
      parseInt(dimensions.emotionAwareness.rating),
      parseInt(dimensions.intentionality.rating),
      parseInt(dimensions.attentionQuality.rating),
      parseInt(dimensions.compassion.rating)
    ];
    
    const totalScore = ratings.reduce((sum, rating) => sum + rating, 0);
    
    let overallAssessment;
    if (totalScore >= 20) {
      overallAssessment = 'master';
    } else if (totalScore >= 17) {
      overallAssessment = 'advanced';
    } else if (totalScore >= 14) {
      overallAssessment = 'intermediate';
    } else if (totalScore >= 11) {
      overallAssessment = 'developing';
    } else {
      overallAssessment = 'beginner';
    }
    
    // Create validated data with all required fields
    const validatedData = {
      date: selectedDate, // Include the selected date
      dimensions: {
        presence: { rating: parseInt(dimensions.presence.rating) },
        emotionAwareness: { rating: parseInt(dimensions.emotionAwareness.rating) },
        intentionality: { rating: parseInt(dimensions.intentionality.rating) },
        attentionQuality: { rating: parseInt(dimensions.attentionQuality.rating) },
        compassion: { rating: parseInt(dimensions.compassion.rating) }
      },
      totalScore,
      overallAssessment,
      dailyNotes: dailyNotes || '',
      dayReflection: dayReflection || ''
    };
    
    console.log('Validated data for save:', validatedData);
    console.log('Raw dimensions state:', dimensions);
    console.log('Data being sent to server:', JSON.stringify(validatedData, null, 2));
    console.log('About to make API call...');

    setSaving(true);
    console.log('Starting save...');
    
    try {
      console.log('Has checked in today:', hasCheckedInToday);
      console.log('Today checkin:', todayCheckin);

      if (hasCheckedInToday && todayCheckin) {
        // Update existing check-in
        console.log('Updating existing check-in:', todayCheckin._id);
        const response = await axios.put(`${buildApiUrl('/api/mindfulness')}/${todayCheckin._id}`, validatedData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Update response:', response.data);
      } else {
        // Create new check-in
        console.log('Creating new check-in');
        console.log('Sending data to server:', validatedData);
        console.log('🔍 API URL:', buildApiUrl('/api/mindfulness'));
        console.log('🔍 Token present:', !!token);
        
        try {
          const response = await axios.post(`${buildApiUrl('/api/mindfulness')}`, validatedData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('Create response:', response.data);
          setHasCheckedInToday(true);
          setTodayCheckin(response.data.checkin);
        } catch (postError) {
          console.error('POST request failed:', postError);
          console.error('POST error response:', postError.response?.data);
          throw postError; // Re-throw to be caught by outer catch
        }
      }

      setLastSaved(new Date());
      console.log('Save completed successfully');
      
      // Show success toast
      toast.success('Check-in recorded! ✨', {
        duration: 3000,
        style: {
          background: 'rgba(0,0,0,0.8)',
          color: '#1E49C9',
          border: '1px solid rgba(60, 203, 127, 0.3)',
          borderRadius: '12px',
          backdropFilter: 'blur(16px)',
        },
      });
      
      if (onCheckinComplete) {
        onCheckinComplete();
      }
    } catch (error) {
      console.error('Error saving mindfulness check-in:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      // Show more detailed error info for debugging
      if (error.response?.status === 500) {
        console.error('Server error - check server logs for details');
      } else if (error.response?.status === 404) {
        console.error('Endpoint not found - check API route');
      }
      
      // Don't show error toast for auto-save to avoid spam
    } finally {
      setSaving(false);
      console.log('Save finished');
    }
  }, [hasCheckedInToday, todayCheckin, token, onCheckinComplete, dimensions, dailyNotes, dayReflection, selectedDate]);


  const handleDimensionChange = (dimension, rating) => {
    console.log('Dimension change:', dimension, 'rating:', rating);
    
    const newDimensions = {
      ...dimensions,
      [dimension]: {
        ...dimensions[dimension],
        rating
      }
    };
    
    console.log('New dimensions:', newDimensions);
    setDimensions(newDimensions);
  };





  const isFormComplete = Object.values(dimensions).every(dim => dim.rating > 0);
  
  // Get count of rated dimensions
  const ratedDimensionsCount = Object.values(dimensions).filter(dim => dim.rating > 0).length;
  const totalDimensions = Object.keys(dimensions).length;

  // Notify parent about save state changes
  useEffect(() => {
    onSaveStateChange({
      saveCheckin,
      saving,
      ratedDimensionsCount,
      totalDimensions,
      canSave: ratedDimensionsCount >= totalDimensions
    });
  }, [saveCheckin, saving, ratedDimensionsCount, totalDimensions, onSaveStateChange]);

  return (
    <div className="space-y-4 p-4 lg:p-0">
      {/* Date Selector */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="text-[#1E49C9]" size={20} />
            <div>
              <label htmlFor="checkin-date" className="block text-sm font-medium text-[#94A3B8] mb-1">
                Mindfulness Check-in Date
              </label>
              <input
                type="date"
                id="checkin-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#11151A] border border-[#2A313A] rounded-lg px-3 py-2 text-[#E8EEF2] focus:outline-none focus:ring-2 focus:ring-[#1E49C9] focus:border-transparent min-h-[44px]"
                max={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
            </div>
          </div>
          
          <div className="text-center lg:text-right">
            <div className="text-sm text-[#94A3B8]">Selected Date</div>
            <div className="text-base lg:text-lg font-semibold text-[#E8EEF2]">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Status Message */}
      {hasCheckedInToday && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#1E49C9]/20 border border-[#1E49C9] rounded-full px-3 py-1">
            <CheckCircle className="text-[#1E49C9]" size={14} />
            <span className="text-[#1E49C9] text-xs font-medium">
              Already checked in for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      )}

      {/* Mindfulness Level and Dimensions Section - 12 Column Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Total Mindfulness Level + Goal Progress + Day Reflection (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Total Mindfulness Level */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[#E8EEF2] mb-4 font-oswald tracking-wide">
                Total Mindfulness Level
              </h3>
              <div className="flex justify-center">
                <MindfulnessGlass totalScore={totalScore} />
              </div>
            </div>
          </Card>

          {/* Goal Progress */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[#E8EEF2] mb-4 font-oswald tracking-wide">
                Goal Progress
              </h3>
              <div className="space-y-4">
                {goals && goals.length > 0 ? (
                  goals.slice(0, 3).map((goal, index) => {
                    const goalTasks = getTodayTasksForGoal(goal._id);
                    const goalActivities = getActivitiesForGoal(goal._id);
                    const todayHours = getTodayHoursForGoal(goal._id);
                    const progressPercentage = Math.min((todayHours / (goal.targetHours || 1)) * 100, 100);
                    
                    return (
                      <div key={goal._id || index} className="bg-[#11151A]/50 rounded-lg p-4 border border-[#2A313A]">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-[#E8EEF2] truncate">
                            {goal.name}
                          </h4>
                          <span className="text-xs text-[#94A3B8]">
                            {Math.round(todayHours * 10) / 10}h / {goal.targetHours || 0}h
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-[#2A313A] rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-to-r from-[#1E49C9] to-[#1E49C9] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                          <span>{goalActivities.length} activities</span>
                          <span className={`${goal.isActive ? 'text-[#1E49C9]' : 'text-[#94A3B8]'}`}>
                            {goal.isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-[#94A3B8]">No goals found</p>
                    <p className="text-xs text-[#6B7280] mt-1">Create goals to track progress</p>
                  </div>
                )}
                
                {goals && goals.length > 3 && (
                  <div className="text-center">
                    <p className="text-xs text-[#94A3B8]">+{goals.length - 3} more goals</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Day Reflection */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-[#E8EEF2] font-oswald tracking-wide">
                  Day Reflection
                </label>
                <span className="text-xs text-[#94A3B8]">
                  {dayReflection.length}/500 characters
                </span>
              </div>
              <textarea
                value={dayReflection}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setDayReflection(newValue);
                }}
                placeholder="Reflect on today… What stood out? What did you learn?"
                maxLength={500}
                className="w-full h-32 px-4 py-3 bg-[#1E2330] border border-[#2A313A] rounded-lg text-[#E8EEF2] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E49C9] focus:border-transparent resize-none"
                rows="4"
              />
              <p className="text-xs text-[#94A3B8] mt-2">Optional</p>
            </div>
          </Card>
        </div>

        {/* Right Column - Dimension Questions + Bioluminescent Dots (8 cols) */}
        <div className="col-span-12 lg:col-span-8">
          <div className="space-y-8 flex flex-col items-center">
            {/* Presence */}
            <MoonPhaseSlider
              value={dimensions.presence.rating}
              onChange={(rating) => handleDimensionChange('presence', rating)}
              dimension="presence"
            />

            {/* Emotion Awareness */}
            <MoonPhaseSlider
              value={dimensions.emotionAwareness.rating}
              onChange={(rating) => handleDimensionChange('emotionAwareness', rating)}
              dimension="emotionAwareness"
            />

            {/* Intentionality */}
            <MoonPhaseSlider
              value={dimensions.intentionality.rating}
              onChange={(rating) => handleDimensionChange('intentionality', rating)}
              dimension="intentionality"
            />

            {/* Attention Quality */}
            <MoonPhaseSlider
              value={dimensions.attentionQuality.rating}
              onChange={(rating) => handleDimensionChange('attentionQuality', rating)}
              dimension="attentionQuality"
            />

            {/* Compassion */}
            <MoonPhaseSlider
              value={dimensions.compassion.rating}
              onChange={(rating) => handleDimensionChange('compassion', rating)}
              dimension="compassion"
            />
          </div>
        </div>
      </div>

      

      


    </div>
  );
};

export default MindfulnessCheckin;
