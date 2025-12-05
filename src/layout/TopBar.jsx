
import { useEffect, useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function Topbar() {
  const { user, signOut } = useAuthenticator((c) => [c.user]);
  const email = user?.signInDetails?.loginId || 'user';

  // theme: 'light' or 'dark'
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">TurfConnect Device Console</h1>
        <span className="topbar-subtitle">Live status & trends</span>
      </div>

      <div className="topbar-right">
        {/* Theme toggle button */}
        <button
          type="button"
          className="topbar-toggle"
          onClick={toggleTheme}
        >
          {isDark ? 'Light theme' : 'Dark theme'}
        </button>

        <div className="user-pill">
          <span className="user-email">{email}</span>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
