const OpenAI = require('openai');

class EnhancedTrendAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEnhancedTrendAnalysis(analyses, timeRange = 'month') {
    try {
      if (analyses.length === 0) {
        return this.getEmptyAnalysis();
      }

      const prompt = this.buildEnhancedTrendAnalysisPrompt(analyses, timeRange);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are Alfred, an advanced AI assistant that analyzes journal entries to provide comprehensive insights about the user's emotional patterns, personal growth, and life trends. 

Your analysis should be:
- Deeply insightful and personalized
- Actionable with specific recommendations
- Focused on growth and self-improvement
- Respectful of privacy and sensitive topics
- Data-driven with specific metrics and patterns

Provide comprehensive trend analysis that helps users understand their emotional journey and make positive changes.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const trendText = response.choices[0].message.content;
      
      try {
        const analysis = JSON.parse(trendText);
        return this.validateAndEnhanceAnalysis(analysis, analyses);
      } catch (parseError) {
        console.error('Error parsing trend analysis JSON:', parseError);
        return this.generateFallbackAnalysis(analyses);
      }
    } catch (error) {
      console.error('Error generating enhanced trend analysis:', error);
      return this.generateFallbackAnalysis(analyses);
    }
  }

  buildEnhancedTrendAnalysisPrompt(analyses, timeRange) {
    let prompt = `Analyze the following journal entries to provide comprehensive trend insights:\n\n`;
    prompt += `Time Range: ${timeRange}\n`;
    prompt += `Number of Entries: ${analyses.length}\n\n`;
    
    analyses.forEach((item, index) => {
      prompt += `Entry ${index + 1} (${item.date || 'Unknown date'}):\n`;
      prompt += `- Primary Emotion: ${item.analysis.emotion.primary} (intensity: ${item.analysis.emotion.intensity}/10)\n`;
      if (item.analysis.emotion.secondary) {
        prompt += `- Secondary Emotion: ${item.analysis.emotion.secondary}\n`;
      }
      prompt += `- Topics: ${item.analysis.topics.map(t => t.name).join(', ')}\n`;
      prompt += `- Beliefs: ${item.analysis.beliefs.map(b => b.belief).join(', ')}\n`;
      prompt += `- Summary: ${item.analysis.summary}\n\n`;
    });
    
    prompt += `Please provide a comprehensive trend analysis in JSON format:
{
  "sentimentTrend": "improving|declining|stable|volatile",
  "emotionFrequency": [
    {"name": "emotion_name", "frequency": number, "trend": "increasing|decreasing|stable"}
  ],
  "emotionalStability": {
    "score": 0-100,
    "description": "stability assessment",
    "factors": ["factor1", "factor2"]
  },
  "commonTopics": ["topic1", "topic2", "topic3"],
  "evolvingBeliefs": ["belief1", "belief2"],
  "growthAreas": ["area1", "area2"],
  "challengeAreas": ["challenge1", "challenge2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "patterns": {
    "weekly": "description of weekly patterns",
    "seasonal": "description of seasonal patterns",
    "triggers": ["trigger1", "trigger2"]
  },
  "insights": {
    "emotionalIntelligence": "assessment",
    "resilience": "assessment",
    "selfAwareness": "assessment"
  },
  "summary": "comprehensive overview of trends and patterns"
}`;
    
    return prompt;
  }

  validateAndEnhanceAnalysis(analysis, originalAnalyses) {
    // Calculate additional metrics
    const emotionFrequency = this.calculateEmotionFrequency(originalAnalyses);
    const emotionalStability = this.calculateEmotionalStability(originalAnalyses);
    const patterns = this.identifyPatterns(originalAnalyses);
    
    return {
      sentimentTrend: analysis.sentimentTrend || 'stable',
      emotionFrequency: analysis.emotionFrequency || emotionFrequency,
      emotionalStability: analysis.emotionalStability || emotionalStability,
      commonTopics: analysis.commonTopics || [],
      evolvingBeliefs: analysis.evolvingBeliefs || [],
      growthAreas: analysis.growthAreas || [],
      challengeAreas: analysis.challengeAreas || [],
      recommendations: analysis.recommendations || [],
      patterns: analysis.patterns || patterns,
      insights: analysis.insights || {},
      summary: analysis.summary || 'Trend analysis completed successfully.'
    };
  }

  calculateEmotionFrequency(analyses) {
    const emotionCount = {};
    const emotionIntensities = {};
    
    analyses.forEach(item => {
      const emotion = item.analysis.emotion.primary;
      const intensity = item.analysis.emotion.intensity || 5;
      
      emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
      emotionIntensities[emotion] = (emotionIntensities[emotion] || 0) + intensity;
    });
    
    return Object.entries(emotionCount)
      .map(([emotion, count]) => ({
        name: emotion,
        frequency: count,
        averageIntensity: Math.round(emotionIntensities[emotion] / count),
        trend: this.calculateEmotionTrend(emotion, analyses)
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  calculateEmotionTrend(emotion, analyses) {
    const recent = analyses.slice(0, Math.floor(analyses.length / 2));
    const older = analyses.slice(Math.floor(analyses.length / 2));
    
    const recentCount = recent.filter(item => item.analysis.emotion.primary === emotion).length;
    const olderCount = older.filter(item => item.analysis.emotion.primary === emotion).length;
    
    if (recentCount > olderCount) return 'increasing';
    if (recentCount < olderCount) return 'decreasing';
    return 'stable';
  }

  calculateEmotionalStability(analyses) {
    const emotions = analyses.map(item => item.analysis.emotion.primary);
    const intensities = analyses.map(item => item.analysis.emotion.intensity || 5);
    
    // Calculate variance in emotions
    const uniqueEmotions = new Set(emotions);
    const emotionDiversity = uniqueEmotions.size / emotions.length;
    
    // Calculate intensity variance
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const intensityVariance = intensities.reduce((sum, intensity) => 
      sum + Math.pow(intensity - avgIntensity, 2), 0) / intensities.length;
    
    // Calculate stability score (0-100)
    const diversityScore = Math.min(emotionDiversity * 50, 50); // Max 50 points for diversity
    const consistencyScore = Math.max(0, 50 - (intensityVariance * 5)); // Max 50 points for consistency
    const stabilityScore = Math.round(diversityScore + consistencyScore);
    
    let description = '';
    if (stabilityScore >= 80) description = 'Very stable emotional patterns with good diversity';
    else if (stabilityScore >= 60) description = 'Generally stable with some variability';
    else if (stabilityScore >= 40) description = 'Moderate stability with noticeable fluctuations';
    else description = 'High emotional variability requiring attention';
    
    return {
      score: stabilityScore,
      description,
      factors: this.identifyStabilityFactors(emotions, intensities)
    };
  }

  identifyStabilityFactors(emotions, intensities) {
    const factors = [];
    
    // Check for emotional diversity
    const uniqueEmotions = new Set(emotions);
    if (uniqueEmotions.size < emotions.length * 0.3) {
      factors.push('Limited emotional range');
    }
    
    // Check for intensity consistency
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const highVariation = intensities.some(intensity => Math.abs(intensity - avgIntensity) > 3);
    if (highVariation) {
      factors.push('High intensity variation');
    }
    
    // Check for negative emotion patterns
    const negativeEmotions = emotions.filter(e => 
      ['sadness', 'anger', 'fear', 'anxiety', 'overwhelmed', 'stressed'].includes(e)
    );
    if (negativeEmotions.length > emotions.length * 0.6) {
      factors.push('Frequent negative emotions');
    }
    
    return factors;
  }

  identifyPatterns(analyses) {
    // This would be enhanced with more sophisticated pattern recognition
    return {
      weekly: 'Patterns may emerge with more data',
      seasonal: 'Seasonal patterns require longer time periods',
      triggers: this.identifyEmotionalTriggers(analyses)
    };
  }

  identifyEmotionalTriggers(analyses) {
    // Simple trigger identification based on topics and emotions
    const triggers = [];
    const emotionTopicPairs = {};
    
    analyses.forEach(item => {
      const emotion = item.analysis.emotion.primary;
      const topics = item.analysis.topics.map(t => t.name);
      
      topics.forEach(topic => {
        if (!emotionTopicPairs[topic]) {
          emotionTopicPairs[topic] = {};
        }
        emotionTopicPairs[topic][emotion] = (emotionTopicPairs[topic][emotion] || 0) + 1;
      });
    });
    
    // Find topics that consistently correlate with specific emotions
    Object.entries(emotionTopicPairs).forEach(([topic, emotions]) => {
      const total = Object.values(emotions).reduce((a, b) => a + b, 0);
      Object.entries(emotions).forEach(([emotion, count]) => {
        if (count / total > 0.7) { // 70% correlation
          triggers.push(`${topic} → ${emotion}`);
        }
      });
    });
    
    return triggers.slice(0, 5); // Top 5 triggers
  }

  generateFallbackAnalysis(analyses) {
    const emotionFrequency = this.calculateEmotionFrequency(analyses);
    const emotionalStability = this.calculateEmotionalStability(analyses);
    
    return {
      sentimentTrend: 'stable',
      emotionFrequency,
      emotionalStability,
      commonTopics: [],
      evolvingBeliefs: [],
      growthAreas: ['Continue journaling regularly'],
      challengeAreas: ['Monitor emotional patterns'],
      recommendations: [
        'Try to journal at consistent times',
        'Focus on positive experiences',
        'Consider professional support if needed'
      ],
      patterns: {
        weekly: 'Insufficient data for weekly patterns',
        seasonal: 'Insufficient data for seasonal patterns',
        triggers: []
      },
      insights: {
        emotionalIntelligence: 'Developing',
        resilience: 'Building',
        selfAwareness: 'Growing'
      },
      summary: 'Basic trend analysis completed. Continue journaling for more detailed insights.'
    };
  }

  getEmptyAnalysis() {
    return {
      sentimentTrend: 'stable',
      emotionFrequency: [],
      emotionalStability: { score: 0, description: 'No data available', factors: [] },
      commonTopics: [],
      evolvingBeliefs: [],
      growthAreas: [],
      challengeAreas: [],
      recommendations: ['Start journaling regularly to build insights'],
      patterns: {
        weekly: 'No data available',
        seasonal: 'No data available',
        triggers: []
      },
      insights: {
        emotionalIntelligence: 'Unknown',
        resilience: 'Unknown',
        selfAwareness: 'Unknown'
      },
      summary: 'No journal entries available for trend analysis. Start writing to unlock personal insights!'
    };
  }
}

module.exports = EnhancedTrendAnalysisService;
