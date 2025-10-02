/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'background': {
          'primary': '#0A0C0F',
          'secondary': '#11151A',
          'tertiary': '#1A1F2E',
          'card': '#1E2330',
          'overlay': 'rgba(0, 0, 0, 0.5)',
        },
        
        // Text colors
        'text': {
          'primary': '#E8EEF2',
          'secondary': 'rgba(156, 166, 198, 0.85)', // Iris at 85% opacity
          'tertiary': '#94A3B8',
          'muted': '#64748B',
          'inverse': '#FFFFFF',
          'iris': '#9CA6C6', // Pure Iris color
        },
        
        // Border colors - Only Primary Blue
        'border': {
          'primary': '#2A313A',
          'secondary': '#3A414A',
          'accent': '#1E49C9',
          'error': '#1E49C9',
          'success': '#1E49C9',
          'warning': '#1E49C9',
        },
        
        // Status colors - Only Primary Blue
        'status': {
          'success': '#1E49C9',
          'error': '#1E49C9',
          'warning': '#1E49C9',
          'info': '#1E49C9',
        },
        
        // Accent colors
        'accent': {
          'primary': '#1E49C9',
          'blue': '#1E49C9',
          'opal': '#1E49C9',
          'yellow': '#FFD200',
          'purple': '#8B5CF6',
          'pink': '#EC4899',
        },
        
        // Primary colors - Only Blue
        'primary': {
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
        
        // Neutral colors
        'neutral': {
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
      },
      
      fontFamily: {
        'sans': ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'serif': ['Newsreader', 'Georgia', 'Times New Roman', 'serif'],
        'primary': ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'display': ['Newsreader', 'Georgia', 'Times New Roman', 'serif'],
        'mono': ['JetBrains Mono', '"Fira Code"', 'monospace'],
        'jakarta': ['Plus Jakarta Sans', 'sans-serif'],
        'newsreader': ['Newsreader', 'serif'],
      },
      
      fontSize: {
        'xs': '0.75rem',      // 12px
        'sm': '0.8125rem',    // 13px - Labels/inputs/chips
        'base': '1rem',       // 16px - Base body text
        'lg': '0.9375rem',    // 15px - Secondary text
        'xl': '1.25rem',      // 20px
        '2xl': '1.5rem',      // 24px - H3 (card headers, modal titles)
        '3xl': '2rem',        // 32px - H2 (section headers)
        '4xl': '2.5rem',      // 40px - H1 (hero) - clamp(2.5rem, 5vw, 3.25rem)
        '5xl': '3.25rem',     // 52px - H1 (hero) max
        '6xl': '3.75rem',     // 60px
        'hero': 'clamp(2.5rem, 5vw, 3.25rem)', // Responsive hero text
      },
      
      fontWeight: {
        'light': 300,
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
        'extrabold': 800,
        'black': 900,
      },
      
      lineHeight: {
        'none': 1,
        'tight': 1.1,        // 110% - H1 (hero) tight, cinematic
        'snug': 1.1,         // 110% - H2 (section headers) - tightened for editorial weight
        'normal': 1.2,       // 120% - H3 (card headers, modal titles)
        'relaxed': 1.4,      // 140% - Labels/inputs/chips
        'loose': 1.45,       // 145% - Secondary text
        'body': 1.5,         // 150% - Base body text (airy, easy to read on glass)
        'wide': 1.625,
        'wider': 2,
      },
      
      letterSpacing: {
        'tighter': '-0.01em',    // H1 (hero) slight tightening
        'tight': '-0.01em',      // H2 (section headers) - tightened for editorial weight
        'normal': '0em',
        'wide': '0.015em',       // Base body text
        'wider': '0.03em',       // Labels/inputs/chips (for clarity in small glassy pills)
        'widest': '0.05em',
      },
      
      spacing: {
        // 4px grid with 1.5× ratio jump: 4 / 8 / 12 / 20 / 32 / 52 / 84
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
        13: '3.25rem',  // 52px - Hero spacing
        16: '4rem',     // 64px
        20: '5rem',     // 80px
        21: '5.25rem',  // 84px - Hero spacing
        24: '6rem',     // 96px
        32: '8rem',     // 128px
        40: '10rem',    // 160px
        48: '12rem',    // 192px
        56: '14rem',    // 224px
        64: '16rem',    // 256px
      },
      
      gridTemplateColumns: {
        '53': 'repeat(53, minmax(0, 1fr))', // For year view grid (53 weeks)
      },
      
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',   // 2px
        'base': '0.25rem',  // 4px
        'md': '0.375rem',   // 6px
        'lg': '0.5rem',     // 8px
        'xl': '0.75rem',    // 12px
        '2xl': '1rem',      // 16px
        '3xl': '1.5rem',    // 24px
        'full': '9999px',
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },
      
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      
      transitionTimingFunction: {
        'linear': 'linear',
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'inOut': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      zIndex: {
        'hide': -1,
        'auto': 'auto',
        'base': 0,
        'docked': 10,
        'dropdown': 1000,
        'sticky': 1100,
        'banner': 1200,
        'overlay': 1300,
        'modal': 1400,
        'popover': 1500,
        'skipLink': 1600,
        'toast': 1700,
        'tooltip': 1800,
      },
      
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-out',
        'fade-in-delayed': 'fadeIn 0.4s ease-out 0.1s both',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.9)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(30, 73, 201, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(30, 73, 201, 0.6)' },
        },
      },
      
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noise-pattern': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
