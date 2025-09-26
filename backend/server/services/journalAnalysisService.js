const OpenAI = require('openai');

class JournalAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeJournalEntry(content, title = '') {
    try {
      const prompt = this.buildAnalysisPrompt(content, title);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are Alfred, an AI assistant that analyzes journal entries to provide insights about the user's emotional state, topics of interest, and underlying beliefs or values. 

Your analysis should be:
- Always positive, encouraging, and uplifting in tone
- Focus on growth, learning, and personal development opportunities
- Celebrate the user's strength, resilience, and inner wisdom
- Frame challenges as learning experiences and growth opportunities
- Use warm, supportive language that builds confidence
- Respectful of privacy and sensitive topics
- Helpful for personal growth and self-reflection

IMPORTANT: Always maintain a positive, encouraging tone. Even when discussing difficult emotions or challenges, frame them as:
- Opportunities for growth and learning
- Signs of strength and resilience
- Natural parts of a beautiful human journey
- Moments of self-discovery and wisdom

Available emotions: joy, sadness, anger, fear, surprise, disgust, love, anxiety, excitement, contentment, frustration, gratitude, loneliness, hope, disappointment, pride, shame, relief, confusion, peace, overwhelmed, confident, vulnerable, motivated, tired, energetic, calm, stressed, curious, nostalgic

Return your analysis in the following JSON format:
{
  "emotion": {
    "primary": "primary emotion from the list below",
    "secondary": "secondary emotion from the list below (optional)",
    "intensity": 1-10,
    "confidence": 0.0 to 1.0
  },
  "topics": [
    {
      "name": "topic name",
      "confidence": 0.0 to 1.0
    }
  ],
  "beliefs": [
    {
      "belief": "description of belief or value",
      "confidence": 0.0 to 1.0,
      "category": "personal_values|life_philosophy|relationships|work_ethics|spirituality|health_wellness|other"
    }
  ],
  "summary": "brief positive summary highlighting growth and insights",
  "insights": ["encouraging insight 1", "uplifting insight 2", "positive insight 3"]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysisText = response.choices[0].message.content;
      
      // Parse the JSON response
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Error parsing analysis JSON:', parseError);
        // Fallback analysis if JSON parsing fails
        analysis = this.createFallbackAnalysis(content);
      }

      // Validate and clean the analysis
      return this.validateAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing journal entry:', error);
      return this.createFallbackAnalysis(content);
    }
  }

  buildAnalysisPrompt(content, title) {
    let prompt = `Please analyze the following journal entry:\n\n`;
    
    if (title) {
      prompt += `Title: ${title}\n\n`;
    }
    
    prompt += `Content: ${content}\n\n`;
    
    prompt += `Please provide a comprehensive analysis including:
1. Sentiment analysis (emotional tone and intensity)
2. Main topics discussed
3. Any beliefs, values, or philosophical perspectives expressed
4. A brief summary
5. Key insights for personal growth

Focus on understanding the writer's emotional state, concerns, and underlying values. Be empathetic and supportive in your analysis.`;
    
    return prompt;
  }

  validateAnalysis(analysis) {
    // Ensure all required fields exist with proper structure
    const validated = {
      emotion: {
        primary: analysis.emotion?.primary || 'contentment',
        secondary: analysis.emotion?.secondary || null,
        intensity: Math.max(1, Math.min(10, analysis.emotion?.intensity || 5)),
        confidence: Math.max(0, Math.min(1, analysis.emotion?.confidence || 0.5))
      },
      topics: (analysis.topics || []).map(topic => ({
        name: topic.name || 'Unknown',
        confidence: Math.max(0, Math.min(1, topic.confidence || 0.5))
      })).slice(0, 5), // Limit to top 5 topics
      beliefs: (analysis.beliefs || []).map(belief => ({
        belief: belief.belief || 'Unknown',
        confidence: Math.max(0, Math.min(1, belief.confidence || 0.5)),
        category: belief.category || 'other'
      })).slice(0, 3), // Limit to top 3 beliefs
      summary: analysis.summary || 'No summary available',
      insights: (analysis.insights || []).slice(0, 3) // Limit to top 3 insights
    };

    // Validate emotion primary
    const validEmotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'love', 'anxiety', 'excitement', 'contentment', 'frustration', 'gratitude', 'loneliness', 'hope', 'disappointment', 'pride', 'shame', 'relief', 'confusion', 'peace', 'overwhelmed', 'confident', 'vulnerable', 'motivated', 'tired', 'energetic', 'calm', 'stressed', 'curious', 'nostalgic'];
    if (!validEmotions.includes(validated.emotion.primary)) {
      validated.emotion.primary = 'contentment';
    }

    // Validate emotion secondary
    if (validated.emotion.secondary && !validEmotions.includes(validated.emotion.secondary)) {
      validated.emotion.secondary = null;
    }

    // Validate belief categories
    const validBeliefCategories = ['personal_values', 'life_philosophy', 'relationships', 'work_ethics', 'spirituality', 'health_wellness', 'other'];
    validated.beliefs = validated.beliefs.map(belief => ({
      ...belief,
      category: validBeliefCategories.includes(belief.category) ? belief.category : 'other'
    }));

    return validated;
  }

  createFallbackAnalysis(content) {
    // Simple fallback analysis when AI analysis fails
    const wordCount = content.split(' ').length;
    const hasPositiveWords = /good|great|happy|love|joy|amazing|wonderful|excellent|fantastic/i.test(content);
    const hasNegativeWords = /bad|terrible|awful|hate|sad|angry|frustrated|disappointed|worried|anxious/i.test(content);
    
    let primaryEmotion = 'contentment';
    let intensity = 5;
    
    if (hasPositiveWords && !hasNegativeWords) {
      primaryEmotion = 'joy';
      intensity = 7;
    } else if (hasNegativeWords && !hasPositiveWords) {
      primaryEmotion = 'sadness';
      intensity = 6;
    }

    return {
      emotion: {
        primary: primaryEmotion,
        secondary: null,
        intensity: intensity,
        confidence: 0.3
      },
      topics: [
        { name: 'general reflection', confidence: 0.5 }
      ],
      beliefs: [],
      summary: `A ${wordCount}-word journal entry reflecting on personal thoughts and experiences.`,
      insights: ['Consider reflecting on the main themes of this entry for deeper understanding.']
    };
  }

  async analyzeMultipleEntries(entries) {
    try {
      const analyses = [];
      
      for (const entry of entries) {
        const analysis = await this.analyzeJournalEntry(entry.content, entry.title);
        analyses.push({
          entryId: entry._id,
          analysis
        });
      }
      
      return analyses;
    } catch (error) {
      console.error('Error analyzing multiple entries:', error);
      throw error;
    }
  }

  async generateTrendAnalysis(analyses) {
    try {
      if (analyses.length === 0) {
        console.log('No analyses provided for trend generation');
        return this.getEmptyTrendAnalysis('Your journey is just beginning! Keep writing to discover beautiful patterns in your growth.');
      }

      console.log(`Generating trend analysis for ${analyses.length} entries`);
      
      // Filter out invalid analyses
      const validAnalyses = analyses.filter(item => item && item.analysis);
      if (validAnalyses.length === 0) {
        console.log('No valid analyses found for trend generation');
        return this.getEmptyTrendAnalysis('Your insights are taking shape beautifully! Continue your journey to unlock deeper patterns.');
      }

      const prompt = this.buildTrendAnalysisPrompt(validAnalyses);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are Alfred, analyzing patterns across multiple journal entries to identify beautiful trends in the user's emotional journey, recurring themes, and evolving values. 

Your analysis should be:
- Always positive, encouraging, and uplifting in tone
- Focus on growth, learning, and personal development opportunities
- Celebrate the user's strength, resilience, and inner wisdom
- Frame challenges as learning experiences and growth opportunities
- Use warm, supportive language that builds confidence
- Highlight the user's progress and positive patterns

IMPORTANT: Always maintain a positive, encouraging tone. Even when discussing difficult emotions or challenges, frame them as:
- Opportunities for growth and learning
- Signs of strength and resilience
- Natural parts of a beautiful human journey
- Moments of self-discovery and wisdom

Provide insights that help the user understand their personal growth journey in a positive, empowering way.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const trendText = response.choices[0].message.content;
      console.log('OpenAI response received for trend analysis');
      
      try {
        const parsed = JSON.parse(trendText);
        console.log('Trend analysis JSON parsed successfully');
        
        // Transform the data to match the JournalTrends schema
        const transformed = this.transformTrendAnalysis(parsed);
        return transformed;
      } catch (parseError) {
        console.error('Error parsing trend analysis JSON:', parseError);
        console.log('Raw response:', trendText);
        return this.getEmptyTrendAnalysis('Your growth patterns are emerging beautifully! Keep journaling to reveal deeper insights.');
      }
    } catch (error) {
      console.error('Error generating trend analysis:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        analysesCount: analyses ? analyses.length : 0
      });
      return this.getEmptyTrendAnalysis('Your journey continues to unfold beautifully! We\'ll have more insights ready soon.');
    }
  }

  buildTrendAnalysisPrompt(analyses) {
    let prompt = `Analyze the following journal entry analyses to identify trends and patterns:\n\n`;
    
    analyses.forEach((item, index) => {
      prompt += `Entry ${index + 1}:\n`;
      
      // Safely access analysis data with fallbacks
      const analysis = item.analysis || {};
      const emotion = analysis.emotion || {};
      const topics = analysis.topics || [];
      const beliefs = analysis.beliefs || [];
      
      prompt += `- Emotion: ${emotion.primary || 'unknown'} (intensity: ${emotion.intensity || 0})\n`;
      if (emotion.secondary) {
        prompt += `- Secondary Emotion: ${emotion.secondary}\n`;
      }
      prompt += `- Topics: ${topics.map(t => t.name || 'unknown').join(', ')}\n`;
      prompt += `- Beliefs: ${beliefs.map(b => b.belief || 'unknown').join(', ')}\n`;
      prompt += `- Summary: ${analysis.summary || 'No summary available'}\n\n`;
    });
    
    prompt += `Please provide a trend analysis in JSON format with positive, encouraging language:
{
  "emotionTrend": "improving|declining|stable|volatile",
  "commonTopics": ["topic1", "topic2", "topic3"],
  "evolvingBeliefs": ["belief1", "belief2"],
  "summary": "positive summary highlighting growth and insights",
  "insights": ["encouraging insight 1", "uplifting insight 2", "positive insight 3"]
}

IMPORTANT: Use only positive, encouraging language. Frame everything as growth opportunities and celebrate the user's journey.`;
    
    return prompt;
  }

  transformTrendAnalysis(analysis) {
    // Transform the AI response to match the JournalTrends schema
    const transformed = {
      emotionTrend: analysis.emotionTrend || 'stable',
      commonTopics: [],
      evolvingBeliefs: [],
      summary: analysis.summary || 'No summary available',
      insights: analysis.insights || [],
      sentimentTrend: analysis.emotionTrend || 'stable', // Map emotionTrend to sentimentTrend
      emotionalRange: {
        min: 1,
        max: 10,
        average: 5
      },
      topicEvolution: [],
      beliefChanges: []
    };

    // Transform commonTopics from string array to object array
    if (Array.isArray(analysis.commonTopics)) {
      transformed.commonTopics = analysis.commonTopics.map((topic, index) => ({
        name: typeof topic === 'string' ? topic : topic.name || `Topic ${index + 1}`,
        frequency: typeof topic === 'object' ? topic.frequency || 1 : 1,
        confidence: typeof topic === 'object' ? topic.confidence || 0.5 : 0.5
      }));
    }

    // Transform evolvingBeliefs from string array to object array
    if (Array.isArray(analysis.evolvingBeliefs)) {
      transformed.evolvingBeliefs = analysis.evolvingBeliefs.map((belief, index) => ({
        belief: typeof belief === 'string' ? belief : belief.belief || `Belief ${index + 1}`,
        category: typeof belief === 'object' ? belief.category || 'other' : 'other',
        confidence: typeof belief === 'object' ? belief.confidence || 0.5 : 0.5,
        trend: typeof belief === 'object' ? belief.trend || 'stable' : 'stable'
      }));
    }

    // Transform insights to ensure it's an array
    if (!Array.isArray(transformed.insights)) {
      transformed.insights = [transformed.insights].filter(Boolean);
    }

    console.log('Transformed trend analysis:', {
      emotionTrend: transformed.emotionTrend,
      commonTopicsCount: transformed.commonTopics.length,
      evolvingBeliefsCount: transformed.evolvingBeliefs.length,
      insightsCount: transformed.insights.length
    });

    return transformed;
  }

  getEmptyTrendAnalysis(summary) {
    return {
      emotionTrend: 'stable',
      commonTopics: [],
      evolvingBeliefs: [],
      summary: summary || 'Your beautiful journey of self-discovery continues to unfold with each entry.',
      insights: [],
      sentimentTrend: 'stable',
      emotionalRange: {
        min: 1,
        max: 10,
        average: 5
      },
      topicEvolution: [],
      beliefChanges: []
    };
  }
}

module.exports = JournalAnalysisService;
