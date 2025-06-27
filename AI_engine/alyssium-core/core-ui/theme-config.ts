// theme-config.ts
// Theme configuration for Alyssium Core Dashboard UI

import { createTheme } from 'styled-components'

// Define color palette
export const colors = {
  background: '#0e0e1f',
  foreground: '#e0e0e0',
  primary: '#1BE8A5',
  secondary: '#80d8ff',
  accent: '#ff6b6b',
  muted: '#777',
  border: '#333'
}

// Define typography settings
export const typography = {
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  fontSizes: {
    small: '0.875rem',
    base: '1rem',
    large: '1.25rem',
    xlarge: '2rem'
  },
  lineHeights: {
    normal: 1.6,
    heading: 1.2
  }
}

// Define spacing scale
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem'
}

// Create styled-components theme
export const theme = createTheme({
  colors,
  typography,
  spacing,
  components: {
    card: {
      background: colors.background,
      borderRadius: '0.625rem', // 10px
      boxShadow: `0 0 15px rgba(0, 140, 255, 0.2)`
    },
    button: {
      borderRadius: '0.5rem',
      padding: `${spacing.sm} ${spacing.md}`,
      '&:hover': {
        background: colors.secondary
      }
    }
  }
})
