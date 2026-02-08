import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import '../App.css';

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

  // Persist current route to localStorage for navigation state persistence
  useEffect(() => {
    localStorage.setItem(LAST_ROUTE_KEY, location.pathname);
  }, [location.pathname]);

  return (
    <div className="app">
      {/* Page Content - no header/navbar */}
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
