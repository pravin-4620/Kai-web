/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary':    '#F6F8FB',
        'bg-secondary':  '#FFFFFF',
        'bg-tertiary':   '#F1F5F9',
        'bg-elevated':   '#EAF0F7',
        'accent-blue':   '#4F8EF7',
        'accent-purple': '#8B5CF6',
        'accent-cyan':   '#22D3EE',
        'accent-green':  '#3FB950',
        'accent-orange': '#FB8F44',
        'accent-red':    '#F85149',
        'text-primary':  '#0F172A',
        'text-secondary':'#475569',
        'text-muted':    '#64748B',
        'kai-border':    '#D9E2EC',
        'kai-glass':     'rgba(15,23,42,0.03)',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      animation: {
        shimmer:      'shimmer 2s infinite linear',
        'fade-up':    'fade-up 0.25s ease-out',
        'slide-in':   'slide-in 0.25s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        float:        'float 5s ease-in-out infinite',
        glow:         'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-in': {
          '0%':   { transform: 'translateX(12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(79,142,247,0.3)' },
          '100%': { boxShadow: '0 0 18px rgba(79,142,247,0.5)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        shimmer: 'linear-gradient(90deg, transparent 0%, rgba(15,23,42,0.06) 50%, transparent 100%)',
      },
      boxShadow: {
        card:          '0 6px 20px rgba(15,23,42,0.06)',
        modal:         '0 24px 64px rgba(15,23,42,0.18)',
        focus:         '0 0 0 3px rgba(79,142,247,0.3)',
        glow:          '0 0 16px rgba(79,142,247,0.2)',
        'glow-purple': '0 0 16px rgba(139,92,246,0.2)',
        glass:         '0 10px 28px rgba(15,23,42,0.08)',
      },
    },
  },
  plugins: [],
}
