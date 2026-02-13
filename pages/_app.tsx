import type { AppProps } from "next/app";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useState, useMemo, createContext, useEffect } from "react";
import { light, dark } from '../scss/MaterialTheme';
import "../scss/styles/globals.css";
import { ProductProvider } from '@/libs/context/ProductContext';

// LocalStorage key for theme
const THEME_STORAGE_KEY = 'romimi-theme-mode';

// Context for toggling color mode
export const ColorModeContext = createContext({ toggleColorMode: () => { } });

export default function App({ Component, pageProps }: AppProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [isHydrated, setIsHydrated] = useState(false);

  // Read theme from localStorage (client-side only)
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark' | null;
    if (savedMode) {
      setMode(savedMode);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage when theme changes and add class to body
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      // Add data-theme and class to body
      document.body.setAttribute('data-theme', mode);
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(mode);
    }
  }, [mode, isHydrated]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );


  const theme = useMemo(
    //@ts-ignore
    () => createTheme(mode === 'light' ? light : dark),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ProductProvider>
          <Component {...pageProps} />
        </ProductProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
