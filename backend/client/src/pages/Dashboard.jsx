import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  ArrowRight,
  RefreshCw,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { buildApiUrl } from '../config';
import toast from 'react-hot-toast';
// Note: Food page has its own DailyMealKPIs. Dashboard renders its own compact summary.
import JournalTrends from '../components/journal/JournalTrends';
import {
  FinancialOverview
} from '../components/dashboard';
import { Button, Card, Tooltip, MonthGrid } from '../components/ui';

const Dashboard = () => {
  const { user } = useAuth();
  const [todayTasks, setTodayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [welcomeImage, setWelcomeImage] = useState('/welcome.png');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [dashboardQuotes, setDashboardQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [musicLink, setMusicLink] = useState('https://youtu.be/w0o8JCxjjpM?si=OCQ4TjYlkC8sTpcy');
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [musicPlatform, setMusicPlatform] = useState('youtube');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const youtubePlayerRef = useRef(null);
  
  // Year grid data
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [mindfulnessCheckins, setMindfulnessCheckins] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [showDaySummary, setShowDaySummary] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState(null);
  
  // Safe arrays for MonthGrid compatibility
  const safeHabits = Array.isArray(habits) ? habits : [];
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeMindfulnessCheckins = Array.isArray(mindfulnessCheckins) ? mindfulnessCheckins : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeMeals = Array.isArray(meals) ? meals : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  
  // Image gallery state
  const [imageGallery, setImageGallery] = useState([
    {
      id: 'nature',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: "Nature's Wisdom",
      subtitle: "Find peace in simplicity",
      color: '#1E49C9'
    },
    {
      id: 'abstract',
      src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: "Creative Flow",
      subtitle: "Embrace the unknown",
      color: '#FFD200'
    },
    {
      id: 'minimalist',
      src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: "Less is More",
      subtitle: "Simplicity breeds clarity",
      color: '#1E49C9'
    },
    {
      id: 'urban',
      src: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: "Urban Energy",
      subtitle: "Thrive in the chaos",
      color: '#3EA6FF'
    },
    {
      id: 'zen',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: "Inner Peace",
      subtitle: "Find your center",
      color: '#1E49C9'
    }
  ]);
  
  // Debug: Log state changes
  useEffect(() => {
    console.log('Dashboard showImageUpload changed to:', showImageUpload);
  }, [showImageUpload]);

  useEffect(() => {
    const loadAllData = async () => {
      setIsDataLoading(true);
      try {
        await Promise.all([
          fetchData(),
          fetchDashboardQuotes(),
          loadSavedMusicLink(),
          loadGoals(),
          loadHabits(),
          loadMindfulnessCheckins(),
          loadTasks(),
          loadMeals(),
          loadExpenses()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };
    
    loadAllData();
    
    // Load YouTube Player API
    loadYouTubeAPI();
  }, []);

  const loadYouTubeAPI = () => {
    if (window.YT) {
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
    
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API loaded');
    };
  };

  const loadSavedMusicLink = () => {
    const savedLink = localStorage.getItem('dashboardMusicLink');
    
    if (savedLink) {
      setMusicLink(savedLink);
      
      // Detect platform from the saved link
      const link = savedLink.trim();
      if (link.includes('youtube.com') || link.includes('youtu.be')) {
        setMusicPlatform('youtube');
        // Initialize YouTube player for saved link
        const videoId = extractYouTubeId(link);
        if (videoId) {
          setIsMusicLoading(true);
          initializeYouTubePlayer(videoId);
        }
      } else if (link.includes('spotify.com')) {
        setMusicPlatform('spotify');
      } else if (link.includes('music.apple.com')) {
        setMusicPlatform('apple');
      } else {
        setMusicPlatform('spotify'); // Default fallback
      }
      
      setShowMusicInput(false); // Show the player instead of input
    } else {
      // If no saved music, save the default music to localStorage
      const defaultLink = 'https://youtu.be/w0o8JCxjjpM?si=OCQ4TjYlkC8sTpcy';
      localStorage.setItem('dashboardMusicLink', defaultLink);
      localStorage.setItem('dashboardMusicPlatform', 'youtube');
      setMusicLink(defaultLink);
      setMusicPlatform('youtube');
      setIsMusicLoading(true);
      initializeYouTubePlayer('w0o8JCxjjpM');
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(buildApiUrl('/api/tasks'), {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          date: new Date().toISOString().split('T')[0],
          status: 'completed'
        }
      });

      setTodayTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardQuotes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(buildApiUrl('/api/book-documents/quotes/all'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Dashboard quotes response:', response.data);
      setDashboardQuotes(response.data || []);
    } catch (error) {
      console.error('Error fetching dashboard quotes:', error);
    } finally {
      setQuotesLoading(false);
    }
  };

  // Load year grid data
  const loadGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(buildApiUrl('/api/goals'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGoals(response.data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadHabits = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(buildApiUrl('/api/habits?all=true'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHabits(response.data || []);
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const loadMindfulnessCheckins = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(buildApiUrl('/api/mindfulness'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMindfulnessCheckins(response.data || []);
    } catch (error) {
      console.error('Error loading mindfulness checkins:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, setting tasks to empty array');
        setTasks([]);
        return;
      }

      console.log('Loading tasks...');
      const response = await axios.get(buildApiUrl('/api/tasks'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Tasks response:', response.data);
      setTasks((response.data && response.data.tasks) || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      console.log('Setting tasks to empty array due to error');
      setTasks([]);
    }
  };

  const loadMeals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, setting meals to empty array');
        setMeals([]);
        return;
      }

      console.log('Loading meals...');
      const response = await axios.get(buildApiUrl('/api/meals'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Meals response:', response.data);
      setMeals((response.data && response.data.meals) || []);
    } catch (error) {
      console.error('Error loading meals:', error);
      console.log('Setting meals to empty array due to error');
      setMeals([]);
    }
  };

  const loadExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, setting expenses to empty array');
        setExpenses([]);
        return;
      }

      console.log('Loading expenses...');
      const response = await axios.get(buildApiUrl('/api/finance/expenses'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Expenses response:', response.data);
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      console.log('Setting expenses to empty array due to error');
      setExpenses([]);
    }
  };

  // ===== Dashboard-specific daily nutrition helpers (separate from Food page) =====
  const getTodayMeals = () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return safeMeals.filter(meal => new Date(meal.ts).toLocaleDateString('en-CA') === todayStr);
  };

  const getTodayNutritionTotals = () => {
    const dayMeals = getTodayMeals();
    return dayMeals.reduce((acc, meal) => {
      const totals = meal.computed && meal.computed.totals ? meal.computed.totals : {};
      Object.keys(totals).forEach(key => {
        acc[key] = (acc[key] || 0) + (totals[key] || 0);
      });
      return acc;
    }, {});
  };

  const getTodayEffectsAggregate = () => {
    const dayMeals = getTodayMeals();
    return dayMeals.reduce((acc, meal) => {
      const effects = meal.computed && meal.computed.effects ? meal.computed.effects : {};
      Object.entries(effects).forEach(([effectKey, effectData]) => {
        if (!acc[effectKey]) {
          acc[effectKey] = { score: 0, why: [] };
        }
        acc[effectKey].score += effectData.score || 0;
        if (Array.isArray(effectData.why)) {
          effectData.why.forEach(reason => {
            if (!acc[effectKey].why.includes(reason)) acc[effectKey].why.push(reason);
          });
        }
      });
      return acc;
    }, {});
  };

  // Quote of the Day functions
  const quotes = [
    // Osho quotes
    "Be realistic: Plan for a miracle.",
    "Life is not a problem to be solved, but a reality to be experienced.",
    "The moment you accept yourself, you become beautiful.",
    "Truth is not something outside to be discovered, it is something inside to be realized.",
    "Drop the idea of becoming someone, because you are already a masterpiece.",
    
    // Jiddu Krishnamurti quotes
    "The highest form of intelligence is the ability to observe without evaluating.",
    "Freedom is not a reaction; freedom is not a choice. Freedom is found in the choiceless awareness of our daily existence and activity.",
    "Truth is a pathless land, and you cannot approach it by any path whatsoever, by any religion, by any sect.",
    "It is no measure of health to be well adjusted to a profoundly sick society.",
    "The ability to observe without evaluating is the highest form of intelligence.",
    
    // Mahatma Gandhi quotes
    "Be the change you wish to see in the world.",
    "The future depends on what you do today.",
    "Happiness is when what you think, what you say, and what you do are in harmony.",
    "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    "The weak can never forgive. Forgiveness is the attribute of the strong.",
    
    // Swami Vivekananda quotes
    "Arise, awake, and stop not until the goal is reached.",
    "You cannot believe in God until you believe in yourself.",
    "The greatest sin is to think yourself weak.",
    "Take up one idea. Make that one idea your life - think of it, dream of it, live on that idea.",
    "Strength is life, weakness is death."
  ];

  const authors = [
    "Osho",
    "Osho", 
    "Osho",
    "Osho",
    "Osho",
    "Jiddu Krishnamurti",
    "Jiddu Krishnamurti",
    "Jiddu Krishnamurti", 
    "Jiddu Krishnamurti",
    "Jiddu Krishnamurti",
    "Mahatma Gandhi",
    "Mahatma Gandhi",
    "Mahatma Gandhi",
    "Mahatma Gandhi", 
    "Mahatma Gandhi",
    "Swami Vivekananda",
    "Swami Vivekananda",
    "Swami Vivekananda",
    "Swami Vivekananda",
    "Swami Vivekananda"
  ];

  const getQuoteOfTheDay = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    if (dashboardQuotes.length === 0) {
      // Fallback to hardcoded quotes if no dashboard quotes
      const dailyIndex = dayOfYear % quotes.length;
      return quotes[(dailyIndex + quoteIndex) % quotes.length];
    }
    
    const dailyIndex = dayOfYear % dashboardQuotes.length;
    return dashboardQuotes[(dailyIndex + quoteIndex) % dashboardQuotes.length]?.content || "No quotes available";
  };

  const getQuoteAuthor = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    if (dashboardQuotes.length === 0) {
      // Fallback to hardcoded quotes if no dashboard quotes
      const dailyIndex = dayOfYear % quotes.length;
      return authors[(dailyIndex + quoteIndex) % quotes.length];
    }
    
    const dailyIndex = dayOfYear % dashboardQuotes.length;
    return dashboardQuotes[(dailyIndex + quoteIndex) % dashboardQuotes.length]?.bookAuthor || "Unknown";
  };

  const refreshQuote = () => {
    if (dashboardQuotes.length === 0) {
      setQuoteIndex(prev => (prev + 1) % quotes.length);
    } else {
      setQuoteIndex(prev => (prev + 1) % dashboardQuotes.length);
    }
  };

  const getCurrentQuoteNumber = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    if (dashboardQuotes.length === 0) {
      const dailyIndex = dayOfYear % quotes.length;
      return ((dailyIndex + quoteIndex) % quotes.length) + 1;
    }
    
    const dailyIndex = dayOfYear % dashboardQuotes.length;
    return ((dailyIndex + quoteIndex) % dashboardQuotes.length) + 1;
  };

  const getQuoteSource = () => {
    if (dashboardQuotes.length === 0) return "";
    
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const dailyIndex = dayOfYear % dashboardQuotes.length;
    const currentQuote = dashboardQuotes[(dailyIndex + quoteIndex) % dashboardQuotes.length];
    return currentQuote?.bookTitle || "";
  };

  const handleImageUpload = (e) => {
    console.log('Dashboard image upload triggered:', e.target.files);
    const file = e.target.files[0];
    if (file) {
      console.log('Dashboard file selected:', file.name, file.type, file.size);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log('Dashboard file read successfully, updating image');
          setWelcomeImage(event.target.result);
          setShowImageUpload(false);
          toast.success('Welcome image updated successfully!');
        };
        reader.readAsDataURL(file);
      } else {
        console.log('Dashboard invalid file type:', file.type);
        toast.error('Please select a valid image file');
      }
    } else {
      console.log('Dashboard no file selected');
    }
  };



  const initializeYouTubePlayer = (videoId) => {
    if (window.YT && window.YT.Player) {
      try {
        const player = new window.YT.Player('youtube-player', {
          height: '1',
          width: '1',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'controls': 0,
            'showinfo': 0,
            'rel': 0,
            'modestbranding': 1,
            'loop': 1,
            'playlist': videoId
          },
          events: {
            'onReady': (event) => {
              console.log('YouTube player ready');
              setYoutubePlayer(event.target);
              setIsMusicLoading(false);
            },
            'onError': (event) => {
              console.error('YouTube player error:', event.data);
              toast.error('Failed to load music player. Please check your internet connection.');
              setIsMusicLoading(false);
            }
          }
        });
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
        toast.error('Failed to initialize music player.');
        setIsMusicLoading(false);
      }
    } else {
      console.log('YouTube API not ready, retrying...');
      setTimeout(() => initializeYouTubePlayer(videoId), 1000);
    }
  };

  const handleMusicLinkSubmit = () => {
    if (musicLink.trim()) {
      // Validate and process the music link
      const link = musicLink.trim();
      if (link.includes('youtube.com') || link.includes('youtu.be')) {
        setMusicPlatform('youtube');
        setIsMusicLoading(true);
        toast.success('YouTube link added!');
        
        // Initialize YouTube player
        const videoId = extractYouTubeId(link);
        if (videoId) {
          initializeYouTubePlayer(videoId);
        }
      } else if (link.includes('spotify.com')) {
        setMusicPlatform('spotify');
        toast.success('Spotify link added!');
      } else if (link.includes('music.apple.com')) {
        setMusicPlatform('apple');
        toast.success('Apple Music link added!');
      } else {
        toast.error('Please enter a valid YouTube, Spotify, or Apple Music link');
        return;
      }
      
      // Save to localStorage
      localStorage.setItem('dashboardMusicLink', link);
      localStorage.setItem('dashboardMusicPlatform', musicPlatform);
      
      setShowMusicInput(false);
      toast.success('Music link updated successfully!');
    }
  };

  const handleChangeMusic = () => {
    setShowMusicInput(true);
    setMusicLink(''); // Clear the current link when changing
    setIsMusicLoading(false);
    setIsPlaying(false);
  };

  const handleRemoveMusic = () => {
    setMusicLink('');
    setShowMusicInput(true);
    setIsMusicLoading(false);
    setIsPlaying(false);
    localStorage.removeItem('dashboardMusicLink');
    localStorage.removeItem('dashboardMusicPlatform');
    toast.success('Music link removed!');
  };

  const handlePlayPause = () => {
    if (musicPlatform === 'youtube') {
      if (youtubePlayer) {
        try {
          if (isPlaying) {
            youtubePlayer.pauseVideo();
          } else {
            youtubePlayer.playVideo();
          }
          setIsPlaying(!isPlaying);
        } catch (error) {
          console.error('Error controlling YouTube player:', error);
          toast.error('Unable to control music player. Please try again.');
        }
      } else {
        // Fallback: open in new tab if player not ready
        handleOpenInNewTab();
      }
    } else if (musicPlatform === 'spotify' || musicPlatform === 'apple') {
      // For Spotify and Apple Music, just open in new tab
      handleOpenInNewTab();
    } else {
      setIsPlaying(!isPlaying);
    }
  };


  const handleOpenInNewTab = () => {
    if (musicLink) {
      window.open(musicLink, '_blank', 'noopener,noreferrer');
    }
  };

  const getEmbedUrl = () => {
    if (!musicLink) return null;
    
    const link = musicLink.trim();
    console.log('Current music link:', link);
    
    if (link.includes('youtube.com') || link.includes('youtu.be')) {
      const videoId = extractYouTubeId(link);
      console.log('Extracted video ID:', videoId);
      if (videoId) {
        // Remove autoplay and add enablejsapi for control
        const embedUrl = `https://www.youtube.com/embed/${videoId}?controls=1&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${videoId}&enablejsapi=1`;
        console.log('Generated embed URL:', embedUrl);
        return embedUrl;
      }
    } else if (link.includes('spotify.com')) {
      const spotifyData = extractSpotifyId(link);
      if (spotifyData) {
        return `https://open.spotify.com/embed/${spotifyData.type}/${spotifyData.id}`;
      }
    } else if (link.includes('music.apple.com')) {
      const appleData = extractAppleMusicId(link);
      if (appleData) {
        return `https://embed.music.apple.com/us/album/${appleData.id}`;
      }
    }
    
    return null;
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const extractSpotifyId = (url) => {
    const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    return match ? { type: match[1], id: match[2] } : null;
  };

  const extractAppleMusicId = (url) => {
    const match = url.match(/music\.apple\.com\/.*\/(album|song)\/.*\/(\d+)/);
    return match ? { type: match[1], id: match[2] } : null;
  };

  // Image card component
  const ImageCard = ({ image, className = "", animationClass = "" }) => (
    <div className={`col-span-1 ${className} ${animationClass}`}>
      <Card className="h-full overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
        <div className="relative h-full bg-gradient-to-br from-[#1E49C9]/20 to-[#3EA6FF]/20">
          <img 
            src={image.src}
            alt={image.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 p-4">
            <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="font-jakarta text-lg font-semibold mb-1">{image.title}</h3>
              <p className="text-sm opacity-90">{image.subtitle}</p>
            </div>
          </div>
          <div 
            className="absolute top-4 right-4 w-3 h-3 rounded-full animate-pulse-glow"
            style={{ backgroundColor: image.color }}
          ></div>
        </div>
      </Card>
    </div>
  );

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Good morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoon";
    } else if (hour >= 17 && hour < 21) {
      return "Good evening";
    } else {
      return "Good night";
    }
  };

  // Get today's comprehensive score
  const getTodaysScore = () => {
    if (isDataLoading) return null;
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-CA');
    
    // Calculate mindfulness score
    const mindfulnessScore = safeMindfulnessCheckins.find(checkin => {
      if (!checkin || !checkin.date) return false;
      const checkinDate = new Date(checkin.date).toLocaleDateString('en-CA');
      return dateStr === checkinDate;
    });
    
    let totalScore = 0;
    const breakdown = {
      mindfulness: 0,
      goalProgress: 0,
      habitCompletion: 0,
      mealEffects: 0,
      impulseBuyPenalty: 0
    };
    
    // Mindfulness score (0-25)
    if (mindfulnessScore) {
      // Use the pre-calculated totalScore from the database
      breakdown.mindfulness = mindfulnessScore.totalScore || 0;
    }
    
    // Goal progress score (0-20)
    const completedTasksForGoals = safeTasks.filter(task => {
      if (!task.goalIds || task.goalIds.length === 0) return false;
      if (task.status !== 'completed') return false;
      const taskDate = new Date(task.completedAt || task.updatedAt).toLocaleDateString('en-CA');
      return taskDate === dateStr;
    });
    
    if (completedTasksForGoals.length > 0) {
      breakdown.goalProgress = 10;
      if (completedTasksForGoals.length >= 2) breakdown.goalProgress += 5;
      if (completedTasksForGoals.length >= 3) breakdown.goalProgress += 5;
    }
    
    // Habit completion score (0-15)
    let completedCount = 0;
    let totalCount = 0;
    
    safeHabits.forEach(habit => {
      if (!habit || !habit.startDate || !habit.endDate) return;
      const checkDate = new Date(today);
      checkDate.setHours(0, 0, 0, 0);
      const startDate = new Date(habit.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(habit.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      if (habit.isActive && checkDate >= startDate && checkDate <= endDate) {
        totalCount++;
        const checkin = habit.checkins?.find(c => {
          const checkinDate = new Date(c.date).toLocaleDateString('en-CA');
          return checkinDate === dateStr && c.completed;
        });
        if (checkin) completedCount++;
      }
    });
    
    if (totalCount > 0) {
      const completionRate = completedCount / totalCount;
      breakdown.habitCompletion = Math.round(completionRate * 15);
    }
    
    // Meal effects score (0-25)
    const dayMeals = safeMeals.filter(meal => {
      const mealDate = new Date(meal.ts).toLocaleDateString('en-CA');
      return mealDate === dateStr;
    });
    
    if (dayMeals.length > 0) {
      let totalMealScore = 0;
      let mealCount = 0;
      
      dayMeals.forEach(meal => {
        if (!meal.computed?.effects) return;
        const effects = meal.computed.effects;
        let mealScore = 0;
        
        const positiveEffects = ['strength', 'antiInflammatory', 'immunity', 'gutFriendly', 'energizing'];
        positiveEffects.forEach(effect => {
          if (effects[effect]?.score) {
            mealScore += Math.round(effects[effect].score / 2);
          }
        });
        
        const negativeEffects = ['inflammation', 'fatForming'];
        negativeEffects.forEach(effect => {
          if (effects[effect]?.score) {
            mealScore -= Math.round(effects[effect].score / 2);
          }
        });
        
        totalMealScore += Math.max(0, mealScore);
        mealCount++;
      });
      
      // Cap the meal effects score at 25 points total
      breakdown.mealEffects = Math.min(Math.round(totalMealScore), 25);
    }
    
    // Impulse buy penalty (0 to -10)
    const dayExpenses = safeExpenses.filter(expense => {
      const expenseDate = new Date(expense.date).toLocaleDateString('en-CA');
      return expenseDate === dateStr;
    });
    
    const impulseExpenses = dayExpenses.filter(expense => expense.impulseBuy === true);
    if (impulseExpenses.length > 0) {
      let penalty = 0;
      impulseExpenses.forEach(expense => {
        if (expense.amount > 1000) penalty += 3;
        else if (expense.amount > 500) penalty += 2;
        else if (expense.amount > 100) penalty += 1;
        else penalty += 0.5;
      });
      breakdown.impulseBuyPenalty = Math.min(penalty, 10);
    }
    
    totalScore = Math.max(0, breakdown.mindfulness + breakdown.goalProgress + breakdown.habitCompletion + breakdown.mealEffects - breakdown.impulseBuyPenalty);
    
    return { totalScore, breakdown };
  };

  // Get detailed day data for popup
  const getDetailedDayData = (date) => {
    const dateStr = date.toLocaleDateString('en-CA');
    
    // Get mindfulness data for the day
    const mindfulnessCheckin = safeMindfulnessCheckins.find(checkin => {
      if (!checkin || !checkin.date) return false;
      const checkinDate = new Date(checkin.date).toLocaleDateString('en-CA');
      return dateStr === checkinDate;
    });
    
    // Get tasks completed on this day
    const dayTasks = safeTasks.filter(task => {
      if (task.status !== 'completed') return false;
      const taskDate = new Date(task.completedAt || task.updatedAt).toLocaleDateString('en-CA');
      return taskDate === dateStr;
    });
    
    // Get habits completed on this day
    const dayHabits = safeHabits.filter(habit => {
      if (!habit.isActive) return false;
      const checkin = habit.checkins?.find(c => {
        const checkinDate = new Date(c.date).toLocaleDateString('en-CA');
        return checkinDate === dateStr && c.completed;
      });
      return !!checkin;
    });
    
    // Get meals logged on this day
    const dayMeals = safeMeals.filter(meal => {
      const mealDate = new Date(meal.ts).toLocaleDateString('en-CA');
      return mealDate === dateStr;
    });
    
    // Get expenses for this day
    const dayExpenses = safeExpenses.filter(expense => {
      const expenseDate = new Date(expense.date).toLocaleDateString('en-CA');
      return expenseDate === dateStr;
    });
    
    // Get journal entries for this day
    const dayJournalEntries = []; // Add journal data if available
    
    // Calculate nutrition totals
    const nutritionTotals = dayMeals.reduce((acc, meal) => {
      const totals = meal.computed && meal.computed.totals ? meal.computed.totals : {};
      Object.keys(totals).forEach(key => {
        acc[key] = (acc[key] || 0) + (totals[key] || 0);
      });
      return acc;
    }, {});
    
    // Calculate meal effects
    const mealEffects = dayMeals.reduce((acc, meal) => {
      const effects = meal.computed && meal.computed.effects ? meal.computed.effects : {};
      Object.entries(effects).forEach(([effectKey, effectData]) => {
        if (!acc[effectKey]) {
          acc[effectKey] = { score: 0, why: [] };
        }
        acc[effectKey].score += effectData.score || 0;
        if (Array.isArray(effectData.why)) {
          effectData.why.forEach(reason => {
            if (!acc[effectKey].why.includes(reason)) acc[effectKey].why.push(reason);
          });
        }
      });
      return acc;
    }, {});
    
    return {
      date: date,
      dateStr: dateStr,
      mindfulnessCheckin,
      tasks: dayTasks,
      habits: dayHabits,
      meals: dayMeals,
      expenses: dayExpenses,
      journalEntries: dayJournalEntries,
      nutritionTotals,
      mealEffects
    };
  };

  // Handle day click to show popup
  const handleDayClick = (date) => {
    const dayData = getDetailedDayData(date);
    setSelectedDayData(dayData);
    setShowDaySummary(true);
  };

  // Get goals progress for today
  const getGoalsProgress = () => {
    if (isDataLoading || !goals || goals.length === 0) return [];
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-CA');
    
    return goals.map(goal => {
      // Count tasks completed for this goal today
      const completedTasks = safeTasks.filter(task => {
        if (!task.goalIds || !task.goalIds.includes(goal._id)) return false;
        if (task.status !== 'completed') return false;
        const taskDate = new Date(task.completedAt || task.updatedAt).toLocaleDateString('en-CA');
        return taskDate === dateStr;
      });
      
      // Count habits completed for this goal today
      const completedHabits = safeHabits.filter(habit => {
        if (!habit.goalIds || !habit.goalIds.includes(goal._id)) return false;
        if (!habit.isActive) return false;
        
        const checkin = habit.checkins?.find(c => {
          const checkinDate = new Date(c.date).toLocaleDateString('en-CA');
          return checkinDate === dateStr && c.completed;
        });
        return !!checkin;
      });
      
      // Calculate progress percentage based on target hours
      const todayHours = completedTasks.reduce((sum, task) => {
        return sum + (task.estimatedHours || 0);
      }, 0);
      
      const progressPercentage = goal.targetHours > 0 
        ? Math.min((todayHours / goal.targetHours) * 100, 100)
        : 0;
      
      return {
        ...goal,
        completedTasks: completedTasks.length,
        completedHabits: completedHabits.length,
        todayHours: Math.round(todayHours * 10) / 10,
        progressPercentage: Math.round(progressPercentage)
      };
    }).sort((a, b) => b.progressPercentage - a.progressPercentage);
  };

  const getPlatformIcon = () => {
    switch (musicPlatform) {
      case 'youtube':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'spotify':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        );
      case 'apple':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0C0F] via-[#11151A] to-[#0A0C0F] p-4 md:p-6">
      {/* Enhanced Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-jakarta text-3xl md:text-4xl font-bold text-white mb-2">
              {getTimeBasedGreeting()}, {user?.firstName || 'User'}! 👋
            </h1>
            <p className="font-jakarta text-lg text-white/70">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          {/* Today's Score Only */}
          <div className="flex flex-wrap gap-4">
            {(() => {
              const todaysScore = getTodaysScore();
              if (!todaysScore) return null;
              
              const { totalScore, breakdown } = todaysScore;
              return (
                <div className="relative group">
                  <div className="flex items-center bg-white/5 backdrop-blur-md rounded-xl px-6 py-3 border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-help">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{totalScore || 0}</div>
                      <div className="text-xs text-white/60">Today's Score</div>
                    </div>
                  </div>
                  
                  {/* Custom Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-lg p-4 space-y-3 min-w-[280px] shadow-2xl">
                      <div className="text-lg font-semibold text-white mb-3">Score Breakdown</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Mindfulness</span>
                          <span className="text-white font-medium">{breakdown.mindfulness}/25</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Goal Progress</span>
                          <span className="text-white font-medium">{breakdown.goalProgress}/20</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Habit Completion</span>
                          <span className="text-white font-medium">{breakdown.habitCompletion}/15</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Meal Effects</span>
                          <span className="text-white font-medium">{breakdown.mealEffects}/25</span>
                        </div>
                        {breakdown.impulseBuyPenalty > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-red-400">Impulse Buy Penalty</span>
                            <span className="text-red-400 font-medium">-{breakdown.impulseBuyPenalty}</span>
                          </div>
                        )}
                        <div className="border-t border-white/20 pt-2 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-semibold">Total Score</span>
                            <span className="text-white font-bold text-lg">{totalScore || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-t-gray-900/95 border-t-4 border-x-4 border-x-transparent"></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Enhanced Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[minmax(200px,auto)] [&>*:nth-child(odd)]:animate-fade-in [&>*:nth-child(even)]:animate-fade-in-delayed">
        

         {/* Quick Actions Card - 1x1 */}
        <div className="col-span-1">
          <Card className="h-full group hover:shadow-xl transition-all duration-300">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-jakarta text-lg font-semibold text-white">Quick Actions</h3>
                <div className="w-8 h-8 bg-[#1E49C9]/20 rounded-full flex items-center justify-center">
                  <span className="text-sm">⚡</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 flex-1">
                {[
                  { label: 'Add Task', icon: '📝', href: '/goal-aligned-day', color: 'bg-blue-500/20 border-blue-500/30' },
                  { label: 'Log Meal', icon: '🍽️', href: '/food', color: 'bg-green-500/20 border-green-500/30' },
                  { label: 'Journal', icon: '📖', href: '/journal', color: 'bg-purple-500/20 border-purple-500/30' },
                  { label: 'Mindfulness', icon: '🧘', href: '/goal-aligned-day', color: 'bg-orange-500/20 border-orange-500/30' },
                  { label: 'Add Expense', icon: '💰', href: '/finance', color: 'bg-yellow-500/20 border-yellow-500/30' },
                  { label: 'Set Goal', icon: '🎯', href: '/goal-aligned-day', color: 'bg-pink-500/20 border-pink-500/30' }
                ].map((action, index) => (
                  <motion.a
                    key={action.label}
                    href={action.href}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${action.color} backdrop-blur-sm rounded-xl p-3 border hover:scale-105 transition-all duration-200 group cursor-pointer`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-200">
                        {action.icon}
                      </div>
                      <div className="text-xs font-medium text-white/90">
                        {action.label}
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Random Image Card 1 - Nature */}
        <div className="col-span-1 animate-fade-in">
          <Card className="h-full overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="relative h-full bg-gradient-to-br from-[#1E49C9]/20 to-[#3EA6FF]/20">
              <img 
                src="/images/dashboard/nature.jpg"
                alt="Nature Inspiration"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 p-4">
                <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="font-jakarta text-lg font-semibold mb-1">Nature's Wisdom</h3>
                  <p className="text-sm opacity-90">Find peace in simplicity</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 w-3 h-3 bg-[#1E49C9] rounded-full animate-pulse-glow"></div>
            </div>
          </Card>
        </div>

        {/* Music Card - 1x1 */}
        <div className="col-span-1">
          <Card className="h-full group relative">
            <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.15)] rounded-xl p-4 backdrop-blur-[28px] backdrop-saturate-[140%] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_6px_-1px_rgba(0,0,0,0.1)]">
              {/* Music Link Input */}
              {showMusicInput ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-[#1E49C9] bg-opacity-20 rounded-lg">
                      {getPlatformIcon()}
                    </div>
                    <h4 className="font-jakarta text-sm font-semibold text-text-primary">Add Music Link</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Paste YouTube, Spotify, or Apple Music link..."
                        value={musicLink}
                        onChange={(e) => setMusicLink(e.target.value)}
                        className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.15)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:border-[#1E49C9] focus:outline-none"
                      />
                      <button
                        onClick={handleMusicLinkSubmit}
                        className="px-4 py-2 bg-[#1E49C9] text-white rounded-lg hover:bg-[#1E49C9]/80 transition-colors text-sm font-medium"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowMusicInput(false)}
                        className="px-4 py-2 bg-[rgba(255,255,255,0.1)] text-text-secondary rounded-lg hover:bg-[rgba(255,255,255,0.2)] transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="text-xs text-text-secondary bg-background-secondary/50 rounded-lg p-2">
                      <strong>Note:</strong> Music links will be displayed as track information. Click "Open" to play the track in the original platform.
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Custom Track Display */}
                  {musicLink && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="p-1 bg-[#1E49C9] bg-opacity-20 rounded">
                          {getPlatformIcon()}
                        </div>
                        <h4 className="font-jakarta text-sm font-semibold text-text-primary">
                          Now Playing
                        </h4>
                      </div>
                      
                      {/* Gramophone Player */}
                      <div className="flex flex-col items-center justify-center py-8">
                        {/* Hidden YouTube Player for Audio */}
                        {musicPlatform === 'youtube' && (
                          <div
                            ref={youtubePlayerRef}
                            className="absolute opacity-0 pointer-events-none w-1 h-1"
                            id="youtube-player"
                          ></div>
                        )}
                        
                        {/* Gramophone Base */}
                        <div className="relative flex flex-col items-center">
                          {/* Glassmorphic Gramophone Visual with Primary Color */}
                          <div className="relative w-32 h-32 mx-auto">
                            {/* Gramophone Base - Glassmorphic with Primary Color */}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-16 bg-gradient-to-t from-[rgba(30,73,201,0.2)] to-[rgba(30,73,201,0.1)] backdrop-blur-md rounded-t-full border border-[rgba(30,73,201,0.3)] shadow-[0_8px_32px_rgba(30,73,201,0.2)]">
                              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-20 h-2 bg-[rgba(30,73,201,0.3)] backdrop-blur-sm rounded-full"></div>
                            </div>
                            
                            {/* Horn - Glassmorphic with Primary Color */}
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[40px] border-b-[rgba(30,73,201,0.2)] backdrop-blur-sm"></div>
                            
                            {/* Record - Glassmorphic with Primary Color */}
                            <div className={`absolute top-8 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-[rgba(30,73,201,0.15)] to-[rgba(30,73,201,0.08)] backdrop-blur-md rounded-full border border-[rgba(30,73,201,0.3)] shadow-[0_8px_32px_rgba(30,73,201,0.2)] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[rgba(30,73,201,0.4)] backdrop-blur-sm rounded-full border border-[rgba(30,73,201,0.2)]"></div>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[rgba(30,73,201,0.6)] rounded-full"></div>
                              {/* Grooves - Glassmorphic with Primary Color */}
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-[rgba(30,73,201,0.2)] rounded-full opacity-30"></div>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-[rgba(30,73,201,0.2)] rounded-full opacity-20"></div>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-[rgba(30,73,201,0.2)] rounded-full opacity-10"></div>
                            </div>
                            
                            {/* Tonearm - Glassmorphic with Primary Color */}
                            <div className={`absolute top-12 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[rgba(30,73,201,0.3)] backdrop-blur-sm rounded-full origin-left border border-[rgba(30,73,201,0.2)] ${isPlaying ? 'animate-pulse' : ''}`} style={{ transform: 'translateX(-50%) rotate(-15deg)' }}>
                              <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-[rgba(30,73,201,0.5)] backdrop-blur-sm rounded-full border border-[rgba(30,73,201,0.2)]"></div>
                            </div>
                            
                            {/* Sound Waves - Glassmorphic with Primary Color */}
                            {isPlaying && (
                              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <div className="flex space-x-1">
                                  <div className="w-1 h-4 bg-[rgba(30,73,201,0.4)] backdrop-blur-sm rounded-full animate-pulse border border-[rgba(30,73,201,0.2)]" style={{ animationDelay: '0s' }}></div>
                                  <div className="w-1 h-6 bg-[rgba(30,73,201,0.4)] backdrop-blur-sm rounded-full animate-pulse border border-[rgba(30,73,201,0.2)]" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-1 h-3 bg-[rgba(30,73,201,0.4)] backdrop-blur-sm rounded-full animate-pulse border border-[rgba(30,73,201,0.2)]" style={{ animationDelay: '0.2s' }}></div>
                                  <div className="w-1 h-5 bg-[rgba(30,73,201,0.4)] backdrop-blur-sm rounded-full animate-pulse border border-[rgba(30,73,201,0.2)]" style={{ animationDelay: '0.3s' }}></div>
                                  <div className="w-1 h-2 bg-[rgba(30,73,201,0.4)] backdrop-blur-sm rounded-full animate-pulse border border-[rgba(30,73,201,0.2)]" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Play/Pause Button - Glassmorphic with Primary Color - Centered */}
                          <div className="flex justify-center mt-6">
                            <button
                              onClick={handlePlayPause}
                              disabled={isMusicLoading}
                              className="w-12 h-12 bg-[rgba(30,73,201,0.2)] backdrop-blur-md border border-[rgba(30,73,201,0.3)] rounded-full flex items-center justify-center text-white hover:bg-[rgba(30,73,201,0.3)] transition-all duration-300 shadow-[0_8px_32px_rgba(30,73,201,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isMusicLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              ) : isPlaying ? (
                                <div className="flex space-x-1">
                                  <div className="w-1 h-4 bg-white rounded"></div>
                                  <div className="w-1 h-4 bg-white rounded"></div>
                                </div>
                              ) : (
                                <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-1"></div>
                              )}
                            </button>
                          </div>
                          
                          {/* Track Info */}
                          <div className="mt-4 text-center">
                            <h4 className="font-jakarta text-sm font-semibold text-text-primary">
                              {musicPlatform === 'youtube' ? 'YouTube Music' : 
                               musicPlatform === 'spotify' ? 'Spotify' : 
                               musicPlatform === 'apple' ? 'Apple Music' : 'Custom Track'}
                            </h4>
                            <p className="font-jakarta text-xs text-text-secondary">
                              {isMusicLoading ? 'Loading...' : isPlaying ? 'Now Playing' : 'Paused'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Music Controls - Hover Icons */}
                  {musicLink && (
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Tooltip content="Change Music Link" position="bottom">
                        <button
                          onClick={handleChangeMusic}
                          className="w-8 h-8 bg-[#1E49C9] text-white rounded-full flex items-center justify-center hover:bg-[#1E49C9]/80 transition-colors shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 01-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </Tooltip>
                      <Tooltip content="Remove Music Link" position="bottom">
                        <button 
                          onClick={handleRemoveMusic}
                          className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </Tooltip>
                    </div>
                  )}
                
                  {/* No Music State */}
                  {!musicLink && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-[#2A313A] rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="h-8 w-8 text-[#C9D1D9]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                        </svg>
                      </div>
                      <h3 className="font-jakarta text-lg font-semibold text-text-primary mb-2">No Music Added</h3>
                      <p className="font-jakarta text-text-secondary mb-4">Add your favorite music to get started</p>
                      <button
                        onClick={() => setShowMusicInput(true)}
                        className="px-4 py-2 bg-[#1E49C9] text-white text-sm rounded-lg hover:bg-[#1E49C9]/80 transition-colors"
                      >
                        ADD MUSIC
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quote Card - 1x1 */}
        <div className="col-span-1">
          <Card className="h-full group relative" animate={false}>
            <div className="h-full flex flex-col justify-center items-center p-6 relative">
              {/* Refresh Button - Only visible on hover */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={refreshQuote}
                  className="p-1.5 text-[#1E49C9] hover:text-[#1E49C9]/80 hover:bg-[#2A313A] rounded-full transition-all duration-200"
                  title="Get a new quote"
                >
                  <RefreshCw size={14} className="hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
              
              {quotesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E49C9]"></div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 w-full h-full flex flex-col justify-center">
                  {/* Quote - Major Emphasis with Enhanced Typography */}
                  <blockquote className="font-jakarta text-lg sm:text-xl lg:text-2xl font-light text-text-primary italic leading-relaxed text-center">
                    "{getQuoteOfTheDay()}"
                  </blockquote>
                  
                  {/* Author - Secondary Emphasis with Right Alignment */}
                  <div className="text-right">
                    <cite className="font-jakarta text-xs sm:text-sm text-[#1E49C9] font-medium leading-relaxed tracking-wider block">
                      — {getQuoteAuthor()}
                    </cite>
                    
                    {/* Source - Tertiary Emphasis */}
                    {dashboardQuotes.length > 0 && getQuoteSource() && (
                      <p className="font-jakarta text-xs text-text-secondary mt-1">
                        from <span className="text-[#1E49C9] font-medium">{getQuoteSource()}</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Add Quotes Hint - Least Emphasis */}
                  {dashboardQuotes.length === 0 && !quotesLoading && (
                    <p className="font-jakarta text-xs text-text-secondary opacity-40 mt-2 text-center px-2">
                      Add quotes in Content tab to see them here
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>


        {/* Year Grid Row */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <div className="h-full">
            {/* Year Grid - Takes up full width */}
            <div>
              <Card className="h-full">
                <div className="p-6">
                  {isDataLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E49C9]"></div>
                      <span className="ml-3 text-[#94A3B8]">Loading year data...</span>
                    </div>
                  ) : (
                    <MonthGrid
                      selectedDate={selectedDate}
                      habits={habits}
                      goals={goals}
                      mindfulnessCheckins={mindfulnessCheckins}
                      tasks={tasks}
                      meals={meals}
                      expenses={expenses}
                      onDateSelect={handleDayClick}
                      onMonthChange={setSelectedDate}
                    />
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>



        {/* Financial Overview - 2x1 */}
        <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
          <div className="h-full">
            <FinancialOverview />
          </div>
        </div>


        {/* Random Image Card 2 - Abstract */}
        <div className="col-span-1 animate-fade-in-delayed">
          <Card className="h-full overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="relative h-full bg-gradient-to-br from-[#FFD200]/20 to-[#D64545]/20">
              <img 
                src="/images/dashboard/abstract.jpg"
                alt="Abstract Art"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 p-4">
                <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="font-jakarta text-lg font-semibold mb-1">Creative Flow</h3>
                  <p className="text-sm opacity-90">Embrace the unknown</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 w-3 h-3 bg-[#FFD200] rounded-full animate-pulse-glow"></div>
            </div>
          </Card>
        </div>

        {/* Goals Progress - 2x1 */}
        <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
          <Card className="h-full flex flex-col">
          <div className="flex justify-end mb-6">
            <a href="/goal-aligned-day" className="font-jakarta text-sm text-[#1E49C9] hover:text-[#1E49C9]/80 font-medium flex items-center justify-center leading-relaxed tracking-wider border border-[#2A313A] px-3 py-2 rounded hover:bg-[#2A313A] transition-all duration-200">
              VIEW DETAILS <ArrowRight size={16} className="ml-1" />
            </a>
          </div>
          
          <div className="flex-1 flex flex-col">
          {isDataLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : getGoalsProgress().length > 0 ? (
              <div className="space-y-4 flex-1">
              {/* Goals Progress Cards */}
                <div className="space-y-3">
                  {getGoalsProgress().slice(0, 4).map((goal, index) => (
                    <div key={goal._id || index} className="bg-[#11151A]/50 rounded-lg p-4 border border-[#2A313A] hover:border-[#1E49C9]/30 transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-[#E8EEF2] truncate flex-1">
                          {goal.name}
                        </h4>
                        <div className="flex items-center space-x-3 text-xs text-[#94A3B8]">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{goal.todayHours}h / {goal.targetHours || 0}h</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-[#1E49C9] rounded-full"></span>
                            <span>{goal.completedTasks} tasks</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-[#3EA6FF] rounded-full"></span>
                            <span>{goal.completedHabits} habits</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-[#2A313A] rounded-full h-2 mb-2">
                        <div 
                          className="bg-gradient-to-r from-[#1E49C9] to-[#1E49C9] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${goal.progressPercentage}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                        <span>{goal.progressPercentage}% complete</span>
                        <span className="font-mono">{goal.completedTasks + goal.completedHabits} activities today</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          ) : (
              <div className="text-center py-8 flex-1 flex flex-col justify-center">
              <div className="w-16 h-16 bg-[#2A313A] rounded-full mx-auto mb-4 flex items-center justify-center">
                <Clock className="text-[#C9D1D9]" size={24} />
              </div>
              <h3 className="font-jakarta text-lg font-semibold text-text-primary mb-2">No Goals Set</h3>
              <p className="font-jakarta text-text-secondary mb-4">Create some goals to track your progress</p>
              <Button
                onClick={() => window.location.href = '/goal-aligned-day'}
                variant="primary"
                className="inline-flex items-center"
              >
                CREATE GOALS
              </Button>
            </div>
          )}
          </div>
          </Card>
        </div>


        {/* Daily Nutrition (Dashboard summary) - 1x1 */}
        <div className="col-span-1">
          <Card className="h-full group hover:shadow-xl transition-all duration-300">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-jakarta text-lg font-semibold text-white">Daily Nutrition</h3>
                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <span className="text-sm">🍎</span>
                </div>
              </div>
              {(() => {
                const totals = getTodayNutritionTotals();
                const effects = getTodayEffectsAggregate();
                const dayMeals = getTodayMeals();
                if (dayMeals.length === 0) {
                  return (
                    <div className="text-center py-8 flex-1 flex flex-col justify-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">🍽️</span>
                      </div>
                      <h4 className="font-jakarta text-lg font-semibold text-white mb-2">No Meals Logged</h4>
                      <p className="font-jakarta text-sm text-white/60 mb-4">Start tracking your nutrition today</p>
                      <a 
                        href="/food" 
                        className="inline-flex items-center px-4 py-2 bg-[#1E49C9] text-white text-sm rounded-lg hover:bg-[#1E49C9]/80 transition-colors"
                      >
                        Log Meal
                      </a>
                    </div>
                  );
                }
                return (
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <div className="text-xl font-bold text-white">{Math.round(totals.kcal || 0)}</div>
                        <div className="text-xs text-white/60">kcal</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <div className="text-xl font-bold text-white">{Math.round(totals.protein || 0)}g</div>
                        <div className="text-xs text-white/60">protein</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <div className="text-xl font-bold text-white">{Math.round(totals.carbs || 0)}g</div>
                        <div className="text-xs text-white/60">carbs</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <div className="text-xl font-bold text-white">{Math.round(totals.fat || 0)}g</div>
                        <div className="text-xs text-white/60">fat</div>
                      </div>
                    </div>
                    {Object.keys(effects).length > 0 && (
                      <div>
                        <div className="text-xs text-white/60 mb-2 font-medium">Meal Effects</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(effects)
                            .filter(([, d]) => (d.score || 0) > 0)
                            .sort((a, b) => (b[1].score || 0) - (a[1].score || 0))
                            .slice(0, 6)
                            .map(([key, d]) => (
                              <span key={key} className="px-3 py-1 text-xs rounded-full bg-white/10 border border-white/20 text-white/80 font-medium">
                                {key} ({Math.round(d.score)})
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </Card>
        </div>
        
        {/* Bottom Section Divider */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>
        </div>

        {/* Bottom Section - Improved Layout */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Journal Trends - Now in a proper card container */}
            <div className="md:col-span-2 lg:col-span-2 xl:col-span-2">
              <Card className="h-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-jakarta text-lg font-semibold text-white">Journal Insights</h3>
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-sm">📊</span>
                    </div>
                  </div>
                  <JournalTrends />
                </div>
              </Card>
            </div>

            {/* Urban Image Card - Better positioned */}
            <div className="col-span-1 lg:col-span-1 xl:col-span-1 animate-fade-in-delayed">
              <Card className="h-full overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="relative h-full bg-gradient-to-br from-[#3EA6FF]/20 to-[#FFD200]/20">
                  <img 
                    src="/images/dashboard/urban.jpg"
                    alt="Urban Landscape"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 p-4">
                    <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="font-jakarta text-lg font-semibold mb-1">Urban Energy</h3>
                      <p className="text-sm opacity-90">Thrive in the chaos</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 w-3 h-3 bg-[#3EA6FF] rounded-full animate-pulse-glow"></div>
                </div>
              </Card>
            </div>

            {/* Zen Image Card - Better positioned */}
            <div className="col-span-1 lg:col-span-1 xl:col-span-1 animate-fade-in">
              <Card className="h-full overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="relative h-full bg-gradient-to-br from-[#1E49C9]/20 to-[#1E49C9]/20">
                  <img 
                    src="/images/dashboard/zen.jpg"
                    alt="Zen Garden"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 p-4">
                    <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="font-jakarta text-lg font-semibold mb-1">Inner Peace</h3>
                      <p className="text-sm opacity-90">Find your center</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 w-3 h-3 bg-[#1E49C9] rounded-full animate-pulse-glow"></div>
                </div>
              </Card>
            </div>

          </div>
        </div>

        {/* Additional Bottom Section - Quick Summary Cards */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Today's Focus */}
            <Card className="h-full group hover:shadow-xl transition-all duration-300">
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-jakarta text-sm font-semibold text-white">Today's Focus</h4>
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs">🎯</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {(() => {
                        const todaysScore = getTodaysScore();
                        return todaysScore ? todaysScore.totalScore : '--';
                      })()}
                    </div>
                    <div className="text-xs text-white/60">Overall Score</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="h-full group hover:shadow-xl transition-all duration-300">
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-jakarta text-sm font-semibold text-white">Quick Stats</h4>
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs">📈</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Tasks Done:</span>
                    <span className="text-white font-medium">{todayTasks.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Meals Logged:</span>
                    <span className="text-white font-medium">{getTodayMeals().length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Goals Active:</span>
                    <span className="text-white font-medium">{goals.filter(g => g.isActive).length}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Weekly Progress */}
            <Card className="h-full group hover:shadow-xl transition-all duration-300">
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-jakarta text-sm font-semibold text-white">This Week</h4>
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs">📅</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white mb-1">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xs text-white/60">Current Day</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Next Action */}
            <Card className="h-full group hover:shadow-xl transition-all duration-300">
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-jakarta text-sm font-semibold text-white">Next Action</h4>
                  <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs">⚡</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-center">
                    <div className="text-sm text-white/80 mb-2">Ready to continue your journey?</div>
                    <a 
                      href="/goal-aligned-day" 
                      className="inline-block px-3 py-1 bg-[#1E49C9] text-white text-xs rounded-lg hover:bg-[#1E49C9]/80 transition-colors"
                    >
                      Plan Today
                    </a>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>

      {/* Day Summary Modal */}
      <AnimatePresence>
        {showDaySummary && selectedDayData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDaySummary(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#11151A] border-2 border-[#2A313A] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-jakarta text-2xl font-bold text-white">
                    {selectedDayData.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <p className="text-white/60 text-sm mt-1">Daily Summary</p>
                </div>
                <button
                  onClick={() => setShowDaySummary(false)}
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <span className="text-white text-lg">×</span>
                </button>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tasks Completed */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">✅</span>
                    <h4 className="font-jakarta text-lg font-semibold text-white">Tasks Completed</h4>
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                      {selectedDayData.tasks.length}
                    </span>
                  </div>
                  {selectedDayData.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDayData.tasks.slice(0, 3).map((task, index) => (
                        <div key={index} className="text-sm text-white/80 bg-white/5 rounded-lg p-2">
{task.title || 'Task completed'}
                        </div>
                      ))}
                      {selectedDayData.tasks.length > 3 && (
                        <div className="text-xs text-white/60">
                          +{selectedDayData.tasks.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">No tasks completed this day</p>
                  )}
                </div>

                {/* Habits Tracked */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">🔄</span>
                    <h4 className="font-jakarta text-lg font-semibold text-white">Habits Tracked</h4>
                    <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                      {selectedDayData.habits.length}
                    </span>
                  </div>
                  {selectedDayData.habits.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDayData.habits.slice(0, 3).map((habit, index) => (
                        <div key={index} className="text-sm text-white/80 bg-white/5 rounded-lg p-2">
{habit.name || 'Habit completed'}
                        </div>
                      ))}
                      {selectedDayData.habits.length > 3 && (
                        <div className="text-xs text-white/60">
                          +{selectedDayData.habits.length - 3} more habits
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">No habits tracked this day</p>
                  )}
                </div>

                {/* Mindfulness Check-in */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">🧘</span>
                    <h4 className="font-jakarta text-lg font-semibold text-white">Mindfulness</h4>
                    {selectedDayData.mindfulnessCheckin ? (
                      <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full">
                        {selectedDayData.mindfulnessCheckin.totalScore || 0}/25
                      </span>
                    ) : (
                      <span className="bg-gray-500/20 text-gray-400 text-xs px-2 py-1 rounded-full">
                        No check-in
                      </span>
                    )}
                  </div>
                  {selectedDayData.mindfulnessCheckin ? (
                    <div className="space-y-2">
                      <div className="text-sm text-white/80">
                        Overall Score: {selectedDayData.mindfulnessCheckin.totalScore || 0}/25
                      </div>
                      {selectedDayData.mindfulnessCheckin.dimensions && (
                        <div className="text-xs text-white/60">
                          Dimensions: {Object.keys(selectedDayData.mindfulnessCheckin.dimensions).length} rated
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">No mindfulness check-in this day</p>
                  )}
                </div>

                {/* Meals Logged */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">🍽️</span>
                    <h4 className="font-jakarta text-lg font-semibold text-white">Meals Logged</h4>
                    <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full">
                      {selectedDayData.meals.length}
                    </span>
                  </div>
                  {selectedDayData.meals.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-white/80">
                        Calories: {Math.round(selectedDayData.nutritionTotals.kcal || 0)} kcal
                      </div>
                      <div className="text-sm text-white/80">
                        Protein: {Math.round(selectedDayData.nutritionTotals.protein || 0)}g
                      </div>
                      {Object.keys(selectedDayData.mealEffects).length > 0 && (
                        <div className="text-xs text-white/60">
                          {Object.keys(selectedDayData.mealEffects).length} effects tracked
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">No meals logged this day</p>
                  )}
                </div>

                {/* Expenses */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">💰</span>
                    <h4 className="font-jakarta text-lg font-semibold text-white">Expenses</h4>
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                      {selectedDayData.expenses.length}
                    </span>
                  </div>
                  {selectedDayData.expenses.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-white/80">
                        Total: ₹{selectedDayData.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)}
                      </div>
                      {selectedDayData.expenses.filter(exp => exp.impulseBuy).length > 0 && (
                        <div className="text-xs text-red-400">
                          {selectedDayData.expenses.filter(exp => exp.impulseBuy).length} impulse buys
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">No expenses recorded this day</p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">⚡</span>
                    <h4 className="font-jakarta text-lg font-semibold text-white">Quick Actions</h4>
                  </div>
                  <div className="space-y-2">
                    <a
                      href={`/goal-aligned-day?date=${selectedDayData.dateStr}`}
                      className="block w-full text-center bg-[#1E49C9] text-white text-sm py-2 px-4 rounded-lg hover:bg-[#1E49C9]/80 transition-colors"
                    >
                      View Full Day Details
                    </a>
                    <a
                      href="/goal-aligned-day"
                      className="block w-full text-center bg-white/10 text-white text-sm py-2 px-4 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Add New Activity
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Upload Modal */}
      <AnimatePresence>
        {showImageUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#11151A] border-2 border-[#2A313A] rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-jakarta text-lg font-semibold text-text-primary mb-4 leading-relaxed tracking-wider">
                Update Welcome Image
              </h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <label 
                    htmlFor="welcome-image-upload-dashboard"
                    className="inline-flex items-center cursor-pointer"
                  >
                    <Button
                      variant="primary"
                      className="inline-flex items-center"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Choose Image
                    </Button>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="welcome-image-upload-dashboard"
                  />
                </div>
                
                <p className="text-sm text-[#C9D1D9] text-center">
                  Click the button above to select a new image. The image will be displayed in the welcome banner.
                </p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowImageUpload(false)}
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
