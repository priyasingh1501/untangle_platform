const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-test-key-for-development') {
        console.warn('⚠️ OpenAI API key not configured or is test key');
        this.openai = null;
        return;
      }
      
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      console.log('✅ OpenAI client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI client:', error.message);
      this.openai = null;
    }
  }

  /**
   * Generate insights based on user data
   * @param {Object} userData - User's data (tasks, journal, finance, etc.)
   * @param {Array} conversationHistory - Recent conversation history
   * @returns {String} Generated insights
   */
  async generateInsights(userData, conversationHistory = []) {
    if (!this.openai) {
      console.warn('⚠️ OpenAI not available, returning fallback insights');
      return 'I\'m currently unable to generate AI insights. Please try again later.';
    }
    
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
    if (!this.openai) {
      console.warn('⚠️ OpenAI not available, returning rule-based effects');
      return ruleBasedEffects;
    }
    
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

  /**
   * Analyze unknown food item using AI to extract nutritional information
   * @param {String} foodName - Name of the food item
   * @param {String} description - Optional description or context
   * @returns {Object} Analyzed food data with nutritional information
   */
  async analyzeFoodItem(foodName, description = '') {
    if (!this.openai) {
      console.warn('⚠️ OpenAI not available, cannot analyze food item');
      return null;
    }
    
    try {
      const prompt = this.buildFoodAnalysisPrompt(foodName, description);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert specializing in food analysis. Analyze the provided food item and extract comprehensive nutritional information.

Your analysis should be:
1. Accurate and evidence-based
2. Focused on per 100g nutritional values
3. Include all major macronutrients and key micronutrients
4. Consider typical preparation methods
5. Account for cultural variations and common serving sizes

Provide nutritional data for these nutrients (per 100g):
- kcal (calories)
- protein (grams)
- fat (grams) 
- carbs (grams)
- fiber (grams)
- sugar (grams)
- vitaminC (milligrams)
- zinc (milligrams)
- selenium (milligrams)
- iron (milligrams)
- omega3 (grams)

Also provide:
- Typical serving size in grams
- Glycemic Index (GI) if known
- FODMAP classification (Low/Medium/High/Unknown)
- NOVA classification (1=unprocessed, 2=processed, 3=ultra-processed, 4=ultra-processed with additives)
- Relevant tags (e.g., "vegetarian", "gluten-free", "high-protein")
- Common aliases or alternative names

IMPORTANT: Return your response as valid JSON in this exact format:
{
  "name": "Standardized food name",
  "aliases": ["alternative name 1", "alternative name 2"],
  "portionGramsDefault": 100,
  "nutrients": {
    "kcal": 0,
    "protein": 0,
    "fat": 0,
    "carbs": 0,
    "fiber": 0,
    "sugar": 0,
    "vitaminC": 0,
    "zinc": 0,
    "selenium": 0,
    "iron": 0,
    "omega3": 0
  },
  "gi": 0,
  "fodmap": "Low/Medium/High/Unknown",
  "novaClass": 1,
  "tags": ["tag1", "tag2"],
  "confidence": 0.0-1.0,
  "notes": "Additional context or preparation notes"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Low temperature for consistent nutritional data
        max_tokens: 1000
      });

      const aiResponse = response.choices[0].message.content;
      return this.parseFoodAnalysisResponse(aiResponse);
    } catch (error) {
      console.error('Error analyzing food item:', error);
      return null;
    }
  }

  buildFoodAnalysisPrompt(foodName, description) {
    let prompt = `Analyze this food item for nutritional information:\n\n`;
    prompt += `Food Name: ${foodName}\n`;
    
    if (description) {
      prompt += `Description/Context: ${description}\n`;
    }
    
    prompt += `\nPlease provide comprehensive nutritional analysis including:\n`;
    prompt += `1. Standardized name and common aliases\n`;
    prompt += `2. Nutritional values per 100g\n`;
    prompt += `3. Typical serving size\n`;
    prompt += `4. Glycemic Index and FODMAP classification\n`;
    prompt += `5. NOVA processing classification\n`;
    prompt += `6. Relevant dietary tags\n`;
    prompt += `7. Confidence level in the analysis\n`;
    prompt += `8. Any preparation or cultural context notes\n\n`;
    prompt += `Be as accurate as possible based on nutritional science and food composition databases.`;
    
    return prompt;
  }

  parseFoodAnalysisResponse(aiResponse) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!parsed.name || !parsed.nutrients) {
          console.warn('AI response missing required fields:', parsed);
          return null;
        }
        
        // Ensure all nutrient values are numbers
        const nutrients = {};
        const nutrientFields = ['kcal', 'protein', 'fat', 'carbs', 'fiber', 'sugar', 'vitaminC', 'zinc', 'selenium', 'iron', 'omega3'];
        
        nutrientFields.forEach(field => {
          nutrients[field] = typeof parsed.nutrients[field] === 'number' ? parsed.nutrients[field] : 0;
        });
        
        return {
          name: parsed.name.trim(),
          aliases: Array.isArray(parsed.aliases) ? parsed.aliases : [],
          portionGramsDefault: typeof parsed.portionGramsDefault === 'number' ? parsed.portionGramsDefault : 100,
          nutrients,
          gi: typeof parsed.gi === 'number' ? parsed.gi : null,
          fodmap: ['Low', 'Medium', 'High', 'Unknown'].includes(parsed.fodmap) ? parsed.fodmap : 'Unknown',
          novaClass: typeof parsed.novaClass === 'number' && parsed.novaClass >= 1 && parsed.novaClass <= 4 ? parsed.novaClass : 1,
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          confidence: typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1 ? parsed.confidence : 0.7,
          notes: typeof parsed.notes === 'string' ? parsed.notes : '',
          aiAnalyzed: true,
          aiResponse: aiResponse
        };
      }
      
      console.warn('No valid JSON found in AI response:', aiResponse);
      return null;
    } catch (error) {
      console.error('Error parsing AI food analysis response:', error);
      return null;
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