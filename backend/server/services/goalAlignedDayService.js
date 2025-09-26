const Task = require('../models/Task');
const { TimeBlock } = require('../models/TimeManagement');
const HabitCheckin = require('../models/HabitCheckin');
const GoalAlignedDay = require('../models/GoalAlignedDay');
const LifestyleGoal = require('../models/Goal');

class GoalAlignedDayService {
  /**
   * Calculate goal-aligned day metrics for a specific date
   */
  static async calculateDailyMetrics(userId, date = new Date()) {
    try {
      console.log('🔍 calculateDailyMetrics called for user:', userId, 'at', new Date().toISOString());
      // Convert date to IST and get day boundaries
      const istDate = new Date(date);
      // Create IST day boundaries (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
      const todayStart = new Date(istDate.getTime() + istOffset);
      todayStart.setUTCHours(0, 0, 0, 0);
      todayStart.setTime(todayStart.getTime() - istOffset);
      
      const todayEnd = new Date(istDate.getTime() + istOffset);
      todayEnd.setUTCHours(23, 59, 59, 999);
      todayEnd.setTime(todayEnd.getTime() - istOffset);
      
      // Debug: Log the date boundaries
      console.log('🔍 Date boundaries debug:', {
        inputDate: date,
        istDate: istDate,
        todayStart: todayStart,
        todayEnd: todayEnd,
        todayStartISO: todayStart.toISOString(),
        todayEndISO: todayEnd.toISOString()
      });

      // Get all active goals for the user
      const goals = await LifestyleGoal.find({ userId, isActive: true });
      const goalMap = new Map(goals.map(g => [g._id.toString(), g]));

      // 1. Goal-aligned task count (including habits)
      const tasksGoalAligned = await Task.countDocuments({
        userId,
        completedAt: { $gte: todayStart, $lte: todayEnd },
        goalIds: { $exists: true, $ne: [] }
      });
      
      // Debug: Let's see what tasks are actually found
      const allTasksToday = await Task.find({
        userId,
        completedAt: { $gte: todayStart, $lte: todayEnd }
      });
      
      console.log('🔍 Task debugging:', {
        tasksGoalAligned,
        allTasksToday: allTasksToday.length,
        taskDetails: allTasksToday.map(t => ({
          id: t._id,
          title: t.title,
          goalIds: t.goalIds,
          hasGoalIds: t.goalIds && t.goalIds.length > 0,
          completedAt: t.completedAt
        }))
      });

      // 2. Time from goal-tagged blocks (legacy support)
      // Query blocks that have goalId and fall within the day range
      const timeBlocks = await TimeBlock.find({
        userId,
        $or: [
          { date: { $gte: todayStart, $lte: todayEnd } },
          { 'blocks.startTime': { $exists: true } }
        ]
      });

      let blockMinutes = 0;
      const blockTaskIds = new Set();
      const blockGoalMinutes = new Map();
      
      timeBlocks.forEach(block => {
        block.blocks.forEach(timeBlock => {
          if (timeBlock.goalId && timeBlock.duration) {
            blockMinutes += timeBlock.duration;
            if (timeBlock.taskId) {
              blockTaskIds.add(timeBlock.taskId.toString());
            }
            // Track goal minutes from blocks
            const goalIdStr = timeBlock.goalId.toString();
            blockGoalMinutes.set(goalIdStr, (blockGoalMinutes.get(goalIdStr) || 0) + timeBlock.duration);
          }
        });
      });

      // 3. Habit check-ins from embedded habit documents
      const habits = await require('../models/Habit').find({
        userId,
        isActive: true,
        goalId: { $exists: true, $ne: null }
      });

      let habitMinutes = 0;
      const habitGoalMinutes = new Map();
      const processedCheckins = new Set(); // Track processed check-ins to avoid double counting
      
      habits.forEach(habit => {
        if (habit.goalId && habit.checkins && Array.isArray(habit.checkins)) {
          habit.checkins.forEach(checkin => {
            const checkinDate = new Date(checkin.date);
            const checkinKey = `${habit._id}-${checkinDate.toISOString()}-${checkin.completed}`;
            
            // Skip if this check-in has already been processed
            if (processedCheckins.has(checkinKey)) {
              return;
            }
            
            if (checkinDate >= todayStart && checkinDate <= todayEnd && checkin.completed) {
              const duration = checkin.duration || habit.valueMin || 0;
              const previousHabitMinutes = habitMinutes;
              habitMinutes += duration;
              const goalIdStr = habit.goalId.toString();
              habitGoalMinutes.set(goalIdStr, (habitGoalMinutes.get(goalIdStr) || 0) + duration);
              processedCheckins.add(checkinKey);
              
              console.log('🔍 Habit checkin processed:', {
                habitId: habit._id,
                habitName: habit.habit,
                checkinDate: checkinDate,
                duration: duration,
                previousHabitMinutes: previousHabitMinutes,
                currentHabitMinutes: habitMinutes,
                addedMinutes: duration,
                currentHabitGoalMinutes: Object.fromEntries(habitGoalMinutes),
                checkinKey: checkinKey
              });
            }
          });
        }
      });

      // Debug: Let's see what habit check-ins are found
      console.log('🔍 Habit check-ins debugging:', {
        habitsCount: habits.length,
        habitMinutes,
        habitGoalMinutes: Object.fromEntries(habitGoalMinutes),
        processedCheckinsCount: processedCheckins.size,
        habitDetails: habits.map(h => ({
          id: h._id,
          name: h.habit,
          goalId: h.goalId,
          checkinsCount: h.checkins ? h.checkins.length : 0,
          checkins: h.checkins ? h.checkins.map(c => ({
            date: c.date,
            completed: c.completed,
            duration: c.duration
          })) : []
        }))
      });

      // 4. Task minutes (unified model - tasks and habits)
      const completedTasks = await Task.find({
        userId,
        completedAt: { $gte: todayStart, $lte: todayEnd },
        goalIds: { $exists: true, $ne: [] }
      });

      // Debug: Let's see what completed tasks are found
      console.log('🔍 Completed tasks debugging:', {
        completedTasksCount: completedTasks.length,
        taskDetails: completedTasks.map(t => ({
          id: t._id,
          title: t.title,
          goalIds: t.goalIds,
          completedAt: t.completedAt,
          estimatedDuration: t.estimatedDuration,
          actualDuration: t.actualDuration,
          status: t.status
        }))
      });

      let taskMinutes = 0;
      const goalTaskMinutes = new Map();
      const mindfulTasks = [];
      const mindfulMinutesFromTasks = new Map(); // Track mindful minutes per goal

      completedTasks.forEach(task => {
        // Skip if task has a linked time block (avoid double counting)
        if (blockTaskIds.has(task._id.toString())) {
          return;
        }

        // Calculate task duration using the new virtual
        const taskDuration = task.durationMinutes || 25;

        taskMinutes += taskDuration;

        // Track mindful tasks and minutes
        if (task.mindfulRating >= 4) {
          mindfulTasks.push(task);
        }

        // Distribute minutes across goals (evenly split)
        if (task.goalIds && task.goalIds.length > 0) {
          const minutesPerGoal = taskDuration / task.goalIds.length;
          task.goalIds.forEach(goalId => {
            const goalIdStr = goalId.toString();
            goalTaskMinutes.set(goalIdStr, (goalTaskMinutes.get(goalIdStr) || 0) + minutesPerGoal);
            
            // Track mindful minutes per goal (avoid double counting with blocks)
            if (task.mindfulRating >= 4) {
              mindfulMinutesFromTasks.set(goalIdStr, (mindfulMinutesFromTasks.get(goalIdStr) || 0) + minutesPerGoal);
            }
          });
        }
      });

      console.log('🔍 Task minutes calculated:', taskMinutes);
      console.log('🔍 Task goal minutes map:', Object.fromEntries(goalTaskMinutes));

      // Calculate total goal-aligned minutes
      const totalGoalAlignedMinutes = blockMinutes + habitMinutes + taskMinutes;
      
      // Clamp to 24 hours (1440 minutes)
      const clampedMinutes = Math.min(totalGoalAlignedMinutes, 1440);
      
      // Calculate mindfulness metrics (avoid double counting)
      const mindfulMinutes = mindfulTasks.reduce((total, task) => {
        // Only count mindful minutes from tasks that don't have linked time blocks
        if (blockTaskIds.has(task._id.toString())) {
          return total;
        }
        return total + (task.durationMinutes || 25);
      }, 0);
      
      const averageMindfulRating = completedTasks.length > 0 
        ? Math.round((completedTasks.reduce((sum, task) => sum + (task.mindfulRating || 3), 0) / completedTasks.length) * 10) / 10
        : 0;
      
      // Calculate scores
      // score24: Convert minutes to hours, capped at 24 (e.g., 120 minutes = 2.0 hours, 1500 minutes = 24.0 hours)
      const score24 = Math.min(24, Math.round((clampedMinutes / 60) * 10) / 10);
      // scorePercentage: What percentage of 24 hours did we achieve (e.g., 2 hours = 8.33%, 24 hours = 100%)
      const scorePercentage = clampedMinutes > 0 ? Math.round((score24 / 24) * 100 * 10) / 10 : 0;
      
      // Debug logging for score calculation
      console.log('🔍 Score calculation debug:', {
        blockMinutes,
        habitMinutes,
        taskMinutes,
        totalGoalAlignedMinutes,
        clampedMinutes,
        score24,
        scorePercentage,
        calculation: {
          rawHours: clampedMinutes / 60,
          roundedHours: Math.round((clampedMinutes / 60) * 10) / 10,
          percentage: (clampedMinutes / 60) / 24 * 100
        }
      });

      // Build goal breakdown
      const goalBreakdown = [];
      const goalMinutes = new Map();

      // Add block minutes to goals
      blockGoalMinutes.forEach((minutes, goalIdStr) => {
        goalMinutes.set(goalIdStr, (goalMinutes.get(goalIdStr) || 0) + minutes);
      });

      // Add habit minutes to goals
      habitGoalMinutes.forEach((minutes, goalIdStr) => {
        goalMinutes.set(goalIdStr, (goalMinutes.get(goalIdStr) || 0) + minutes);
      });

      // Add task minutes to goals
      goalTaskMinutes.forEach((minutes, goalIdStr) => {
        goalMinutes.set(goalIdStr, (goalMinutes.get(goalIdStr) || 0) + minutes);
      });

      // Create breakdown array
      goalMinutes.forEach((minutes, goalIdStr) => {
        const goal = goalMap.get(goalIdStr);
        if (goal) {
          goalBreakdown.push({
            goalId: goal._id,
            goalName: goal.name,
            goalColor: goal.color,
            minutes: Math.round(minutes),
            percentage: clampedMinutes > 0 ? Math.round((minutes / clampedMinutes) * 100) : 0
          });
        }
      });

      // Sort breakdown by minutes (descending)
      goalBreakdown.sort((a, b) => b.minutes - a.minutes);

      console.log('🔍 Final total minutes:', totalGoalAlignedMinutes);
      console.log('🔍 Final goal minutes map:', Object.fromEntries(goalMinutes));
      console.log('🔍 Goal breakdown:', goalBreakdown);

      // Get or create today's record
      let todayRecord = await GoalAlignedDay.findOne({ userId, date: { $gte: todayStart, $lte: todayEnd } });
      
      if (!todayRecord) {
        todayRecord = new GoalAlignedDay({
          userId,
          date: istDate,
          targetHours: 8 // Default target
        });
      }

      // Update record with validated scores
      todayRecord.tasksGoalAligned = tasksGoalAligned;
      todayRecord.blockMinutes = blockMinutes;
      todayRecord.habitMinutes = habitMinutes;
      todayRecord.taskMinutes = taskMinutes;
      todayRecord.totalGoalAlignedMinutes = clampedMinutes;
      todayRecord.score24 = Math.max(0, Math.min(24, score24)); // Ensure 0-24 range
      todayRecord.scorePercentage = Math.max(0, Math.min(100, scorePercentage)); // Ensure 0-100 range
      todayRecord.goalBreakdown = goalBreakdown;
      todayRecord.mindfulTasks = mindfulTasks.length;
      todayRecord.mindfulMinutes = mindfulMinutes;
      todayRecord.averageMindfulRating = Math.max(1, Math.min(5, averageMindfulRating)); // Ensure 1-5 range

      // Update streak
      todayRecord.updateStreak();
      
      await todayRecord.save();

      return {
        tasksGoalAligned,
        blockMinutes,
        habitMinutes,
        taskMinutes,
        totalGoalAlignedMinutes: clampedMinutes,
        score24: Math.max(0, Math.min(24, score24)), // Ensure 0-24 range
        scorePercentage: Math.max(0, Math.min(100, scorePercentage)), // Ensure 0-100 range
        goalBreakdown,
        mindfulTasks: mindfulTasks.length,
        mindfulMinutes,
        averageMindfulRating: Math.max(1, Math.min(5, averageMindfulRating)), // Ensure 1-5 range
        currentStreak: todayRecord.currentStreak,
        longestStreak: todayRecord.longestStreak
      };

    } catch (error) {
      console.error('Error calculating daily metrics:', error);
      throw error;
    }
  }

  /**
   * Get streak information for a user
   */
  static async getStreakInfo(userId) {
    try {
      const streakInfo = await GoalAlignedDay.findOne({ userId }).sort({ date: -1 });
      return streakInfo || { currentStreak: 0, longestStreak: 0, targetHours: 8 };
    } catch (error) {
      console.error('Error getting streak info:', error);
      throw error;
    }
  }

  /**
   * Get weekly summary for goal alignment
   */
  static async getWeeklySummary(userId, startDate = new Date()) {
    try {
      // Create IST week boundaries
      const istOffset = 5.5 * 60 * 60 * 1000;
      const weekStart = new Date(startDate.getTime() + istOffset);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      weekStart.setUTCHours(0, 0, 0, 0);
      weekStart.setTime(weekStart.getTime() - istOffset);

      const weekEnd = new Date(weekStart.getTime() + istOffset);
      weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
      weekEnd.setUTCHours(23, 59, 59, 999);
      weekEnd.setTime(weekEnd.getTime() - istOffset);

      const weeklyData = await GoalAlignedDay.find({
        userId,
        date: { $gte: weekStart, $lte: weekEnd }
      }).sort({ date: 1 });

      return weeklyData.map(day => ({
        date: day.date,
        score24: day.score24,
        scorePercentage: day.scorePercentage,
        totalMinutes: day.totalGoalAlignedMinutes
      }));
    } catch (error) {
      console.error('Error getting weekly summary:', error);
      throw error;
    }
  }
}

module.exports = GoalAlignedDayService;
