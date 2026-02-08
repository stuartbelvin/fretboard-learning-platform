import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Box, Flex, Heading, Text, TabNav } from '@radix-ui/themes';
import '../App.css';

/**
 * Route paths as constants
 */
const ROUTES = {
  HOME: '/',
  NOTE_QUIZ: '/note-quiz',
  INTERVAL_QUIZ: '/interval-quiz',
  PROGRESSIVE_QUIZ: '/progressive-quiz',
  ZONE_ADMIN: '/zone-admin',
  SETTINGS: '/settings',
} as const;

/**
 * Navigation link configuration
 */
const NAV_LINKS = [
  { to: ROUTES.HOME, label: '🎸 Fretboard', end: true },
  { to: ROUTES.NOTE_QUIZ, label: '🎯 Note Quiz', end: false },
  { to: ROUTES.INTERVAL_QUIZ, label: '🎵 Interval Quiz', end: false },
  { to: ROUTES.PROGRESSIVE_QUIZ, label: '📈 Progressive', end: false },
  { to: ROUTES.ZONE_ADMIN, label: '📐 Zones', end: false },
  { to: ROUTES.SETTINGS, label: '⚙️ Settings', end: false },
] as const;

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
      <Box asChild p="5" style={{ borderBottom: '1px solid var(--gray-a5)' }}>
        <header className="app-header">
          <Heading 
            as="h1" 
            size="7" 
            mb="2" 
            style={{ 
              background: 'linear-gradient(90deg, var(--accent-9) 0%, var(--accent-11) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Fretboard Mastery Pro
          </Heading>
          <Text as="p" size="3" color="gray">Interactive Guitar Fretboard Visualization</Text>
          
          {/* Navigation using Radix TabNav */}
          <Flex justify="center" mt="4">
            <TabNav.Root size="2">
              {NAV_LINKS.map(({ to, label }) => {
                const isActive = location.pathname === to || 
                  (!NAV_LINKS.find(l => l.to === to)?.end && location.pathname.startsWith(to) && to !== '/');
                return (
                  <TabNav.Link 
                    key={to} 
                    asChild 
                    active={isActive}
                  >
                    <NavLink to={to}>
                      {label}
                    </NavLink>
                  </TabNav.Link>
                );
              })}
            </TabNav.Root>
          </Flex>
        </header>
      </Box>

      {/* Page Content */}
      <Outlet />
    </div>
  );
}

/**
 * Get the last visited route from localStorage
 * Used for restoring navigation state on app reload
 */
export function getLastRoute(): string {
  return localStorage.getItem(LAST_ROUTE_KEY) || ROUTES.HOME;
}

/**
 * Clear the last route from localStorage
 */
export function clearLastRoute(): void {
  localStorage.removeItem(LAST_ROUTE_KEY);
}
