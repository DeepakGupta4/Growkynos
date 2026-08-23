/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050507',
        carbon: '#0A0A0D',
        graphite: '#101014',
        ash: '#17171C',
        smoke: '#232329',
        steel: '#35353E',
        mist: '#6B6B78',
        silver: '#9C9CA8',
        bone: '#E6E6EA',
        chalk: '#F5F5F7',
        brass: {
          DEFAULT: '#C6A87C',
          bright: '#E2CBA4',
          dim: '#8C7554',
          deep: '#4A3D2B',
        },
        halo: '#8FA9C4',
      },
      fontFamily: {
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      fontSize: {
        // Fluid editorial scale
        'label': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.18em' }],
        'label-lg': ['0.75rem', { lineHeight: '1', letterSpacing: '0.16em' }],
        'display-1': ['clamp(3rem, 13vw, 12.5rem)', { lineHeight: '0.85', letterSpacing: '-0.045em' }],
        'display-2': ['clamp(2.5rem, 9vw, 8rem)', { lineHeight: '0.88', letterSpacing: '-0.04em' }],
        'display-3': ['clamp(2rem, 6vw, 5rem)', { lineHeight: '0.94', letterSpacing: '-0.035em' }],
        'display-4': ['clamp(1.5rem, 3.6vw, 2.75rem)', { lineHeight: '1.04', letterSpacing: '-0.025em' }],
        'numeral': ['clamp(4rem, 18vw, 20rem)', { lineHeight: '0.78', letterSpacing: '-0.05em' }],
      },
      spacing: {
        gutter: 'var(--gutter)',
      },
      maxWidth: {
        shell: '108rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'swift': 'cubic-bezier(0.4, 0, 0.1, 1)',
      },
      zIndex: {
        grain: '90',
        nav: '100',
        cursor: '200',
        boot: '300',
        transition: '250',
      },
      screens: {
        xs: '420px',
        '3xl': '1800px',
      },
    },
  },
  plugins: [],
}
