import { Outlet, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import '../App.css';

const PAGES = [
  { path: '/home', label: 'Classic Fretboard' },
  { path: '/note-quiz', label: 'Note Quiz' },
  { path: '/interval-quiz', label: 'Interval Quiz' },
  { path: '/progressive-quiz', label: 'Progressive Quiz' },
  { path: '/zone-quiz', label: 'Zone Quiz' },
  { path: '/zone-admin', label: 'Zone Admin' },
  { path: '/settings', label: 'Settings' },
];

/**
 * LocalStorage key for persisting the last visited route
 */
const LAST_ROUTE_KEY = 'fretboard-app-last-route';

/**
 * AppLayout Component
 * 
 * Provides consistent header, navigation, and footer across all pages.
 * Uses Outlet from react-router-dom to render child routes.
 * Persists navigation state to localStorage.
 */
export function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(LAST_ROUTE_KEY, location.pathname);
  }, [location.pathname]);

  const showDevNav = location.pathname !== '/progressive-quiz' && location.pathname !== '/';

  return (
    <div className="app">
      {showDevNav && (
        <nav className="dev-navbar">
          <div className="dev-navbar-title">Dev Nav</div>
          <ul className="dev-navbar-links">
            {PAGES.map((page) => (
              <li key={page.path}>
                <Link to={page.path}>{page.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <Outlet />
    </div>
  );
}

/**
 * Get the last visited route from localStorage
 * Used for restoring navigation state on app reload
 */
export function getLastRoute(): string {
  return localStorage.getItem(LAST_ROUTE_KEY) || '/';
}

/**
 * Clear the last route from localStorage
 */
export function clearLastRoute(): void {
  localStorage.removeItem(LAST_ROUTE_KEY);
}
