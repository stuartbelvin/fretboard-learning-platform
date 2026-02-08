import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { HomePage, NoteQuizPage, IntervalQuizPage, SettingsPage, ZoneAdminPage, ProgressiveQuizPage } from '../pages';

/**
 * Route Configuration
 * 
 * Defines all application routes with their paths and components.
 * Uses a layout component for consistent header/navigation across pages.
 */
export const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <ProgressiveQuizPage />,
      },
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'note-quiz',
        element: <NoteQuizPage />,
      },
      {
        path: 'interval-quiz',
        element: <IntervalQuizPage />,
      },
      {
        path: 'progressive-quiz',
        element: <ProgressiveQuizPage />,
      },
      {
        path: 'zone-admin',
        element: <ZoneAdminPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
];

/**
 * Create the router instance
 * 
 * Uses HashRouter for better compatibility with static hosting
 * and file:// protocol. Can be switched to BrowserRouter for
 * server-side routing support.
 */
const router = createHashRouter(routes);

/**
 * Alternative BrowserRouter for server environments with proper routing
 * Uncomment if deploying to a server with proper fallback routing.
 */
// const router = createBrowserRouter(routes);

/**
 * AppRouter Component
 * 
 * Provides the router context to the application.
 * Wrap the app with this component to enable routing.
 */
export function AppRouter() {
  return <RouterProvider router={router} />;
}

/**
 * Route paths as constants for use throughout the app
 */
export const ROUTES = {
  HOME: '/',
  NOTE_QUIZ: '/note-quiz',
  INTERVAL_QUIZ: '/interval-quiz',
  ZONE_ADMIN: '/zone-admin',
  SETTINGS: '/settings',
} as const;

/**
 * Type for route paths
 */
export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
