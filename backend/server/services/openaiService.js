const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate insights based on user data
   * @param {Object} userData - User's data (tasks, journal, finance, etc.)
   * @param {Array} conversationHistory - Recent conversation history
   * @returns {String} Generated insights
   */
  async generateInsights(userData, conversationHistory = []) {
    try {
      const prompt = this.buildInsightPrompt(userData, conversationHistory);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a lifestyle optimization expert. Analyze user data and provide actionable insights and recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  /**
   * Analyze meal effects using AI for more accurate scoring and explanations
   * @param {Object} mealData - Meal data including items, nutrients, context
   * @param {Object} userProfile - User profile information
   * @param {Object} ruleBasedEffects - Current rule-based effect scores
   * @returns {Object} Enhanced effect analysis with AI insights
   */
  async analyzeMealEffects(mealData, userProfile, ruleBasedEffects) {
    try {
      const prompt = this.buildMealAnalysisPrompt(mealData, userProfile, ruleBasedEffects);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition and health expert specializing in meal analysis. Analyze the provided meal data and provide accurate health effect scores (0-10) with detailed explanations.

Your analysis should consider:
1. Individual food items and their nutritional profiles
2. Food combinations and their synergistic effects
3. Meal timing and context factors
4. User's health profile and goals
5. Cooking methods and processing levels
6. Cultural and dietary patterns

Provide scores for these health effects:
- fatForming: How much this meal promotes fat storage (0=very low, 10=very high)
- strength: How much this meal supports muscle building (0=very low, 10=very high)
- immunity: How much this meal supports immune function (0=very low, 10=very high)
- inflammation: How much this meal promotes inflammation (0=very low, 10=very high)
- antiInflammatory: How much this meal reduces inflammation (0=very low, 10=very high)
- energizing: How much this meal provides sustained energy (0=very low, 10=very high)
- gutFriendly: How much this meal supports gut health (0=very low, 10=very high)
- moodLifting: How much this meal supports positive mood (0=very low, 10=very high)

For each effect, provide:
- score: Number from 0-10
- label: Text description (e.g., "Very Low", "Low", "Medium", "High", "Very High")
- why: Array of specific reasons explaining the score
- aiInsights: Additional AI-generated insights about the meal

Be precise, evidence-based, and consider the user's individual context.

IMPORTANT: Return your response as valid JSON in this exact format:
{
  "fatForming": {
    "score": 0-10,
    "label": "Very Low/Low/Medium/High/Very High",
    "why": ["reason1", "reason2"],
    "aiInsights": "AI insight about this effect"
  },
  "strength": {
    "score": 0-10,
    "label": "Very Low/Low/Medium/High/Very High", 
    "why": ["reason1", "reason2"],
    "aiInsights": "AI insight about this effect"
  },
  // ... repeat for all effects
  "aiInsights": "Overall AI insights about this meal"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent scoring
        max_tokens: 1500
      });

      const aiResponse = response.choices[0].message.content;
      return this.parseMealAnalysisResponse(aiResponse, ruleBasedEffects);
    } catch (error) {
      console.error('Error in AI meal analysis:', error);
      // Fallback to rule-based effects if AI fails
      return ruleBasedEffects;
    }
  }

  buildMealAnalysisPrompt(mealData, userProfile, ruleBasedEffects) {
    let prompt = 'Analyze this meal for health effects:\n\n';
    
    // Meal items
    prompt += 'MEAL ITEMS:\n';
    mealData.items.forEach((item, index) => {
      prompt += `${index + 1}. ${item.customName} (${item.grams}g)\n`;
    });
    
    // Nutritional totals
    if (mealData.computed?.totals) {
      prompt += '\nNUTRITIONAL TOTALS:\n';
      const totals = mealData.computed.totals;
      prompt += `- Calories: ${totals.kcal || 0} kcal\n`;
      prompt += `- Protein: ${totals.protein || 0}g\n`;
      prompt += `- Carbs: ${totals.carbs || 0}g\n`;
      prompt += `- Fat: ${totals.fat || 0}g\n`;
      prompt += `- Fiber: ${totals.fiber || 0}g\n`;
      prompt += `- Sugar: ${totals.sugar || 0}g\n`;
      prompt += `- Vitamin C: ${totals.vitaminC || 0}mg\n`;
      prompt += `- Iron: ${totals.iron || 0}mg\n`;
      prompt += `- Omega-3: ${totals.omega3 || 0}g\n`;
    }
    
    // Meal context
    if (mealData.context) {
      prompt += '\nMEAL CONTEXT:\n';
      const context = mealData.context;
      if (context.lateNightEating) prompt += '- Late night eating\n';
      if (context.sedentaryAfterMeal) prompt += '- Sedentary after meal\n';
      if (context.stressEating) prompt += '- Stress eating\n';
      if (context.packagedStoredLong) prompt += '- Packaged/stored long\n';
      if (context.mindlessEating) prompt += '- Mindless eating\n';
      if (context.plantDiversity) prompt += `- Plant diversity: ${context.plantDiversity} types\n`;
      if (context.fermented) prompt += '- Contains fermented foods\n';
    }
    
    // User profile
    if (userProfile) {
      prompt += '\nUSER PROFILE:\n';
      if (userProfile.age) prompt += `- Age: ${userProfile.age}\n`;
      if (userProfile.activityLevel) prompt += `- Activity Level: ${userProfile.activityLevel}\n`;
      if (userProfile.healthGoals) prompt += `- Health Goals: ${userProfile.healthGoals}\n`;
      if (userProfile.medicalConditions) prompt += `- Medical Conditions: ${userProfile.medicalConditions.join(', ')}\n`;
    }
    
    // Current rule-based scores for reference
    prompt += '\nCURRENT RULE-BASED SCORES:\n';
    Object.entries(ruleBasedEffects).forEach(([effect, data]) => {
      prompt += `- ${effect}: ${data.score || 0}/10 (${data.label || 'N/A'})\n`;
    });
    
    prompt += '\nPlease provide enhanced analysis with more accurate scores and detailed explanations.';
    
    return prompt;
  }

  parseMealAnalysisResponse(aiResponse, ruleBasedEffects) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Merge with rule-based effects, preserving individual effect structures
        const enhancedEffects = { ...ruleBasedEffects };
        
        // Update each effect with AI data if available
        Object.keys(ruleBasedEffects).forEach(effectKey => {
          if (parsed[effectKey]) {
            enhancedEffects[effectKey] = {
              ...ruleBasedEffects[effectKey],
              ...parsed[effectKey],
              aiEnhanced: true
            };
          }
        });
        
        // Add general AI insights if available
        if (parsed.aiInsights) {
          enhancedEffects.aiInsights = parsed.aiInsights;
        }
        
        return {
          ...enhancedEffects,
          aiEnhanced: true,
          aiResponse: aiResponse
        };
      }
      
      // If no JSON found, return rule-based with AI insights
      return {
        ...ruleBasedEffects,
        aiInsights: aiResponse,
        aiEnhanced: true
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        ...ruleBasedEffects,
        aiInsights: aiResponse,
        aiEnhanced: true
      };
    }
  }

  buildInsightPrompt(userData, conversationHistory) {
    let prompt = 'Analyze the following user data and provide insights:\n\n';
    
    if (userData.tasks) {
      prompt += `Task Analysis:\n`;
      prompt += `- Total Tasks: ${userData.tasks.length}\n`;
      prompt += `- Completed: ${userData.tasks.filter(t => t.status === 'completed').length}\n`;
      prompt += `- Pending: ${userData.tasks.filter(t => t.status === 'pending').length}\n`;
    }

    if (userData.journal) {
      prompt += `\nJournal Patterns:\n`;
      prompt += `- Total Entries: ${userData.journal.entries?.length || 0}\n`;
      prompt += `- Current Streak: ${userData.journal.stats?.currentStreak || 0} days\n`;
    }

    if (userData.finance) {
      prompt += `\nFinancial Overview:\n`;
      prompt += `- Total Expenses: ${userData.finance.expenses?.length || 0}\n`;
    }

    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `\nRecent Conversation Topics:\n`;
      const topics = conversationHistory
        .filter(msg => msg.role === 'user')
        .slice(-5)
        .map(msg => msg.content.substring(0, 100) + '...');
      topics.forEach((topic, i) => {
        prompt += `${i + 1}. ${topic}\n`;
      });
    }

    prompt += '\nPlease provide:\n1. Key insights about user patterns\n2. 3-5 actionable recommendations\n3. Areas for improvement\n4. Positive trends to celebrate';

    return prompt;
  }
}

module.exports = OpenAIService;