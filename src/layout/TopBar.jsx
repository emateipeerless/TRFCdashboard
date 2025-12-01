
import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function Topbar() {
  const { user, signOut } = useAuthenticator((c) => [c.user]);
  const email = user?.signInDetails?.loginId || 'user';

  // theme: 'light' or 'dark'
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'; // fallback for SSR
    return localStorage.getItem('theme') || 'dark'; // start with your current dark look
  });

  // apply theme to <html data-theme="...">
  useEffect(() => {
    const root = document.documentElement; // <html>
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  return (
    <header className="topbar2">
      <h1>Turf Connect Dashboard</h1>
      <div className="grow" />

      {/* Theme toggle button */}
      <button type="button" onClick={toggleTheme}>
        {isDark ? 'Change to Light mode' : 'Change to Dark mode'}
      </button>

      <div className="user-pill">
        <span>{email}</span>
        <button type="button" onClick={signOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}
