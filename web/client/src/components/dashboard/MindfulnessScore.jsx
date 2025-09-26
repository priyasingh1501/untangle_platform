import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import axios from 'axios';
import Card from '../ui/Card';

const MindfulnessScore = () => {
  const { token } = useAuth();
  const [mindfulnessData, setMindfulnessData] = useState({
    todayScore: 0,
    weeklyAverage: 0,
    recentCheckins: [],
    trends: {},
    yearData: []
  });
  const [loading, setLoading] = useState(true);
  const [showYearView, setShowYearView] = useState(false);

  useEffect(() => {
    fetchMindfulnessData();
  }, []);

  const fetchMindfulnessData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Fetch weekly data
      const weeklyResponse = await axios.get(
        buildApiUrl(`/api/mindfulness?startDate=${weekAgo}&endDate=${today}`),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Fetch year data
      const yearResponse = await axios.get(
        buildApiUrl(`/api/mindfulness?startDate=${yearAgo}&endDate=${today}`),
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const checkins = weeklyResponse.data || [];
      const yearCheckins = yearResponse.data || [];
      
      const todayCheckin = checkins.find(c => {
        const checkinDate = new Date(c.date).toISOString().split('T')[0];
        return checkinDate === today;
      });
      const weeklyScores = checkins.map(c => c.totalScore || 0);
      const weeklyAverage = weeklyScores.length > 0 
        ? weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length 
        : 0;

      // Process year data for grid
      const yearData = generateYearGrid(yearCheckins);

      setMindfulnessData({
        todayScore: todayCheckin?.totalScore || 0,
        weeklyAverage: Math.round(weeklyAverage),
        recentCheckins: checkins.slice(-3),
        trends: {
          improving: weeklyAverage > 6,
          stable: weeklyAverage >= 4 && weeklyAverage <= 6,
          declining: weeklyAverage < 4
        },
        yearData: yearData
      });
    } catch (error) {
      console.error('Error fetching mindfulness data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate year grid data
  const generateYearGrid = (checkins) => {
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = new Date(today.getFullYear(), 11, 31);
    
    // Create a map of check-ins by date
    const checkinMap = new Map();
    checkins.forEach(checkin => {
      const date = new Date(checkin.date).toISOString().split('T')[0];
      checkinMap.set(date, checkin.totalScore || 0);
    });
    
    // Generate grid data for the current year
    const gridData = [];
    const currentDate = new Date(yearStart);
    
    while (currentDate <= yearEnd) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const score = checkinMap.get(dateStr) || 0;
      
      gridData.push({
        date: new Date(currentDate),
        dateStr: dateStr,
        score: score,
        hasData: score > 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return gridData;
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-[#1E49C9]';
    if (score >= 6) return 'text-[#3EA6FF]';
    if (score >= 4) return 'text-[#FFD200]';
    return 'text-[#D64545]';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-[#1E49C9]';
    if (score >= 6) return 'bg-[#3EA6FF]';
    if (score >= 4) return 'bg-[#FFD200]';
    return 'bg-[#D64545]';
  };

  const getYearGridColor = (score) => {
    if (score >= 8) return 'bg-[#1E49C9]';
    if (score >= 6) return 'bg-[#3EA6FF]';
    if (score >= 4) return 'bg-[#FFD200]';
    if (score > 0) return 'bg-[#D64545]';
    return 'bg-[#2A313A]';
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Attention';
  };

  const getTrendIcon = () => {
    if (mindfulnessData.trends.improving) return TrendingUp;
    return Brain;
  };

  const getTrendColor = () => {
    if (mindfulnessData.trends.improving) return 'text-[#1E49C9]';
    if (mindfulnessData.trends.stable) return 'text-[#1E49C9]';
    return 'text-[#1E49C9]';
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-[#2A313A] rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-[#2A313A] rounded"></div>
            <div className="h-4 bg-[#2A313A] rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  const TrendIcon = getTrendIcon();

  return (
    <Card>
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowYearView(!showYearView)}
          className="font-jakarta text-sm leading-relaxed tracking-wider text-[#1E49C9] hover:text-[#1E49C9]/80 font-medium flex items-center space-x-2"
        >
          <Calendar className="h-4 w-4" />
          <span>{showYearView ? 'Hide' : 'Show'} Year View</span>
        </button>
        <a 
          href="/goal-aligned-day" 
          className="font-jakarta text-sm leading-relaxed tracking-wider text-[#1E49C9] hover:text-[#1E49C9]/80 font-medium flex items-center"
        >
          CHECK IN
        </a>
      </div>

      <div className="space-y-6">
        {/* Today's Score */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreBgColor(mindfulnessData.todayScore)} bg-opacity-20 border-2 ${getScoreBgColor(mindfulnessData.todayScore)} border-opacity-30 mb-3`}>
            <span className={`text-2xl font-bold ${getScoreColor(mindfulnessData.todayScore)}`}>
              {mindfulnessData.todayScore}
            </span>
          </div>
            <div className="space-y-1">
              <div className={`font-jakarta text-2xl leading-normal font-bold ${getScoreColor(mindfulnessData.todayScore)}`}>
                {getScoreLabel(mindfulnessData.todayScore)}
              </div>
              <div className="font-jakarta text-sm leading-relaxed text-text-secondary">
                Today's Score
              </div>
            </div>
        </div>

        {/* Weekly Average */}
        <div className="bg-[#0A0C0F] border border-[#2A313A] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendIcon className={`h-4 w-4 ${getTrendColor()}`} />
              <span className="font-jakarta text-sm leading-relaxed text-text-primary font-medium">Weekly Average</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-jakarta text-lg font-bold ${getScoreColor(mindfulnessData.weeklyAverage)}`}>
                {mindfulnessData.weeklyAverage}
              </span>
              <span className="font-jakarta text-xs text-text-secondary">/10</span>
            </div>
          </div>
          <div className="mt-2 w-full bg-[#2A313A] rounded-full h-1">
            <div 
              className={`h-1 rounded-full transition-all duration-500 ${getScoreBgColor(mindfulnessData.weeklyAverage)}`}
              style={{ width: `${(mindfulnessData.weeklyAverage / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Year View Grid */}
        {showYearView && (
          <div className="space-y-4">
            <h4 className="font-jakarta text-2xl leading-normal text-text-primary font-bold tracking-wide">Year View</h4>
            <div className="bg-[#0A0C0F] border border-[#2A313A] rounded-lg p-4">
              <div className="grid grid-cols-53 gap-1 max-w-full overflow-x-auto">
                {mindfulnessData.yearData.map((day, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-sm ${getYearGridColor(day.score)} transition-all duration-200 hover:scale-125 cursor-pointer`}
                    title={`${day.date.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })} - Score: ${day.score || 'No data'}`}
                  />
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-sm bg-[#1E49C9]"></div>
                  <span className="text-[#C9D1D9]">Excellent (8-10)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-sm bg-[#3EA6FF]"></div>
                  <span className="text-[#C9D1D9]">Good (6-7)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-sm bg-[#FFD200]"></div>
                  <span className="text-[#C9D1D9]">Fair (4-5)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-sm bg-[#D64545]"></div>
                  <span className="text-[#C9D1D9]">Needs Attention (1-3)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-sm bg-[#2A313A]"></div>
                  <span className="text-[#C9D1D9]">No Data</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Check-ins */}
        {mindfulnessData.recentCheckins.length > 0 && !showYearView && (
          <div className="space-y-2">
            <h4 className="font-jakarta text-2xl leading-normal text-text-primary font-bold tracking-wide">Recent Check-ins</h4>
            <div className="space-y-2">
              {mindfulnessData.recentCheckins.map((checkin, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-[#0A0C0F] rounded border border-[#2A313A]">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getScoreBgColor(checkin.totalScore || 0)}`}></div>
                    <span className="text-sm text-[#E8EEF2]">
                      {new Date(checkin.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getScoreColor(checkin.totalScore || 0)}`}>
                      {checkin.totalScore || 0}
                    </span>
                    <span className="text-xs text-[#C9D1D9]">/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {mindfulnessData.todayScore === 0 && mindfulnessData.recentCheckins.length === 0 && (
          <div className="text-center py-4">
            <Brain className="h-8 w-8 text-[#C9D1D9] mx-auto mb-2" />
            <p className="font-jakarta text-sm text-text-secondary mb-3">No mindfulness data yet</p>
            <a 
              href="/goal-aligned-day" 
              className="font-jakarta text-xs text-[#1E49C9] hover:text-[#1E49C9]/80 leading-relaxed tracking-wider"
            >
              START CHECKING IN
            </a>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MindfulnessScore;
