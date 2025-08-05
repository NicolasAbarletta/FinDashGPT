import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  // Initialise dark mode based on localStorage preference.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);
  return <Component {...pageProps} />;
}

export default MyApp;