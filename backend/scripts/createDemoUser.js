const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import models
const User = require('../server/models/User');
const LifestyleGoal = require('../server/models/Goal');
const Habit = require('../server/models/Habit');
const Journal = require('../server/models/Journal');
const FoodTracking = require('../server/models/FoodTracking');
const Meal = require('../server/models/Meal');
const Task = require('../server/models/Task');
const { Expense, Income, Budget, Account, Goal: FinanceGoal } = require('../server/models/Finance');
const ExpenseGoal = require('../server/models/ExpenseGoal');
const Content = require('../server/models/Content');
const AiChat = require('../server/models/AiChat');
const MindfulnessCheckin = require('../server/models/MindfulnessCheckin');
const BookDocument = require('../server/models/BookDocument');

// Demo user data
const DEMO_USER = {
  email: 'demo@lyfe.app',
  password: 'demo123456',
  firstName: 'Alex',
  lastName: 'Chen',
  bio: 'Productivity enthusiast and wellness advocate. Always learning and growing!',
  preferences: {
    timezone: 'Asia/Kolkata',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    health: {
      dietaryRestrictions: ['vegetarian'],
      fitnessGoals: ['weight_loss', 'muscle_gain', 'flexibility'],
      medicalConditions: []
    },
    lifestyle: {
      wakeUpTime: '06:30',
      sleepTime: '22:30',
      workHours: {
        start: '09:00',
        end: '18:00'
      }
    }
  },
  onboardingCompleted: true
};

// Sample data generators
const generateGoals = () => [
  {
    name: 'Morning Meditation',
    color: '#10B981',
    description: 'Start each day with 15 minutes of mindfulness',
    category: 'mindfulness',
    targetHours: 0.25,
    priority: 'high'
  },
  {
    name: 'Deep Work Sessions',
    color: '#3B82F6',
    description: 'Focused work without distractions',
    category: 'deep-work',
    targetHours: 3,
    priority: 'high'
  },
  {
    name: 'Physical Exercise',
    color: '#F59E0B',
    description: 'Daily workout for physical health',
    category: 'fitness',
    targetHours: 1,
    priority: 'medium'
  },
  {
    name: 'Reading',
    color: '#8B5CF6',
    description: 'Read books for personal growth',
    category: 'reading',
    targetHours: 0.5,
    priority: 'medium'
  },
  {
    name: 'Quality Sleep',
    color: '#6366F1',
    description: 'Consistent 8-hour sleep schedule',
    category: 'sleep',
    targetHours: 8,
    priority: 'high'
  }
];

const generateHabits = (goalIds) => [
  {
    habit: 'Morning Meditation',
    description: '15 minutes of mindfulness practice',
    valueMin: 15,
    quality: 'excellent',
    goalId: goalIds[0], // Morning Meditation goal
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    frequency: 'daily',
    tags: ['mindfulness', 'morning', 'wellness']
  },
  {
    habit: 'Deep Work Block',
    description: '2-hour focused work session',
    valueMin: 120,
    quality: 'good',
    goalId: goalIds[1], // Deep Work goal
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    frequency: 'daily',
    tags: ['productivity', 'focus', 'work']
  },
  {
    habit: 'Evening Walk',
    description: '30-minute walk for physical health',
    valueMin: 30,
    quality: 'good',
    goalId: goalIds[2], // Physical Exercise goal
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    frequency: 'daily',
    tags: ['exercise', 'evening', 'health']
  },
  {
    habit: 'Read Before Bed',
    description: '30 minutes of reading',
    valueMin: 30,
    quality: 'good',
    goalId: goalIds[3], // Reading goal
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    frequency: 'daily',
    tags: ['reading', 'learning', 'evening']
  }
];

const generateJournalEntries = (startDate, days) => {
  const entries = [];
  const moods = ['excellent', 'good', 'neutral', 'bad', 'terrible'];
  const types = ['daily', 'gratitude', 'reflection', 'goal', 'dream', 'work', 'health', 'relationship'];
  
  // More diverse and realistic journal prompts
  const journalPrompts = [
    "What am I grateful for today?",
    "What was the highlight of my day?",
    "What challenge did I overcome today?",
    "How did I grow today?",
    "What would I do differently tomorrow?",
    "What made me smile today?",
    "What am I looking forward to?",
    "What did I learn today?",
    "How did I take care of myself today?",
    "What am I proud of today?",
    "What's weighing on my mind right now?",
    "How did work go today?",
    "What's happening in my relationships?",
    "How is my health lately?",
    "What am I worried about?",
    "What made me feel accomplished today?",
    "What am I struggling with?",
    "What brought me joy today?",
    "What do I need to work on?",
    "How am I feeling about my future?"
  ];

  // Create a realistic emotional journey over time
  const emotionalJourney = createEmotionalJourney(days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Skip some days to make it realistic (not every single day)
    if (Math.random() < 0.75) { // 75% chance of journaling
      const mood = emotionalJourney[i] || moods[Math.floor(Math.random() * moods.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const prompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
      
      // Generate context-specific content
      const content = generateRealisticJournalContent(mood, type, i, days);
      
      entries.push({
        title: generateJournalTitle(type, mood, date),
        content: content,
        type,
        mood,
        tags: generateJournalTags(type, mood, i),
        isPrivate: Math.random() < 0.8, // 80% private entries
        location: generateLocation(),
        weather: generateWeather(),
        alfredAnalysis: generateJournalAnalysis(mood, type, prompt)
      });
    }
  }
  
  return entries;
};

// Create a realistic emotional journey with ups and downs
const createEmotionalJourney = (days) => {
  const journey = [];
  const moods = ['excellent', 'good', 'neutral', 'bad', 'terrible'];
  
  // Start with a mix of moods
  let currentMood = 'good';
  const moodWeights = { excellent: 0.15, good: 0.35, neutral: 0.25, bad: 0.15, terrible: 0.1 };
  
  for (let i = 0; i < days; i++) {
    // Add some emotional continuity - moods tend to persist
    if (Math.random() < 0.3) { // 30% chance to change mood
      const random = Math.random();
      let cumulative = 0;
      for (const [mood, weight] of Object.entries(moodWeights)) {
        cumulative += weight;
        if (random <= cumulative) {
          currentMood = mood;
          break;
        }
      }
    }
    
    // Add some patterns - weekends might be different, work stress cycles, etc.
    const dayOfWeek = (i % 7);
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      if (Math.random() < 0.4) {
        currentMood = Math.random() < 0.5 ? 'excellent' : 'good';
      }
    }
    
    // Add some crisis periods and recovery
    if (i > 10 && i < 15) { // Week 2 crisis
      if (Math.random() < 0.6) {
        currentMood = Math.random() < 0.5 ? 'bad' : 'terrible';
      }
    }
    
    if (i > 20 && i < 25) { // Week 3 recovery
      if (Math.random() < 0.5) {
        currentMood = Math.random() < 0.7 ? 'good' : 'excellent';
      }
    }
    
    journey.push(currentMood);
  }
  
  return journey;
};

// Generate realistic journal content based on context
const generateRealisticJournalContent = (mood, type, dayIndex, totalDays) => {
  const contentTemplates = {
    excellent: {
      work: [
        "Had an amazing day at work! Finally got that promotion I've been working towards. My manager called me into her office and told me I'm being promoted to Senior Developer. I can't believe it! All those late nights and extra projects paid off. I feel so validated and excited about the new challenges ahead.",
        "Crushed my presentation today! The client loved our proposal and we got the contract. My team was so supportive and I felt really confident. This is exactly the kind of work I want to be doing - creative, challenging, and impactful.",
        "Had a breakthrough moment at work today. I've been stuck on this complex algorithm for weeks, and suddenly it all clicked. The solution was elegant and efficient. My colleagues were impressed and I felt like a genius. These are the moments that make me love programming."
      ],
      health: [
        "Feeling incredible after my workout today! Ran 5K without stopping for the first time in months. My knee injury seems to be healing well and I'm getting stronger every day. I can't wait to sign up for that 10K race next month.",
        "Got amazing news from my doctor today! My blood pressure is back to normal and my cholesterol levels have improved significantly. All those lifestyle changes are finally paying off. I feel like I'm taking control of my health for the first time in years.",
        "Had my first therapy session today and it was surprisingly helpful. I've been carrying around so much anxiety and stress, and it felt good to talk to someone who really understands. I'm optimistic about this journey of self-discovery."
      ],
      relationship: [
        "Had the most wonderful date with Sarah tonight! We went to that new restaurant downtown and talked for hours. I feel like we're really connecting on a deeper level. She's so intelligent and funny, and I love how she challenges my perspectives. I think this could be something special.",
        "My best friend called me today just to check in. We haven't talked in a few weeks because we've both been busy, but it was like no time had passed. We laughed about old memories and made plans to hang out this weekend. I'm so grateful for friendships that can weather any storm.",
        "Had a heart-to-heart with my mom today. We've had our differences over the years, but today we really understood each other. She apologized for being so hard on me about my career choices, and I told her how much her support means to me. I feel closer to her than I have in years."
      ],
      daily: [
        "What an incredible day! Everything just fell into place perfectly. I woke up feeling refreshed, had a great breakfast, and the weather was beautiful. I accomplished everything on my to-do list and even had time for a relaxing walk in the park. Sometimes life just gives you these perfect days.",
        "Had one of those days where everything goes right! Found a $20 bill on the sidewalk, got a free coffee from my favorite café, and my favorite song came on the radio just when I needed a pick-me-up. It's the little things that make life magical.",
        "Today was absolutely perfect! Spent the morning reading in a cozy café, had lunch with a friend I haven't seen in months, and ended the day with a beautiful sunset. I feel so grateful for these simple pleasures and the people who make my life rich."
      ]
    },
    good: {
      work: [
        "Had a solid day at work. Made good progress on the project and my code review went well. My colleague gave me some helpful feedback that will make my solution even better. I'm feeling confident about the direction we're heading.",
        "Productive day at the office. Had a good team meeting where we brainstormed solutions to our current challenge. I contributed some ideas that the team seemed to like. It's nice to feel valued and part of a collaborative effort.",
        "Work was steady today. I finished the task I was working on and started planning the next phase. My manager mentioned that the client was happy with our progress. It's satisfying to see the project moving forward smoothly."
      ],
      health: [
        "Feeling good about my health lately. Went for a 30-minute walk during lunch and had a healthy dinner. I've been sleeping better since I started my new routine. Small changes, but I can feel the difference in my energy levels.",
        "Had a check-up today and everything looks good. My doctor was pleased with my progress and encouraged me to keep up the good work. It's motivating to see the numbers improving and know that my efforts are paying off.",
        "Went to the gym today and felt strong. I'm not where I want to be yet, but I'm making steady progress. Each workout feels a little easier, and I'm starting to enjoy the process rather than just focusing on the results."
      ],
      relationship: [
        "Had a nice conversation with my partner today. We talked about our weekend plans and shared some funny stories from our day. I love how we can be silly together and also have deep, meaningful discussions. Our relationship feels solid and comfortable.",
        "Met up with an old friend for coffee today. We caught up on each other's lives and it was so nice to reconnect. We made plans to hang out more regularly. It's important to nurture friendships and I'm glad we both made the effort.",
        "Had a good day with my family. We had dinner together and everyone seemed happy and relaxed. No drama, no arguments - just good food and good company. These are the moments I treasure most."
      ],
      daily: [
        "Nice, balanced day today. Got some work done, had a good lunch, and spent the evening reading. Nothing extraordinary happened, but I felt content and peaceful. Sometimes the best days are the quiet ones.",
        "Had a pleasant day overall. The weather was nice, I accomplished what I needed to, and I had time to relax. I'm feeling grateful for the simple things in life and the stability I have right now.",
        "Good day today. I felt productive but not stressed, social but not overwhelmed. Found a good balance between work and personal time. These are the days I want to remember when things get tough."
      ]
    },
    neutral: {
      work: [
        "Work was... work today. Nothing particularly exciting or terrible happened. I got through my tasks, attended the usual meetings, and left at a reasonable time. Some days are just about showing up and doing what needs to be done.",
        "Another typical day at the office. The project is moving along as expected, no major surprises. I'm not feeling particularly inspired, but I'm not stressed either. Just plugging away at the tasks in front of me.",
        "Work was fine today. Nothing to write home about, but nothing to complain about either. I completed my assignments and that's about it. Sometimes you just need these steady, uneventful days to balance out the more intense ones."
      ],
      health: [
        "My health is... okay. I haven't been as consistent with my exercise routine as I'd like, but I'm not doing anything terrible either. I know I could be doing better, but I'm not beating myself up about it. Just trying to take it one day at a time.",
        "Had a routine check-up today. Everything is normal, nothing concerning. I'm not in the best shape of my life, but I'm not in the worst either. Just somewhere in the middle, trying to maintain what I have.",
        "My energy levels have been average lately. Not great, not terrible. I've been getting enough sleep and eating reasonably well, but I could probably do better. It's hard to find the motivation sometimes."
      ],
      relationship: [
        "My relationship is in a stable place right now. We're not having any major issues, but we're also not in a particularly exciting phase. It's comfortable, which is nice, but sometimes I wonder if we should be doing more to keep things fresh.",
        "Had a normal day with my partner. We talked about our usual topics, made dinner together, watched some TV. It was nice but not particularly memorable. I guess not every day can be exciting, and that's okay.",
        "My social life is pretty quiet right now. I'm not feeling particularly social, but I'm also not feeling isolated. Just kind of existing in the middle ground, not reaching out much but not avoiding people either."
      ],
      daily: [
        "Today was... today. Nothing particularly noteworthy happened. I went through my usual routine, nothing went wrong, nothing went exceptionally right. Just another day in the life.",
        "Had a pretty average day. Got up, did my thing, went to bed. Nothing exciting, nothing terrible. Sometimes life is just like that - steady and unremarkable.",
        "Today was fine. Not great, not bad, just fine. I did what I needed to do and that was that. I'm not complaining, but I'm also not particularly inspired. Just existing, I guess."
      ]
    },
    bad: {
      work: [
        "Rough day at work today. My code isn't working the way I expected and I'm feeling frustrated. I've been staring at the same problem for hours and I'm not making progress. I hate feeling stuck like this, especially when deadlines are looming.",
        "Had a difficult conversation with my manager today. She wasn't happy with my recent performance and I felt really discouraged. I know I can do better, but it's hard to hear criticism even when it's constructive. I'm questioning whether I'm in the right role.",
        "Work is really stressing me out lately. The project requirements keep changing, the timeline is unrealistic, and I feel like I'm constantly playing catch-up. I'm starting to feel burned out and I don't know how much longer I can keep this pace up."
      ],
      health: [
        "I'm really struggling with my health lately. I've been having these persistent headaches and I'm worried something might be wrong. I've been putting off going to the doctor because I'm afraid of what they might find, but I know I need to address this soon.",
        "My anxiety has been really bad this week. I'm having trouble sleeping and I feel on edge all the time. I thought I had it under control, but it seems to be getting worse again. I'm not sure what's triggering it or how to manage it.",
        "I've been feeling really down about my body lately. I know I should be exercising more and eating better, but I just can't seem to find the motivation. I feel like I'm stuck in this cycle of wanting to change but not being able to follow through."
      ],
      relationship: [
        "Had a big fight with my partner today. We've been arguing a lot lately and I'm starting to wonder if we're compatible anymore. I love them, but I'm not sure if we want the same things out of life. This is really hard to think about.",
        "I'm feeling really lonely lately. My friends all seem to be busy with their own lives and I feel like I'm always the one reaching out. I'm starting to wonder if I'm doing something wrong or if I'm just not that important to them.",
        "My relationship with my family is strained right now. We had another disagreement about my career choices and I feel like they don't understand or support me. It's hard when the people who are supposed to love you unconditionally seem to judge your decisions."
      ],
      daily: [
        "Today was just... hard. Nothing catastrophic happened, but everything felt like a struggle. I woke up tired, nothing went smoothly, and I just felt off all day. Sometimes you have days like this and you just have to get through them.",
        "I'm feeling really overwhelmed lately. There's so much going on in my life right now and I feel like I can't keep up. I'm worried about work, money, relationships, everything. I just want to crawl into bed and hide from the world for a while.",
        "Today was frustrating. I had plans that fell through, technology that didn't work, and people who let me down. I know these are first-world problems, but they're still affecting my mood. I'm trying to keep things in perspective, but it's hard sometimes."
      ]
    },
    terrible: {
      work: [
        "I think I'm going to lose my job. I made a major mistake on the project and it's going to cost the company a lot of money. My manager is furious and I don't know how to fix this. I've been working so hard and now everything might be ruined. I feel like such a failure.",
        "I had a complete breakdown at work today. I've been under so much pressure and I just couldn't handle it anymore. I started crying in the middle of a meeting and had to leave. I'm so embarrassed and I don't know how I'm going to face my colleagues tomorrow.",
        "I think I'm in the wrong career. I've been questioning this for months, but today it really hit me. I don't feel passionate about what I'm doing and I'm not good at it. I feel trapped because I don't know what else I would do, but I'm miserable every day."
      ],
      health: [
        "I got some really bad news from my doctor today. I've been having some symptoms and the tests came back with concerning results. I'm scared and I don't know what this means for my future. I'm trying to stay positive, but it's hard when you're facing something so serious.",
        "I think I'm having a mental health crisis. I've been feeling really depressed and anxious, and today I had thoughts that scared me. I know I need help, but I don't know where to turn or how to ask for it. I feel so alone and hopeless right now.",
        "My health is really declining and I'm scared. I've been ignoring some symptoms for too long and now I'm facing the consequences. I feel like I've let myself down and I don't know how to turn things around. I'm worried about what this means for my future."
      ],
      relationship: [
        "I think my relationship is over. We had a huge fight and I said things I can't take back. I love them, but I don't think we can recover from this. I'm devastated and I don't know how I'm going to move forward. I thought this was forever.",
        "I found out my partner has been lying to me. I don't know how long it's been going on or what else they might be hiding. I feel betrayed and I don't know if I can trust them again. This is the worst pain I've ever felt.",
        "I'm completely alone. My friends have all moved on with their lives and I feel like I'm being left behind. I don't have anyone to talk to about what I'm going through and I feel so isolated. I never thought I would feel this lonely."
      ],
      daily: [
        "Today was the worst day I've had in a long time. Everything that could go wrong did go wrong. I feel like I'm being tested and I'm failing every single test. I don't know how much more I can take before I completely break down.",
        "I'm having a really dark time right now. Nothing seems to be working out and I'm starting to lose hope that things will get better. I know this is temporary, but it doesn't feel that way. I'm struggling to see the light at the end of the tunnel.",
        "I feel like I'm at rock bottom. Everything I've worked for seems to be falling apart and I don't know how to stop it. I'm questioning every decision I've made and wondering if I'm just fundamentally flawed. I need help but I don't know where to find it."
      ]
    }
  };

  const moodContent = contentTemplates[mood] || contentTemplates.neutral;
  const typeContent = moodContent[type] || moodContent.daily;
  
  if (typeContent && typeContent.length > 0) {
    return typeContent[Math.floor(Math.random() * typeContent.length)];
  }
  
  // Fallback to generic content
  return generateJournalContent(mood, type);
};

// Generate more realistic journal titles
const generateJournalTitle = (type, mood, date) => {
  const moodEmojis = {
    excellent: '🌟',
    good: '😊',
    neutral: '😐',
    bad: '😔',
    terrible: '😢'
  };
  
  const typeTitles = {
    work: ['Work Update', 'Office Thoughts', 'Career Reflection', 'Professional Life'],
    health: ['Health Check', 'Wellness Journey', 'Body & Mind', 'Health Update'],
    relationship: ['Relationship Thoughts', 'Love & Life', 'Personal Connections', 'Heart Matters'],
    daily: ['Daily Reflection', 'Today\'s Thoughts', 'Life Update', 'Day in Review'],
    gratitude: ['Grateful Today', 'Thankful Thoughts', 'Appreciation', 'Gratitude Journal'],
    reflection: ['Deep Thoughts', 'Self Reflection', 'Inner Journey', 'Personal Growth'],
    goal: ['Goal Progress', 'Dreams & Aspirations', 'Future Planning', 'Life Goals'],
    dream: ['Dreams & Hopes', 'Future Vision', 'Aspirations', 'Life Dreams']
  };
  
  const emoji = moodEmojis[mood] || '📝';
  const titleOptions = typeTitles[type] || ['Journal Entry'];
  const title = titleOptions[Math.floor(Math.random() * titleOptions.length)];
  
  return `${emoji} ${title} - ${date.toLocaleDateString()}`;
};

// Generate more diverse tags
const generateJournalTags = (type, mood, dayIndex) => {
  const baseTags = [type, mood];
  
  const contextualTags = {
    work: ['career', 'professional', 'office', 'productivity', 'stress', 'achievement'],
    health: ['wellness', 'fitness', 'mental-health', 'self-care', 'medical', 'recovery'],
    relationship: ['love', 'family', 'friends', 'social', 'connection', 'conflict'],
    daily: ['routine', 'life', 'personal', 'reflection', 'growth', 'challenges'],
    gratitude: ['thankful', 'appreciation', 'positive', 'blessings', 'joy'],
    reflection: ['introspection', 'self-awareness', 'growth', 'wisdom', 'insights'],
    goal: ['aspirations', 'future', 'planning', 'ambition', 'success'],
    dream: ['hopes', 'wishes', 'imagination', 'possibilities', 'inspiration']
  };
  
  const moodTags = {
    excellent: ['amazing', 'incredible', 'fantastic', 'wonderful', 'brilliant'],
    good: ['positive', 'satisfied', 'content', 'pleased', 'happy'],
    neutral: ['okay', 'average', 'steady', 'calm', 'stable'],
    bad: ['difficult', 'challenging', 'struggling', 'frustrated', 'tough'],
    terrible: ['awful', 'devastating', 'crisis', 'overwhelming', 'breaking']
  };
  
  const tags = [...baseTags];
  
  // Add contextual tags
  if (contextualTags[type]) {
    const randomTag = contextualTags[type][Math.floor(Math.random() * contextualTags[type].length)];
    tags.push(randomTag);
  }
  
  // Add mood-specific tags
  if (moodTags[mood]) {
    const randomMoodTag = moodTags[mood][Math.floor(Math.random() * moodTags[mood].length)];
    tags.push(randomMoodTag);
  }
  
  // Add day-specific tags
  if (dayIndex < 7) tags.push('week-1');
  else if (dayIndex < 14) tags.push('week-2');
  else if (dayIndex < 21) tags.push('week-3');
  else tags.push('week-4');
  
  return tags;
};

// Generate more varied locations
const generateLocation = () => {
  const locations = [
    { city: 'Mumbai', coordinates: { lat: 19.0760, lng: 72.8777 } },
    { city: 'Delhi', coordinates: { lat: 28.7041, lng: 77.1025 } },
    { city: 'Bangalore', coordinates: { lat: 12.9716, lng: 77.5946 } },
    { city: 'Pune', coordinates: { lat: 18.5204, lng: 73.8567 } },
    { city: 'Hyderabad', coordinates: { lat: 17.3850, lng: 78.4867 } },
    { city: 'Chennai', coordinates: { lat: 13.0827, lng: 80.2707 } },
    { city: 'Kolkata', coordinates: { lat: 22.5726, lng: 88.3639 } },
    { city: 'Ahmedabad', coordinates: { lat: 23.0225, lng: 72.5714 } }
  ];
  
  return locations[Math.floor(Math.random() * locations.length)];
};

// Generate more varied weather
const generateWeather = () => {
  const weatherConditions = [
    { condition: 'sunny', description: 'Bright and sunny day' },
    { condition: 'cloudy', description: 'Overcast with scattered clouds' },
    { condition: 'rainy', description: 'Light rain with occasional showers' },
    { condition: 'stormy', description: 'Heavy rain with thunderstorms' },
    { condition: 'foggy', description: 'Misty morning with low visibility' },
    { condition: 'windy', description: 'Breezy day with strong winds' },
    { condition: 'humid', description: 'Hot and humid weather' },
    { condition: 'pleasant', description: 'Perfect weather for outdoor activities' }
  ];
  
  const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
  const temperature = 20 + Math.floor(Math.random() * 20); // 20-40°C
  
  return {
    temperature,
    condition: weather.condition,
    description: weather.description
  };
};

const generateJournalContent = (mood, type) => {
  const contentTemplates = {
    excellent: [
      "I feel incredibly energized and motivated today. Everything seems to be falling into place, and I'm excited about the opportunities ahead.",
      "Today was absolutely amazing! I accomplished more than I expected and felt truly alive throughout the day.",
      "I'm overflowing with positivity and gratitude. The universe seems to be conspiring in my favor today."
    ],
    good: [
      "I had a productive and satisfying day. I feel content with my progress and optimistic about tomorrow.",
      "Today was solid - nothing extraordinary, but I felt balanced and accomplished.",
      "I'm feeling good about the direction I'm heading. Small wins today that add up to something bigger."
    ],
    neutral: [
      "Today was a regular day - nothing particularly exciting or challenging. Sometimes that's exactly what we need.",
      "I felt steady and stable today. No major highs or lows, just a consistent flow.",
      "A quiet, uneventful day that allowed me to recharge and prepare for what's next."
    ],
    bad: [
      "Today was challenging. I faced some obstacles that tested my patience, but I'm learning from them.",
      "I felt frustrated and overwhelmed at times today, but I know these feelings are temporary.",
      "Not my best day, but I'm trying to focus on the lessons rather than the difficulties."
    ],
    terrible: [
      "Today was really tough. I felt defeated and discouraged, but I'm trying to hold onto hope.",
      "I struggled with negative thoughts and emotions today. It's hard, but I know this too shall pass.",
      "One of those days where everything felt wrong. I'm grateful for the support around me."
    ]
  };
  
  const templates = contentTemplates[mood] || contentTemplates.neutral;
  return templates[Math.floor(Math.random() * templates.length)];
};

const generateJournalAnalysis = (mood, type, prompt) => {
  // Enhanced emotion mapping with more nuanced analysis
  const moodToEmotion = {
    'excellent': { 
      primary: 'joy', 
      secondary: 'excitement', 
      tertiary: 'gratitude',
      intensity: 9, 
      confidence: 0.9,
      energy: 'high',
      valence: 'positive'
    },
    'good': { 
      primary: 'contentment', 
      secondary: 'satisfaction', 
      tertiary: 'optimism',
      intensity: 7, 
      confidence: 0.8,
      energy: 'medium',
      valence: 'positive'
    },
    'neutral': { 
      primary: 'calm', 
      secondary: 'peace', 
      tertiary: 'stability',
      intensity: 5, 
      confidence: 0.7,
      energy: 'low',
      valence: 'neutral'
    },
    'bad': { 
      primary: 'frustration', 
      secondary: 'overwhelmed', 
      tertiary: 'disappointment',
      intensity: 6, 
      confidence: 0.8,
      energy: 'low',
      valence: 'negative'
    },
    'terrible': { 
      primary: 'sadness', 
      secondary: 'anxiety', 
      tertiary: 'despair',
      intensity: 8, 
      confidence: 0.9,
      energy: 'very-low',
      valence: 'negative'
    }
  };

  // Enhanced topic analysis based on type and mood
  const topicTemplates = {
    'work': [
      { name: 'career development', confidence: 0.9, weight: 0.3 },
      { name: 'professional stress', confidence: 0.8, weight: 0.2 },
      { name: 'achievement', confidence: 0.7, weight: 0.2 },
      { name: 'work-life balance', confidence: 0.6, weight: 0.3 }
    ],
    'health': [
      { name: 'physical wellness', confidence: 0.9, weight: 0.3 },
      { name: 'mental health', confidence: 0.8, weight: 0.3 },
      { name: 'self-care', confidence: 0.7, weight: 0.2 },
      { name: 'medical concerns', confidence: 0.6, weight: 0.2 }
    ],
    'relationship': [
      { name: 'romantic relationships', confidence: 0.9, weight: 0.3 },
      { name: 'family dynamics', confidence: 0.8, weight: 0.2 },
      { name: 'friendship', confidence: 0.7, weight: 0.2 },
      { name: 'social connections', confidence: 0.6, weight: 0.3 }
    ],
    'daily': [
      { name: 'daily routine', confidence: 0.8, weight: 0.3 },
      { name: 'personal growth', confidence: 0.7, weight: 0.3 },
      { name: 'life balance', confidence: 0.6, weight: 0.2 },
      { name: 'general wellbeing', confidence: 0.5, weight: 0.2 }
    ],
    'gratitude': [
      { name: 'gratitude', confidence: 0.9, weight: 0.4 },
      { name: 'appreciation', confidence: 0.8, weight: 0.3 },
      { name: 'positive mindset', confidence: 0.7, weight: 0.3 }
    ],
    'reflection': [
      { name: 'self-reflection', confidence: 0.9, weight: 0.3 },
      { name: 'personal insights', confidence: 0.8, weight: 0.3 },
      { name: 'emotional awareness', confidence: 0.7, weight: 0.2 },
      { name: 'spiritual growth', confidence: 0.6, weight: 0.2 }
    ],
    'goal': [
      { name: 'goal setting', confidence: 0.9, weight: 0.3 },
      { name: 'future planning', confidence: 0.8, weight: 0.3 },
      { name: 'achievement', confidence: 0.7, weight: 0.2 },
      { name: 'motivation', confidence: 0.6, weight: 0.2 }
    ],
    'dream': [
      { name: 'aspirations', confidence: 0.9, weight: 0.3 },
      { name: 'hopes', confidence: 0.8, weight: 0.3 },
      { name: 'imagination', confidence: 0.7, weight: 0.2 },
      { name: 'future vision', confidence: 0.6, weight: 0.2 }
    ]
  };

  const emotion = moodToEmotion[mood] || moodToEmotion.neutral;
  const topics = topicTemplates[type] || topicTemplates.daily;

  // Generate contextual insights based on mood and type
  const insights = generateContextualInsights(mood, type, emotion, topics);
  
  return {
    emotion: {
      primary: emotion.primary,
      secondary: emotion.secondary,
      tertiary: emotion.tertiary,
      intensity: emotion.intensity,
      confidence: emotion.confidence,
      energy: emotion.energy,
      valence: emotion.valence
    },
    topics: topics,
    summary: `A ${mood} ${type} entry reflecting on ${prompt.toLowerCase()}. The emotional tone suggests ${emotion.primary} with elements of ${emotion.secondary}.`,
    insights: insights,
    emotionalJourney: {
      currentState: mood,
      energyLevel: emotion.energy,
      emotionalValence: emotion.valence,
      stability: emotion.intensity > 7 ? 'volatile' : emotion.intensity < 4 ? 'stable' : 'moderate'
    },
    patterns: generatePatternInsights(mood, type),
    riskFactors: generateRiskAssessment(mood, type),
    analyzedAt: new Date()
  };
};

// Generate contextual insights based on mood and type
const generateContextualInsights = (mood, type, emotion, topics) => {
  const insights = [];
  
  // Mood-based insights
  if (mood === 'excellent') {
    insights.push("This entry reflects a peak emotional state with high energy and positive outlook.");
    insights.push("The user appears to be in a flow state with strong motivation and satisfaction.");
  } else if (mood === 'good') {
    insights.push("The entry shows a balanced emotional state with positive undertones.");
    insights.push("The user seems content and optimistic about their current situation.");
  } else if (mood === 'neutral') {
    insights.push("This entry reflects a calm, stable emotional state without major fluctuations.");
    insights.push("The user appears to be in a maintenance phase, neither particularly high nor low.");
  } else if (mood === 'bad') {
    insights.push("The entry indicates emotional distress with signs of overwhelm or frustration.");
    insights.push("The user may be experiencing stress or facing significant challenges.");
  } else if (mood === 'terrible') {
    insights.push("This entry reflects a crisis state with intense negative emotions.");
    insights.push("The user appears to be struggling significantly and may need support.");
  }

  // Type-based insights
  if (type === 'work') {
    insights.push("Work-related themes dominate this entry, suggesting career is a major life focus.");
    if (mood === 'bad' || mood === 'terrible') {
      insights.push("Work stress appears to be significantly impacting emotional wellbeing.");
    }
  } else if (type === 'health') {
    insights.push("Health and wellness concerns are prominent in this entry.");
    if (mood === 'bad' || mood === 'terrible') {
      insights.push("Health issues may be causing significant emotional distress.");
    }
  } else if (type === 'relationship') {
    insights.push("Relationship dynamics are central to this entry's emotional content.");
    if (mood === 'bad' || mood === 'terrible') {
      insights.push("Relationship challenges appear to be affecting overall wellbeing.");
    }
  }

  // Emotional intensity insights
  if (emotion.intensity >= 8) {
    insights.push("High emotional intensity detected - this may be a significant life event or turning point.");
  } else if (emotion.intensity <= 3) {
    insights.push("Low emotional intensity suggests a period of stability or potential emotional numbing.");
  }

  return insights;
};

// Generate pattern insights
const generatePatternInsights = (mood, type) => {
  const patterns = [];
  
  if (type === 'work' && (mood === 'bad' || mood === 'terrible')) {
    patterns.push("Work-related stress pattern detected");
  }
  
  if (type === 'health' && (mood === 'bad' || mood === 'terrible')) {
    patterns.push("Health-related emotional distress pattern");
  }
  
  if (type === 'relationship' && (mood === 'bad' || mood === 'terrible')) {
    patterns.push("Relationship conflict pattern identified");
  }
  
  if (mood === 'excellent' || mood === 'good') {
    patterns.push("Positive emotional pattern");
  }
  
  return patterns;
};

// Generate risk assessment
const generateRiskAssessment = (mood, type) => {
  const risks = [];
  
  if (mood === 'terrible') {
    risks.push("High emotional distress - monitor for signs of crisis");
    risks.push("Consider professional support or intervention");
  }
  
  if (mood === 'bad' && type === 'health') {
    risks.push("Health-related emotional distress may indicate need for medical attention");
  }
  
  if (mood === 'bad' && type === 'relationship') {
    risks.push("Relationship stress may be impacting overall wellbeing");
  }
  
  if (mood === 'bad' && type === 'work') {
    risks.push("Work stress may be leading to burnout");
  }
  
  return risks;
};

const generateFoodTracking = (startDate, days) => {
  const entries = [];
  const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
  const plateTemplates = ['balanced', 'protein-heavy', 'vegetable-rich', 'carb-focused'];
  const mindfulPractices = ['breath', 'no_screens', 'slow', 'none'];
  const carbQualities = ['whole', 'fermented', 'refined'];
  
  const mealOptions = {
    breakfast: [
      'Oatmeal with fruits and nuts',
      'Greek yogurt with berries',
      'Avocado toast with eggs',
      'Smoothie bowl',
      'Poha with vegetables'
    ],
    lunch: [
      'Quinoa salad with vegetables',
      'Grilled chicken with rice',
      'Dal with roti and vegetables',
      'Fish curry with rice',
      'Vegetable stir-fry'
    ],
    snack: [
      'Mixed nuts',
      'Apple with peanut butter',
      'Greek yogurt',
      'Trail mix',
      'Green tea with biscuits'
    ],
    dinner: [
      'Grilled salmon with vegetables',
      'Dal with rice and salad',
      'Vegetable curry with roti',
      'Chicken stir-fry',
      'Lentil soup with bread'
    ]
  };

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate 2-4 meals per day
    const mealsPerDay = 2 + Math.floor(Math.random() * 3);
    
    for (let j = 0; j < mealsPerDay; j++) {
      const mealType = mealTypes[j] || mealTypes[Math.floor(Math.random() * mealTypes.length)];
      const mealOptionsForType = mealOptions[mealType] || mealOptions.breakfast;
      const mealDescription = mealOptionsForType[Math.floor(Math.random() * mealOptionsForType.length)];
      
      entries.push({
        date,
        mealType,
        time: generateMealTime(mealType),
        location: ['Home', 'Office', 'Restaurant', 'Café'][Math.floor(Math.random() * 4)],
        energy: 1 + Math.floor(Math.random() * 5),
        hunger: 1 + Math.floor(Math.random() * 5),
        plateTemplate: plateTemplates[Math.floor(Math.random() * plateTemplates.length)],
        proteinAnchor: Math.random() < 0.7,
        plantColors: Math.floor(Math.random() * 6),
        carbQuality: carbQualities[Math.floor(Math.random() * carbQualities.length)],
        friedOrUPF: Math.random() < 0.3,
        addedSugar: Math.random() < 0.4,
        mindfulPractice: mindfulPractices[Math.floor(Math.random() * mindfulPractices.length)],
        satiety: 1 + Math.floor(Math.random() * 5),
        postMealCravings: Math.floor(Math.random() * 6),
        notes: mealDescription,
        isCarbHeavy: Math.random() < 0.3,
        isFatHeavy: Math.random() < 0.2,
        isProcessed: Math.random() < 0.4,
        isFiberRich: Math.random() < 0.6,
        isProteinHeavy: Math.random() < 0.5,
        isIronRich: Math.random() < 0.4,
        isHighSugar: Math.random() < 0.3,
        healthGoals: ['steady_energy', 'muscle_building', 'gut_comfort', 'immunity_building'][Math.floor(Math.random() * 4)]
      });
    }
  }
  
  return entries;
};

const generateMealTime = (mealType) => {
  const times = {
    breakfast: ['07:00', '07:30', '08:00', '08:30'],
    lunch: ['12:00', '12:30', '13:00', '13:30'],
    snack: ['15:00', '15:30', '16:00', '16:30'],
    dinner: ['19:00', '19:30', '20:00', '20:30']
  };
  
  const mealTimes = times[mealType] || times.breakfast;
  return mealTimes[Math.floor(Math.random() * mealTimes.length)];
};

const generateTasks = (startDate, days) => {
  const tasks = [];
  const categories = ['work', 'personal', 'health', 'finance', 'home', 'relationship', 'learning'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['pending', 'in-progress', 'completed', 'cancelled'];
  const energyLevels = ['low', 'medium', 'high'];
  
  const taskTemplates = [
    'Complete project proposal',
    'Schedule doctor appointment',
    'Review monthly budget',
    'Call family member',
    'Read chapter 3 of book',
    'Organize workspace',
    'Plan weekend activities',
    'Update resume',
    'Research new technology',
    'Practice meditation',
    'Grocery shopping',
    'Clean apartment',
    'Write thank you note',
    'Learn new skill',
    'Exercise routine',
    'Meal prep for week',
    'Review investment portfolio',
    'Plan vacation',
    'Update LinkedIn profile',
    'Practice guitar'
  ];

  for (let i = 0; i < 50; i++) { // Generate 50 tasks over the period
    const createdDate = new Date(startDate);
    createdDate.setDate(createdDate.getDate() + Math.floor(Math.random() * days));
    
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1); // Due within 2 weeks
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const completedDate = status === 'completed' ? new Date(createdDate.getTime() + Math.random() * (dueDate.getTime() - createdDate.getTime())) : null;
    
    tasks.push({
      title: taskTemplates[Math.floor(Math.random() * taskTemplates.length)],
      description: `Task description for ${taskTemplates[Math.floor(Math.random() * taskTemplates.length)]}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      energyLevel: energyLevels[Math.floor(Math.random() * energyLevels.length)],
      status,
      dueDate,
      estimatedDuration: 15 + Math.floor(Math.random() * 120), // 15-135 minutes
      actualDuration: status === 'completed' ? 10 + Math.floor(Math.random() * 150) : null,
      tags: ['important', 'urgent', 'personal'][Math.floor(Math.random() * 3)],
      start: status === 'in-progress' ? createdDate : null,
      end: completedDate,
      mindfulRating: 1 + Math.floor(Math.random() * 5),
      isHabit: Math.random() < 0.2,
      notes: status === 'completed' ? 'Task completed successfully' : 'Pending completion'
    });
  }
  
  return tasks;
};

const generateFinanceData = (startDate, days) => {
  const expenses = [];
  const income = [];
  
  const categories = ['food', 'transportation', 'housing', 'utilities', 'healthcare', 'entertainment', 'shopping', 'education'];
  const paymentMethods = ['credit-card', 'debit-card', 'cash', 'digital-wallet'];
  
  const expenseTemplates = {
    food: ['Grocery shopping', 'Restaurant meal', 'Coffee', 'Lunch', 'Dinner'],
    transportation: ['Uber ride', 'Metro pass', 'Petrol', 'Parking', 'Taxi'],
    housing: ['Rent', 'Maintenance', 'Internet bill', 'Electricity bill', 'Water bill'],
    utilities: ['Phone bill', 'Internet', 'Electricity', 'Water', 'Gas'],
    healthcare: ['Doctor visit', 'Medicine', 'Gym membership', 'Health checkup', 'Supplements'],
    entertainment: ['Movie ticket', 'Netflix subscription', 'Concert ticket', 'Book purchase', 'Game'],
    shopping: ['Clothing', 'Electronics', 'Home goods', 'Gift', 'Personal care'],
    education: ['Online course', 'Book', 'Workshop', 'Software license', 'Training']
  };

  // Generate daily expenses
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // 1-5 expenses per day
    const expensesPerDay = 1 + Math.floor(Math.random() * 5);
    
    for (let j = 0; j < expensesPerDay; j++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const templates = expenseTemplates[category];
      const description = templates[Math.floor(Math.random() * templates.length)];
      
      expenses.push({
        date,
        amount: Math.floor(Math.random() * 2000) + 50, // 50-2050 INR
        currency: 'INR',
        category,
        subcategory: description,
        description,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        vendor: ['Amazon', 'Swiggy', 'Zomato', 'Uber', 'Local Store'][Math.floor(Math.random() * 5)],
        location: 'Mumbai',
        tags: [category, 'daily'],
        isRecurring: Math.random() < 0.2,
        impulseBuy: Math.random() < 0.3,
        status: 'completed'
      });
    }
  }

  // Generate monthly income
  const monthlyIncome = 80000; // 80k INR per month
  for (let i = 0; i < Math.ceil(days / 30); i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    date.setDate(1); // First day of month
    
    income.push({
      date,
      amount: monthlyIncome,
      currency: 'INR',
      source: 'salary',
      description: 'Monthly salary',
      category: 'salary',
      paymentMethod: 'bank-transfer',
      status: 'completed'
    });
  }

  return { expenses, income };
};

const generateContent = () => ({
  name: 'My Learning Collection',
  description: 'Books, documentaries, and content I\'m consuming for personal growth',
  type: 'currently_reading',
  isPublic: false,
  items: [
    {
      title: 'Atomic Habits',
      type: 'book',
      category: 'self_help',
      description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones',
      author: 'James Clear',
      year: 2018,
      rating: 4.5,
      duration: '320 pages',
      language: 'English',
      tags: ['productivity', 'habits', 'self-improvement'],
      status: 'currently_consuming',
      progress: 65,
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      userRating: 5,
      userReview: 'Excellent book on habit formation. Very practical and actionable.',
      difficulty: 'intermediate'
    },
    {
      title: 'The Mindful Way Through Depression',
      type: 'book',
      category: 'health',
      description: 'Freeing Yourself from Chronic Unhappiness',
      author: 'Mark Williams',
      year: 2007,
      rating: 4.2,
      duration: '280 pages',
      language: 'English',
      tags: ['mindfulness', 'mental-health', 'meditation'],
      status: 'completed',
      progress: 100,
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      completionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      userRating: 4,
      userReview: 'Helpful for understanding mindfulness-based approaches.',
      difficulty: 'intermediate'
    },
    {
      title: 'The Social Dilemma',
      type: 'documentary',
      category: 'technology',
      description: 'A documentary about the dangerous human impact of social networking',
      director: 'Jeff Orlowski',
      year: 2020,
      rating: 4.0,
      duration: '1h 34m',
      language: 'English',
      tags: ['technology', 'social-media', 'documentary'],
      status: 'completed',
      progress: 100,
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      completionDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      userRating: 4,
      userReview: 'Eye-opening documentary about social media impact.',
      difficulty: 'beginner'
    }
  ]
});

const generateAiChat = () => ({
  conversationId: `demo-conversation-${Date.now()}`,
  messages: [
    {
      role: 'user',
      content: 'Hi! I want to improve my productivity and build better habits. Can you help me?',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      role: 'assistant',
      content: "Hello! I'd be happy to help you improve your productivity and build better habits. Let's start by understanding your current situation. What are your main goals right now?",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      role: 'user',
      content: 'I want to wake up earlier, exercise regularly, and read more books. But I always seem to fall back into old patterns.',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    },
    {
      role: 'assistant',
      content: "That's a great starting point! The key to building lasting habits is to start small and be consistent. Let's break this down:\n\n1. **Wake up earlier**: Try going to bed 15 minutes earlier each week until you reach your desired wake-up time\n2. **Exercise regularly**: Start with just 10 minutes a day, even if it's just a walk\n3. **Read more**: Set a goal of reading just 5 pages a day\n\nWhat do you think about starting with these small steps?",
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    }
  ],
  userProfile: {
    preferences: {
      communicationStyle: 'encouraging',
      detailLevel: 'moderate',
      reminderFrequency: 'moderate'
    },
    goals: [
      {
        title: 'Build Morning Routine',
        description: 'Wake up at 6:30 AM consistently',
        category: 'health',
        priority: 'high',
        progress: 60,
        isActive: true
      }
    ],
    interests: [
      {
        category: 'productivity',
        topics: ['habits', 'time-management', 'focus'],
        intensity: 8
      }
    ],
    patterns: {
      productivityPeakHours: ['09:00', '14:00'],
      preferredWorkDuration: 90,
      breakPreferences: '5-minute breaks every 25 minutes',
      stressTriggers: ['deadlines', 'interruptions'],
      copingStrategies: ['meditation', 'exercise', 'music']
    },
    contentTaste: {
      bookGenres: ['self-help', 'productivity', 'psychology'],
      movieGenres: ['documentary', 'drama'],
      podcastTopics: ['productivity', 'mindfulness', 'business'],
      learningStyle: 'visual',
      preferredDifficulty: 'intermediate'
    }
  }
});

const generateMindfulnessCheckins = (startDate, days) => {
  const checkins = [];
  const practices = ['meditation', 'breathing', 'body_scan', 'walking', 'gratitude'];
  const moods = ['calm', 'focused', 'peaceful', 'energized', 'grounded'];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // 70% chance of mindfulness practice each day
    if (Math.random() < 0.7) {
      // Generate random ratings for each dimension (1-5)
      const presenceRating = 1 + Math.floor(Math.random() * 5);
      const emotionAwarenessRating = 1 + Math.floor(Math.random() * 5);
      const intentionalityRating = 1 + Math.floor(Math.random() * 5);
      const attentionQualityRating = 1 + Math.floor(Math.random() * 5);
      const compassionRating = 1 + Math.floor(Math.random() * 5);
      
      // Calculate total score and overall assessment manually
      const totalScore = presenceRating + emotionAwarenessRating + intentionalityRating + attentionQualityRating + compassionRating;
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
      
      checkins.push({
        date,
        dimensions: {
          presence: { rating: presenceRating },
          emotionAwareness: { rating: emotionAwarenessRating },
          intentionality: { rating: intentionalityRating },
          attentionQuality: { rating: attentionQualityRating },
          compassion: { rating: compassionRating }
        },
        totalScore,
        overallAssessment,
        dayReflection: `Today I practiced ${practices[Math.floor(Math.random() * practices.length)]} and felt ${moods[Math.floor(Math.random() * moods.length)]}. It was a ${Math.random() < 0.5 ? 'challenging' : 'peaceful'} day for mindfulness.`,
        dailyNotes: `Practice: ${practices[Math.floor(Math.random() * practices.length)]}, Duration: ${5 + Math.floor(Math.random() * 25)} minutes, Location: ${['Home', 'Park', 'Office'][Math.floor(Math.random() * 3)]}`
      });
    }
  }
  
  return checkins;
};

const generateBookDocuments = () => {
  const books = [
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones',
      category: 'self_help',
      status: 'completed',
      progress: 100,
      totalPages: 320,
      currentPage: 320,
      rating: 5,
      review: 'Excellent book on habit formation. Very practical and actionable.',
      tags: ['productivity', 'habits', 'self-improvement'],
      notes: [
        {
          content: 'You do not rise to the level of your goals. You fall to the level of your systems.',
          location: 'Page 27',
          tags: ['systems', 'goals', 'productivity'],
          isImportant: true,
          isQuote: true
        },
        {
          content: 'Every action you take is a vote for the type of person you wish to become.',
          location: 'Page 38',
          tags: ['identity', 'actions', 'growth'],
          isImportant: true,
          isQuote: true
        },
        {
          content: 'Habits are the compound interest of self-improvement.',
          location: 'Page 15',
          tags: ['habits', 'improvement', 'compound'],
          isImportant: false,
          isQuote: true
        },
        {
          content: 'The most effective way to change your habits is to focus not on what you want to achieve, but on who you wish to become.',
          location: 'Page 32',
          tags: ['identity', 'change', 'habits'],
          isImportant: true,
          isQuote: true
        }
      ]
    },
    {
      title: 'The Power of Now',
      author: 'Eckhart Tolle',
      description: 'A Guide to Spiritual Enlightenment',
      category: 'philosophy',
      status: 'currently_reading',
      progress: 65,
      totalPages: 236,
      currentPage: 153,
      rating: 4,
      tags: ['mindfulness', 'spirituality', 'enlightenment'],
      notes: [
        {
          content: 'The power for creating a better future is contained in the present moment: You create a good future by creating a good present.',
          location: 'Page 45',
          tags: ['present', 'future', 'creation'],
          isImportant: true,
          isQuote: true
        },
        {
          content: 'Realize deeply that the present moment is all you have. Make the Now the primary focus of your life.',
          location: 'Page 67',
          tags: ['present', 'focus', 'life'],
          isImportant: true,
          isQuote: true
        },
        {
          content: 'Wherever you are, be there totally.',
          location: 'Page 89',
          tags: ['presence', 'mindfulness', 'attention'],
          isImportant: false,
          isQuote: true
        }
      ]
    },
    {
      title: 'Deep Work',
      author: 'Cal Newport',
      description: 'Rules for Focused Success in a Distracted World',
      category: 'business',
      status: 'completed',
      progress: 100,
      totalPages: 296,
      currentPage: 296,
      rating: 4,
      review: 'Great insights on focused work and productivity.',
      tags: ['productivity', 'focus', 'work'],
      notes: [
        {
          content: 'The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy.',
          location: 'Page 14',
          tags: ['deep-work', 'economy', 'value'],
          isImportant: true,
          isQuote: true
        },
        {
          content: 'Human beings, it seems, are at their best when immersed deeply in something challenging.',
          location: 'Page 76',
          tags: ['challenge', 'immersion', 'best'],
          isImportant: false,
          isQuote: true
        },
        {
          content: 'Clarity about what matters provides clarity about what does not.',
          location: 'Page 102',
          tags: ['clarity', 'priorities', 'focus'],
          isImportant: true,
          isQuote: true
        }
      ]
    },
    {
      title: 'The 7 Habits of Highly Effective People',
      author: 'Stephen Covey',
      description: 'Powerful Lessons in Personal Change',
      category: 'self_help',
      status: 'completed',
      progress: 100,
      totalPages: 432,
      currentPage: 432,
      rating: 5,
      review: 'Timeless principles for personal and professional effectiveness.',
      tags: ['effectiveness', 'habits', 'leadership'],
      notes: [
        {
          content: 'The way we see the problem is the problem.',
          location: 'Page 58',
          tags: ['perspective', 'problems', 'mindset'],
          isImportant: true,
          isQuote: true
        },
        {
          content: 'Begin with the end in mind.',
          location: 'Page 98',
          tags: ['planning', 'vision', 'goals'],
          isImportant: true,
          isQuote: true
        },
        {
          content: 'Most people do not listen with the intent to understand; they listen with the intent to reply.',
          location: 'Page 239',
          tags: ['listening', 'communication', 'understanding'],
          isImportant: false,
          isQuote: true
        }
      ]
    },
    {
      title: 'Mindset',
      author: 'Carol Dweck',
      description: 'The New Psychology of Success',
      category: 'self_help',
      status: 'currently_reading',
      progress: 40,
      totalPages: 288,
      currentPage: 115,
      rating: 4,
      tags: ['psychology', 'growth', 'success'],
      notes: [
        {
          content: 'In a growth mindset, challenges are exciting rather than threatening. So rather than thinking, oh, I\'m going to reveal my weaknesses, you say, wow, here\'s a chance to grow.',
          location: 'Page 33',
          tags: ['growth-mindset', 'challenges', 'opportunity'],
          isImportant: true,
          isQuote: true
        },
        {
          content: 'The passion for stretching yourself and sticking to it, even (or especially) when it\'s not going well, is the hallmark of the growth mindset.',
          location: 'Page 78',
          tags: ['passion', 'persistence', 'growth'],
          isImportant: true,
          isQuote: true
        }
      ]
    }
  ];

  return books;
};

const generateMeals = async (startDate, days) => {
  const meals = [];
  const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
  
  // Sample food items that should exist in the database
  const sampleFoods = [
    {
      name: 'Oatmeal',
      nutrients: { kcal: 389, protein: 16.9, fat: 6.9, carbs: 66.3, fiber: 10.6, sugar: 0.99, vitaminC: 0, zinc: 2.34, selenium: 0.034, iron: 4.72, omega3: 0.11 }
    },
    {
      name: 'Banana',
      nutrients: { kcal: 89, protein: 1.1, fat: 0.3, carbs: 22.8, fiber: 2.6, sugar: 12.2, vitaminC: 8.7, zinc: 0.15, selenium: 0.001, iron: 0.26, omega3: 0.027 }
    },
    {
      name: 'Greek Yogurt',
      nutrients: { kcal: 59, protein: 10, fat: 0.4, carbs: 3.6, fiber: 0, sugar: 3.6, vitaminC: 0, zinc: 0.52, selenium: 0.009, iron: 0.04, omega3: 0.003 }
    },
    {
      name: 'Chicken Breast',
      nutrients: { kcal: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, sugar: 0, vitaminC: 0, zinc: 1.0, selenium: 0.024, iron: 1.04, omega3: 0.03 }
    },
    {
      name: 'Brown Rice',
      nutrients: { kcal: 111, protein: 2.6, fat: 0.9, carbs: 23, fiber: 1.8, sugar: 0.4, vitaminC: 0, zinc: 0.6, selenium: 0.019, iron: 0.4, omega3: 0.01 }
    },
    {
      name: 'Broccoli',
      nutrients: { kcal: 34, protein: 2.8, fat: 0.4, carbs: 6.6, fiber: 2.6, sugar: 1.5, vitaminC: 89.2, zinc: 0.41, selenium: 0.002, iron: 0.73, omega3: 0.02 }
    },
    {
      name: 'Almonds',
      nutrients: { kcal: 579, protein: 21.2, fat: 49.9, carbs: 21.6, fiber: 12.5, sugar: 4.4, vitaminC: 0, zinc: 3.12, selenium: 0.004, iron: 3.71, omega3: 0.003 }
    },
    {
      name: 'Salmon',
      nutrients: { kcal: 208, protein: 25.4, fat: 12.4, carbs: 0, fiber: 0, sugar: 0, vitaminC: 0, zinc: 0.64, selenium: 0.036, iron: 0.8, omega3: 2.02 }
    }
  ];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate 2-4 meals per day
    const mealsPerDay = 2 + Math.floor(Math.random() * 3);
    
    for (let j = 0; j < mealsPerDay; j++) {
      const mealType = mealTypes[j] || mealTypes[Math.floor(Math.random() * mealTypes.length)];
      const mealTime = generateMealTime(mealType);
      const mealTimestamp = new Date(date);
      const [hours, minutes] = mealTime.split(':');
      mealTimestamp.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Select 1-3 random foods for this meal
      const numFoods = 1 + Math.floor(Math.random() * 3);
      const selectedFoods = [];
      for (let k = 0; k < numFoods; k++) {
        const food = sampleFoods[Math.floor(Math.random() * sampleFoods.length)];
        const grams = 50 + Math.floor(Math.random() * 200); // 50-250g
        selectedFoods.push({
          foodId: food.name, // Using name as ID for demo
          customName: food.name,
          grams: grams
        });
      }
      
      // Calculate totals
      const totals = selectedFoods.reduce((acc, item) => {
        const food = sampleFoods.find(f => f.name === item.foodId);
        if (food) {
          const multiplier = item.grams / 100; // Convert to per 100g
          Object.keys(food.nutrients).forEach(nutrient => {
            acc[nutrient] = (acc[nutrient] || 0) + (food.nutrients[nutrient] * multiplier);
          });
        }
        return acc;
      }, {});
      
      // Generate basic badges
      const badges = {
        protein: totals.protein > 20,
        veg: selectedFoods.some(item => ['Broccoli', 'Banana'].includes(item.foodId)),
        gi: Math.floor(Math.random() * 5) + 1,
        fodmap: 'Low',
        nova: Math.floor(Math.random() * 4) + 1
      };
      
      // Generate basic effects
      const effects = {
        strength: {
          score: Math.floor(Math.random() * 6) + 2,
          why: ['High protein content', 'Complete amino acid profile'],
          level: 'Medium',
          label: 'Medium'
        },
        immunity: {
          score: Math.floor(Math.random() * 5) + 1,
          why: ['Vitamin C from vegetables', 'Antioxidant content'],
          level: 'Low',
          label: 'Low'
        },
        energizing: {
          score: Math.floor(Math.random() * 6) + 2,
          why: ['Complex carbohydrates', 'Balanced macronutrients'],
          level: 'Medium',
          label: 'Medium'
        },
        gutFriendly: {
          score: Math.floor(Math.random() * 5) + 1,
          why: ['Fiber content', 'Fermented foods'],
          level: 'Low',
          label: 'Low'
        }
      };
      
      meals.push({
        userId: null, // Will be set when creating
        ts: mealTimestamp,
        items: selectedFoods,
        notes: `${mealType} on ${date.toLocaleDateString()}`,
        context: {
          postWorkout: Math.random() < 0.3,
          bodyMassKg: 70,
          plantDiversity: Math.floor(Math.random() * 5) + 1,
          fermented: Math.random() < 0.2,
          omega3Tag: Math.random() < 0.3,
          addedSugar: Math.floor(Math.random() * 10)
        },
        computed: {
          totals,
          badges,
          mindfulMealScore: 2 + Math.random() * 3,
          rationale: ['Balanced macronutrients', 'Fresh ingredients'],
          tip: 'Consider adding more vegetables for better nutrition',
          effects
        }
      });
    }
  }
  
  return meals;
};

const generateExpenseGoals = () => {
  const expenseGoals = [
    {
      category: 'food',
      amount: 15000, // 15,000 INR per month
      period: 'monthly',
      notes: 'Monthly food budget including groceries and dining out',
      color: '#10B981'
    },
    {
      category: 'transportation',
      amount: 8000, // 8,000 INR per month
      period: 'monthly',
      notes: 'Transportation costs including fuel, metro, and ride-sharing',
      color: '#3B82F6'
    },
    {
      category: 'entertainment',
      amount: 5000, // 5,000 INR per month
      period: 'monthly',
      notes: 'Entertainment budget for movies, subscriptions, and leisure activities',
      color: '#8B5CF6'
    },
    {
      category: 'shopping',
      amount: 10000, // 10,000 INR per month
      period: 'monthly',
      notes: 'Shopping budget for clothing, electronics, and personal items',
      color: '#F59E0B'
    },
    {
      category: 'healthcare',
      amount: 3000, // 3,000 INR per month
      period: 'monthly',
      notes: 'Healthcare expenses including medicines and medical checkups',
      color: '#EF4444'
    },
    {
      category: 'education',
      amount: 2000, // 2,000 INR per month
      period: 'monthly',
      notes: 'Education budget for courses, books, and learning materials',
      color: '#06B6D4'
    }
  ];

  return expenseGoals;
};

// Main function to create demo user
async function createDemoUser() {
  try {
    console.log('🚀 Starting demo user creation...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lyfe';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: DEMO_USER.email });
    if (existingUser) {
      console.log('⚠️  Demo user already exists. Deleting existing data...');
      await deleteDemoUserData(existingUser._id);
    }

    // Create demo user
    console.log('👤 Creating demo user...');
    const user = new User(DEMO_USER);
    await user.save();
    console.log('✅ Demo user created:', user.email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    console.log('🔑 JWT token generated');

    // Create goals
    console.log('🎯 Creating goals...');
    const goals = generateGoals();
    const createdGoals = await LifestyleGoal.insertMany(goals.map(goal => ({
      ...goal,
      userId: user._id
    })));
    console.log(`✅ Created ${createdGoals.length} goals`);

    // Create habits with check-ins for 30 days (including today)
    console.log('🔄 Creating habits with 30-day check-ins...');
    const habits = generateHabits(createdGoals.map(g => g._id));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29); // Start 29 days ago to include today
    
    const createdHabits = [];
    for (const habit of habits) {
      const habitDoc = new Habit({
        ...habit,
        userId: user._id
      });
      
      // Add check-ins for the past 30 days
      for (let i = 0; i < 30; i++) {
        const checkinDate = new Date(startDate);
        checkinDate.setDate(checkinDate.getDate() + i);
        
        const completed = Math.random() < 0.8; // 80% completion rate
        const duration = completed ? habit.valueMin + Math.floor(Math.random() * 10) : 0;
        const quality = completed ? ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)] : 'poor';
        
        habitDoc.addCheckin(
          checkinDate,
          completed,
          duration,
          completed ? 'Completed successfully' : 'Missed today',
          quality
        );
      }
      
      await habitDoc.save();
      createdHabits.push(habitDoc);
    }
    console.log(`✅ Created ${createdHabits.length} habits with 30-day check-ins`);

    // Create journal with entries
    console.log('📝 Creating journal with 30-day entries...');
    const journalEntries = generateJournalEntries(startDate, 30);
    const journal = new Journal({
      userId: user._id,
      entries: journalEntries,
      settings: {
        defaultPrivacy: 'private',
        reminderTime: '20:00',
        enableReminders: true,
        journalingPrompts: true
      }
    });
    await journal.save();
    console.log(`✅ Created journal with ${journalEntries.length} entries`);

    // Create food tracking data
    console.log('🍽️  Creating food tracking data...');
    const foodEntries = generateFoodTracking(startDate, 30);
    await FoodTracking.insertMany(foodEntries.map(entry => ({
      ...entry,
      userId: user._id
    })));
    console.log(`✅ Created ${foodEntries.length} food tracking entries`);

    // Create meal data
    console.log('🍽️  Creating meal data...');
    const meals = await generateMeals(startDate, 30);
    await Meal.insertMany(meals.map(meal => ({
      ...meal,
      userId: user._id
    })));
    console.log(`✅ Created ${meals.length} meal entries`);

    // Create tasks
    console.log('📋 Creating tasks...');
    const tasks = generateTasks(startDate, 30);
    await Task.insertMany(tasks.map(task => ({
      ...task,
      userId: user._id
    })));
    console.log(`✅ Created ${tasks.length} tasks`);

    // Create finance data
    console.log('💰 Creating finance data...');
    const financeData = generateFinanceData(startDate, 30);
    await Expense.insertMany(financeData.expenses.map(expense => ({ ...expense, userId: user._id })));
    await Income.insertMany(financeData.income.map(inc => ({ ...inc, userId: user._id })));
    console.log(`✅ Created ${financeData.expenses.length} expenses and ${financeData.income.length} income records`);

    // Create content
    console.log('📚 Creating content...');
    const contentData = generateContent();
    const content = new Content({
      ...contentData,
      userId: user._id
    });
    await content.save();
    console.log(`✅ Created content collection with ${contentData.items.length} items`);

    // Create AI chat
    console.log('🤖 Creating AI chat...');
    const aiChat = new AiChat({
      ...generateAiChat(),
      userId: user._id
    });
    await aiChat.save();
    console.log('✅ Created AI chat conversation');

    // Create mindfulness check-ins
    console.log('🧘 Creating mindfulness check-ins...');
    const mindfulnessCheckins = generateMindfulnessCheckins(startDate, 30);
    await MindfulnessCheckin.insertMany(mindfulnessCheckins.map(checkin => ({
      ...checkin,
      userId: user._id
    })));
    console.log(`✅ Created ${mindfulnessCheckins.length} mindfulness check-ins`);

    // Create book documents with quotes
    console.log('📚 Creating book documents with quotes...');
    const bookDocuments = generateBookDocuments();
    await BookDocument.insertMany(bookDocuments.map(book => ({
      ...book,
      userId: user._id
    })));
    console.log(`✅ Created ${bookDocuments.length} book documents with quotes`);

    // Create expense goals
    console.log('💰 Creating expense goals...');
    const expenseGoals = generateExpenseGoals();
    await ExpenseGoal.insertMany(expenseGoals.map(goal => ({
      ...goal,
      userId: user._id
    })));
    console.log(`✅ Created ${expenseGoals.length} expense goals`);

    console.log('\n🎉 Demo user creation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`🎯 Goals: ${createdGoals.length}`);
    console.log(`🔄 Habits: ${createdHabits.length} (with 30-day check-ins)`);
    console.log(`📝 Journal entries: ${journalEntries.length}`);
    console.log(`🍽️  Food tracking entries: ${foodEntries.length}`);
    console.log(`🍽️  Meal entries: ${meals.length}`);
    console.log(`📋 Tasks: ${tasks.length}`);
    console.log(`💰 Finance records: ${financeData.expenses.length + financeData.income.length}`);
    console.log(`📚 Content items: ${contentData.items.length}`);
    console.log(`🤖 AI chat: 1 conversation`);
    console.log(`🧘 Mindfulness check-ins: ${mindfulnessCheckins.length}`);
    console.log(`📖 Book documents: ${bookDocuments.length} (with quotes)`);
    console.log(`💰 Expense goals: ${expenseGoals.length}`);
    
    console.log('\n🔑 Login credentials:');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${DEMO_USER.password}`);
    console.log(`JWT Token: ${token}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Function to delete existing demo user data
async function deleteDemoUserData(userId) {
  try {
    await Promise.all([
      User.findByIdAndDelete(userId),
      LifestyleGoal.deleteMany({ userId }),
      Habit.deleteMany({ userId }),
      Journal.deleteMany({ userId }),
      FoodTracking.deleteMany({ userId }),
      Meal.deleteMany({ userId }),
      Task.deleteMany({ userId }),
      Expense.deleteMany({ userId }),
      Income.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      Account.deleteMany({ userId }),
      FinanceGoal.deleteMany({ userId }),
      Content.deleteMany({ userId }),
      AiChat.deleteMany({ userId }),
      MindfulnessCheckin.deleteMany({ userId }),
      BookDocument.deleteMany({ userId }),
      ExpenseGoal.deleteMany({ userId })
    ]);
    console.log('✅ Existing demo user data deleted');
  } catch (error) {
    console.error('❌ Error deleting existing data:', error);
  }
}

// Run the script
if (require.main === module) {
  createDemoUser();
}

module.exports = { createDemoUser, deleteDemoUserData };
