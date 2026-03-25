import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        fairway: { DEFAULT: '#1B4332', light: '#2D6A4F' },
        sand: '#F4E9D8',
      },
    },
  },
  plugins: [],
};

export default config;
