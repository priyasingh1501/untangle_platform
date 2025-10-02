// Design Tokens for Untangle App
// This file contains all design constants to ensure visual consistency

export const typography = {
  // Font Families
  fonts: {
    sans: 'Plus Jakarta Sans',
    primary: 'Plus Jakarta Sans',
    display: 'Plus Jakarta Sans',
  },
  
  // Font Sizes - Exact specifications
  sizes: {
    xs: '0.75rem',      // 12px
    sm: '0.8125rem',    // 13px - Labels/inputs/chips
    base: '1rem',       // 16px - Base body text
    lg: '0.9375rem',    // 15px - Secondary text (iris color)
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px - H3 (card headers, modal titles)
    '3xl': '2rem',      // 32px - H2 (section headers)
    '4xl': '2.5rem',    // 40px - H1 (hero) - clamp(2.5rem, 5vw, 3.25rem)
    '5xl': '3.25rem',   // 52px - H1 (hero) max
    hero: 'clamp(2.5rem, 5vw, 3.25rem)', // Responsive hero text
  },
  
  // Line Heights - Exact specifications
  lineHeights: {
    tight: '1.1',       // 110% - H1 (hero) tight, cinematic
    snug: '1.15',       // 115% - H2 (section headers) - tightened for editorial weight
    normal: '1.2',      // 120% - H3 (card headers, modal titles)
    relaxed: '1.4',     // 140% - Labels/inputs/chips
    loose: '1.45',      // 145% - Secondary text
    body: '1.5',        // 150% - Base body text (airy, easy to read on glass)
  },
  
  // Letter Spacing - Exact specifications
  letterSpacing: {
    tighter: '-0.01em', // H1 (hero) slight tightening
    tight: '-0.005em',  // H2 (section headers) - tightened for editorial weight
    normal: '0em',
    wide: '0.015em',    // Base body text
    wider: '0.03em',    // Labels/inputs/chips (for clarity in small glassy pills)
  },
  
  // Typography Classes - Exact specifications
  classes: {
    // Headings
    h1: 'font-jakarta text-hero leading-tight tracking-tighter',
    h2: 'font-jakarta text-3xl leading-snug tracking-tight',
    h3: 'font-jakarta text-2xl leading-normal',
    
    // Body Text
    body: 'font-jakarta text-base leading-body tracking-wide',
    secondary: 'font-jakarta text-lg leading-loose',
    label: 'font-jakarta text-sm leading-relaxed tracking-wider',
    
    // UI Elements
    button: 'font-jakarta text-sm leading-relaxed tracking-wider',
    input: 'font-jakarta text-base leading-body tracking-wide',
    chip: 'font-jakarta text-sm leading-relaxed tracking-wider',
  },
  
  // Spacing around headings - Exact specifications
  headingSpacing: {
    h1: 'mt-21 mb-4xl', // 2.5× font-size top, 1× font-size bottom
    h2: 'mt-16 mb-3xl', // 2.5× font-size top, 1× font-size bottom
    h3: 'mt-12 mb-2xl', // 2.5× font-size top, 1× font-size bottom
  },
  
  // Spacing around body text - Exact specifications
  bodySpacing: {
    paragraph: 'mb-5', // 1.25× font-size
    input: 'p-6',      // 20–24px padding inside
    card: 'p-6',       // 20–24px padding inside
  },
  
  // Layout spacing - 4px grid with 1.5× ratio: 4 / 8 / 12 / 20 / 32 / 52 / 84
  layout: {
    section: 'py-13',  // 52px top/bottom
    hero: 'py-21',     // 84px top/bottom
    card: 'p-6',       // 24px padding
  },
};

export const colors = {
  // Primary Colors - Only Blue
  primary: {
    50: '#1E49C9',
    100: '#1E49C9',
    200: '#1E49C9',
    300: '#1E49C9',
    400: '#1E49C9',
    500: '#1E49C9',
    600: '#1E49C9',
    700: '#1E49C9',
    800: '#1E49C9',
    900: '#1E49C9',
  },
  
  // Accent Colors - Only Primary Blue
  accent: {
    primary: '#1E49C9',
    opal: '#1E49C9',
    blue: '#1E49C9',
  },
  
  // Neutral Colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Background Colors
  background: {
    primary: '#0A0C0F',
    secondary: '#11151A',
    tertiary: '#1A1F2E',
    card: '#1E2330',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Text Colors
  text: {
    primary: '#E8EEF2',
    secondary: 'rgba(156, 166, 198, 0.85)', // Iris at 85% opacity
    tertiary: '#94A3B8',
    muted: '#64748B',
    inverse: '#FFFFFF',
    iris: '#9CA6C6', // Pure Iris color
  },
  
  // Border Colors - Only Primary Blue
  border: {
    primary: '#2A313A',
    secondary: '#3A414A',
    accent: '#1E49C9',
    error: '#1E49C9',
    success: '#1E49C9',
    warning: '#1E49C9',
  },
  
  // Status Colors - Only Primary Blue
  status: {
    success: '#1E49C9',
    error: '#1E49C9',
    warning: '#1E49C9',
    info: '#1E49C9',
  }
};

export const spacing = {
  // Base spacing scale (4px grid)
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

export const transitions = {
  // Duration
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  // Easing
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Common transitions
  common: {
    all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  }
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Common component styles
export const componentStyles = {
  // Card styles - Enhanced Glassmorphic
  card: {
    base: `
      bg-[rgba(0,0,0,0.2)]
      border border-[rgba(255,255,255,0.2)]
      rounded-2xl 
      p-6 
      transition-all 
      duration-300
      backdrop-blur-[32px]
      backdrop-saturate-[180%]
      shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]
      relative
      overflow-hidden
    `,
    elevated: `
      bg-[rgba(0,0,0,0.2)]
      border border-[rgba(255,255,255,0.25)]
      rounded-2xl 
      p-6 
      transition-all 
      duration-300
      backdrop-blur-[40px]
      backdrop-saturate-[200%]
      shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.1)]
      relative
      overflow-hidden
    `,
    interactive: `
      bg-[rgba(0,0,0,0.2)]
      border border-[rgba(255,255,255,0.2)]
      rounded-2xl 
      p-6 
      transition-all 
      duration-300
      backdrop-blur-[32px]
      backdrop-saturate-[180%]
      shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]
      relative
      overflow-hidden
      cursor-pointer
      hover:bg-[rgba(0,0,0,0.25)]
      hover:border-[rgba(255,255,255,0.3)]
      hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.1)]
      hover:-translate-y-1
    `,
  },
  
  // Button styles - Enhanced Glassmorphic
  button: {
    primary: `
      bg-[#1E49C9]
      border border-[rgba(255,255,255,0.3)]
      text-[#FFFFFF] 
      font-jakarta text-sm leading-relaxed tracking-wider font-semibold
      px-6 
      py-3 
      rounded-xl 
      backdrop-blur-[24px]
      backdrop-saturate-[200%]
      shadow-[0_8px_32px_rgba(30,73,201,0.3),0_2px_8px_rgba(0,0,0,0.1)]
      relative
      overflow-hidden
      transition-all
      duration-300
      hover:shadow-[0_12px_40px_rgba(30,73,201,0.4),0_4px_12px_rgba(0,0,0,0.15)]
      hover:-translate-y-1
      hover:scale-[1.02]
    `,
    secondary: `
      bg-[rgba(0,0,0,0.2)]
      border border-[rgba(255,255,255,0.2)]
      text-text-primary 
      font-jakarta text-sm leading-relaxed tracking-wider font-medium
      px-6 
      py-3 
      rounded-xl
      backdrop-blur-[32px]
      backdrop-saturate-[180%]
      shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]
      transition-all
      duration-300
      hover:bg-[rgba(30,73,201,0.1)]
      hover:border-[rgba(30,73,201,0.3)]
      hover:shadow-[0_12px_40px_rgba(30,73,201,0.2),0_4px_12px_rgba(0,0,0,0.1)]
      hover:-translate-y-1
      relative
      overflow-hidden
    `,
    ghost: `
      bg-[rgba(0,0,0,0.2)]
      border border-[rgba(255,255,255,0.15)]
      text-text-primary 
      font-jakarta text-sm leading-relaxed tracking-wider font-medium
      px-4 
      py-2 
      rounded-lg
      backdrop-blur-[28px]
      backdrop-saturate-[140%]
      shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]
      transition-all
      duration-200
    `,
    outline: `
      bg-[rgba(0,0,0,0.2)]
      border border-[rgba(255,255,255,0.15)]
      text-text-primary 
      font-jakarta text-sm leading-relaxed tracking-wider font-medium
      px-6 
      py-3 
      rounded-xl
      backdrop-blur-[28px]
      backdrop-saturate-[140%]
      shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]
      transition-all
      duration-200
    `,
    default: `
      bg-[rgba(0,0,0,0.2)]
      border border-[rgba(255,255,255,0.15)]
      text-text-primary 
      font-jakarta text-sm leading-relaxed tracking-wider font-medium
      px-6 
      py-3 
      rounded-xl
      backdrop-blur-[28px]
      backdrop-saturate-[140%]
      shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]
      transition-all
      duration-200
    `,
  },
  
  // Input styles - Enhanced Glassmorphic
  input: {
    base: `
      bg-[rgba(255,255,255,0.05)]
      border border-[rgba(255,255,255,0.2)]
      text-text-primary 
      font-jakarta text-base leading-body tracking-wide
      placeholder:text-text-muted 
      px-4 
      py-3 
      rounded-xl
      backdrop-blur-[32px]
      backdrop-saturate-[180%]
      shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_1px_2px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.08)]
      transition-all
      duration-300
      focus:border-[rgba(30,73,201,0.5)]
      focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_1px_2px_rgba(0,0,0,0.1),0_0_0_3px_rgba(30,73,201,0.2),0_8px_32px_rgba(30,73,201,0.15)]
      focus:bg-[rgba(255,255,255,0.08)]
      relative
      overflow-hidden
      before:content-['']
      before:absolute
      before:top-0
      before:left-0
      before:right-0
      before:h-1/4
      before:bg-gradient-to-b
      before:from-[rgba(255,255,255,0.1)]
      before:to-transparent
      before:pointer-events-none
    `,
  },
  
  // Badge styles
  badge: {
    base: `
      inline-flex 
      items-center 
      px-3 
      py-1 
      rounded-full 
      text-xs 
      font-medium 
      transition-colors 
      duration-200
    `,
    default: `
      bg-background-secondary 
      text-text-primary 
      border border-border-primary
    `,
    secondary: `
      bg-background-tertiary 
      text-text-secondary 
      border border-border-secondary
    `,
    outline: `
      bg-transparent 
      text-text-primary 
      border border-border-primary
    `,
    success: `
      bg-status-success/20 
      text-status-success 
      border border-status-success/30
    `,
    error: `
      bg-status-error/20 
      text-status-error 
      border border-status-error/30
    `,
    warning: `
      bg-status-warning/20 
      text-status-warning 
      border border-status-warning/30
    `,
    info: `
      bg-status-info/20 
      text-status-info 
      border border-status-info/30
    `,
  },
  
  // Section styles
  section: {
    base: `
      bg-background-primary 
      min-h-screen 
      py-8 
      px-4 
      sm:px-6 
      lg:px-8
    `,
    container: `
      max-w-7xl 
      mx-auto 
      space-y-8
    `,
  },
  
  // Header styles - Exact specifications
  header: {
    base: `
      text-text-primary 
      font-display 
      font-bold 
      tracking-wide
    `,
    h1: `
      font-jakarta 
      text-hero 
      leading-tight 
      tracking-tighter
      mt-21 
      mb-4xl
    `,
    h2: `
      font-jakarta 
      text-3xl 
      leading-snug 
      tracking-tight
      mt-16 
      mb-3xl
    `,
    h3: `
      font-jakarta 
      text-2xl 
      leading-normal
      mt-12 
      mb-2xl
    `,
    h4: `
      font-jakarta 
      text-xl 
      leading-normal
      mt-8 
      mb-4
    `,
  },
  
  // Text styles - Exact specifications
  text: {
    base: `
      text-text-primary 
      font-primary
    `,
    body: `
      font-jakarta 
      text-base 
      leading-body 
      tracking-wide
      mb-5
    `,
    secondary: `
      font-jakarta 
      text-lg 
      leading-loose
    `,
    label: `
      font-jakarta 
      text-sm 
      leading-relaxed 
      tracking-wider
    `,
    small: `
      font-jakarta 
      text-sm 
      leading-relaxed
    `,
    muted: `
      text-text-muted 
      font-medium
    `,
  }
};

// Animation variants for framer-motion
export const animations = {
  // Fade animations
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },
  
  // Slide animations
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  
  // Scale animations
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  
  // Interactive animations
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  
  tap: {
    scale: 0.98,
    transition: { duration: 0.1, ease: 'easeOut' }
  },
  
  // Stagger animations for lists
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }
};


