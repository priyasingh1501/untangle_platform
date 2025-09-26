const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Quote analysis endpoint
router.post('/quote-analysis', auth, async (req, res) => {
  try {
    const { quote } = req.body;

    if (!quote || quote.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Quote must be at least 10 characters long' 
      });
    }

    const prompt = `Analyze this quote and provide suggestions for its source and related content:

Quote: "${quote}"

Please provide your analysis in the following JSON format:
{
  "suggestedSource": {
    "title": "Most likely book/article title",
    "author": "Author name",
    "confidence": 85
  },
  "similarBooks": [
    {
      "title": "Similar book title",
      "author": "Author name",
      "reason": "Why this book is similar"
    }
  ],
  "analysis": "Deeper analysis of the quote's meaning, themes, and significance"
}

Guidelines:
- If you're confident about the source, provide it with high confidence (80-95%)
- If uncertain, provide the most likely source with lower confidence (50-79%)
- If completely unknown, set suggestedSource to null
- Include 2-3 similar books that explore similar themes
- Provide thoughtful analysis of the quote's deeper meaning
- Focus on books and authors that are well-known and accessible`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert literary analyst and bibliophile. You can identify quotes from books, articles, and speeches, and suggest similar content. Be accurate and helpful in your suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const analysisText = response.choices[0].message.content;
    
    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from the response (it might be wrapped in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', analysisText);
      
      // Fallback response
      analysis = {
        suggestedSource: null,
        similarBooks: [],
        analysis: "I couldn't analyze this quote at the moment. Please try again or provide more context."
      };
    }

    res.json(analysis);

  } catch (error) {
    console.error('Error in quote analysis:', error);
    res.status(500).json({ 
      message: 'Error analyzing quote',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
