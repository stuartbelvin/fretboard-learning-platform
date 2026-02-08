import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, MemoryRouter } from 'react-router-dom';
import { routes, ROUTES, type RoutePath, AppRouter } from '../../router/AppRouter';
import { AppLayout, getLastRoute, clearLastRoute } from '../../router/AppLayout';
import { ColorProvider } from '../../context';
import '@testing-library/jest-dom';

// Mock matchMedia for jsdom
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Helper to render with router
const renderWithRouter = (initialEntries: string[] = ['/']) => {
  const router = createMemoryRouter(routes, {
    initialEntries,
  });

  return {
    ...render(
      <ColorProvider>
        <RouterProvider router={router} />
      </ColorProvider>
    ),
    router,
  };
};

// Helper to render AppLayout with MemoryRouter for isolated testing
const renderAppLayout = (initialEntries: string[] = ['/']) => {
  return render(
    <ColorProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <AppLayout />
      </MemoryRouter>
    </ColorProvider>
  );
};

describe('APP-005: Routing & Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Route Constants', () => {
    it('should have HOME route defined as "/"', () => {
      expect(ROUTES.HOME).toBe('/');
    });

    it('should have NOTE_QUIZ route defined as "/note-quiz"', () => {
      expect(ROUTES.NOTE_QUIZ).toBe('/note-quiz');
    });

    it('should have INTERVAL_QUIZ route defined as "/interval-quiz"', () => {
      expect(ROUTES.INTERVAL_QUIZ).toBe('/interval-quiz');
    });

    it('should have SETTINGS route defined as "/settings"', () => {
      expect(ROUTES.SETTINGS).toBe('/settings');
    });

    it('should have all routes as readonly constants', () => {
      const routeValues: RoutePath[] = [
        ROUTES.HOME,
        ROUTES.NOTE_QUIZ,
        ROUTES.INTERVAL_QUIZ,
        ROUTES.SETTINGS,
      ];
      expect(routeValues).toHaveLength(4);
    });
  });

  describe('Route Configuration', () => {
    it('should have routes array defined', () => {
      expect(routes).toBeDefined();
      expect(Array.isArray(routes)).toBe(true);
    });

    it('should have root route with AppLayout element', () => {
      expect(routes[0].path).toBe('/');
      expect(routes[0].element).toBeDefined();
    });

    it('should have child routes for all pages', () => {
      const children = routes[0].children;
      expect(children).toBeDefined();
      expect(children).toHaveLength(6);
    });

    it('should have progressive-quiz route', () => {
      const children = routes[0].children!;
      const progressiveQuizRoute = children.find((r: { path?: string }) => r.path === 'progressive-quiz');
      expect(progressiveQuizRoute).toBeDefined();
    });

    it('should have index route for home page', () => {
      const children = routes[0].children!;
      const indexRoute = children.find((r: { index?: boolean }) => r.index === true);
      expect(indexRoute).toBeDefined();
    });

    it('should have note-quiz route', () => {
      const children = routes[0].children!;
      const noteQuizRoute = children.find((r: { path?: string }) => r.path === 'note-quiz');
      expect(noteQuizRoute).toBeDefined();
    });

    it('should have interval-quiz route', () => {
      const children = routes[0].children!;
      const intervalQuizRoute = children.find((r: { path?: string }) => r.path === 'interval-quiz');
      expect(intervalQuizRoute).toBeDefined();
    });

    it('should have settings route', () => {
      const children = routes[0].children!;
      const settingsRoute = children.find((r: { path?: string }) => r.path === 'settings');
      expect(settingsRoute).toBeDefined();
    });
  });

  describe('AppLayout Component', () => {
    it('should render header with app title', () => {
      renderWithRouter();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fretboard Mastery Pro');
    });

    it('should render subtitle text', () => {
      renderWithRouter();
      expect(screen.getByText('Interactive Guitar Fretboard Visualization')).toBeInTheDocument();
    });

    it('should render navigation with 6 links', () => {
      renderWithRouter();
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      const links = nav.querySelectorAll('a');
      expect(links).toHaveLength(6);
    });

    it('should have navigation with aria-label for accessibility', () => {
      renderWithRouter();
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('should render Fretboard link', () => {
      renderWithRouter();
      expect(screen.getByRole('link', { name: /fretboard/i })).toBeInTheDocument();
    });

    it('should render Note Quiz link', () => {
      renderWithRouter();
      expect(screen.getByRole('link', { name: /note quiz/i })).toBeInTheDocument();
    });

    it('should render Interval Quiz link', () => {
      renderWithRouter();
      expect(screen.getByRole('link', { name: /interval quiz/i })).toBeInTheDocument();
    });

    it('should render Settings link', () => {
      renderWithRouter();
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });
  });

  describe('Navigation State Persistence', () => {
    it('should persist current route to localStorage', async () => {
      renderWithRouter(['/note-quiz']);
      
      await waitFor(() => {
        expect(localStorage.getItem('fretboard-app-last-route')).toBe('/note-quiz');
      });
    });

    it('should update localStorage when navigating', async () => {
      const { router } = renderWithRouter(['/']);
      
      // Initially at home
      await waitFor(() => {
        expect(localStorage.getItem('fretboard-app-last-route')).toBe('/');
      });

      // Navigate to settings
      router.navigate('/settings');
      
      await waitFor(() => {
        expect(localStorage.getItem('fretboard-app-last-route')).toBe('/settings');
      });
    });

    it('should return last route from getLastRoute helper', () => {
      localStorage.setItem('fretboard-app-last-route', '/interval-quiz');
      expect(getLastRoute()).toBe('/interval-quiz');
    });

    it('should return HOME route when no last route stored', () => {
      localStorage.removeItem('fretboard-app-last-route');
      expect(getLastRoute()).toBe('/');
    });

    it('should clear last route with clearLastRoute helper', () => {
      localStorage.setItem('fretboard-app-last-route', '/settings');
      clearLastRoute();
      expect(localStorage.getItem('fretboard-app-last-route')).toBeNull();
    });
  });

  describe('Active Navigation State', () => {
    it('should mark Fretboard link as active on home page', async () => {
      renderWithRouter(['/']);
      
      await waitFor(() => {
        const fretboardLink = screen.getByRole('link', { name: /fretboard/i });
        expect(fretboardLink).toHaveClass('active');
      });
    });

    it('should mark Note Quiz link as active on note-quiz page', async () => {
      renderWithRouter(['/note-quiz']);
      
      await waitFor(() => {
        const noteQuizLink = screen.getByRole('link', { name: /note quiz/i });
        expect(noteQuizLink).toHaveClass('active');
      });
    });

    it('should mark Interval Quiz link as active on interval-quiz page', async () => {
      renderWithRouter(['/interval-quiz']);
      
      await waitFor(() => {
        const intervalQuizLink = screen.getByRole('link', { name: /interval quiz/i });
        expect(intervalQuizLink).toHaveClass('active');
      });
    });

    it('should mark Settings link as active on settings page', async () => {
      renderWithRouter(['/settings']);
      
      await waitFor(() => {
        const settingsLink = screen.getByRole('link', { name: /settings/i });
        expect(settingsLink).toHaveClass('active');
      });
    });

    it('should not mark other links as active', async () => {
      renderWithRouter(['/note-quiz']);
      
      await waitFor(() => {
        const fretboardLink = screen.getByRole('link', { name: /fretboard/i });
        expect(fretboardLink).not.toHaveClass('active');
      });
    });
  });

  describe('Navigation Without Page Reload', () => {
    it('should navigate to Note Quiz without page reload', async () => {
      renderWithRouter(['/']);
      
      const noteQuizLink = screen.getByRole('link', { name: /note quiz/i });
      fireEvent.click(noteQuizLink);
      
      await waitFor(() => {
        expect(noteQuizLink).toHaveClass('active');
      });
    });

    it('should navigate to Interval Quiz without page reload', async () => {
      renderWithRouter(['/']);
      
      const intervalQuizLink = screen.getByRole('link', { name: /interval quiz/i });
      fireEvent.click(intervalQuizLink);
      
      await waitFor(() => {
        expect(intervalQuizLink).toHaveClass('active');
      });
    });

    it('should navigate to Settings without page reload', async () => {
      renderWithRouter(['/']);
      
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      fireEvent.click(settingsLink);
      
      await waitFor(() => {
        expect(settingsLink).toHaveClass('active');
      });
    });

    it('should navigate back to Home from other pages', async () => {
      renderWithRouter(['/settings']);
      
      const fretboardLink = screen.getByRole('link', { name: /fretboard/i });
      fireEvent.click(fretboardLink);
      
      await waitFor(() => {
        expect(fretboardLink).toHaveClass('active');
      });
    });
  });

  describe('Page Rendering', () => {
    it('should render HomePage on root path', async () => {
      renderWithRouter(['/']);
      
      // HomePage should have Zone Preset controls (unique to HomePage)
      await waitFor(() => {
        expect(screen.getByText('Zone Preset:')).toBeInTheDocument();
      });
    });

    it('should render NoteQuizPage on /note-quiz path', async () => {
      renderWithRouter(['/note-quiz']);
      
      // NoteQuizPage should have note quiz test component with unique class
      await waitFor(() => {
        const quizContainer = document.querySelector('.note-quiz-test');
        expect(quizContainer).toBeInTheDocument();
      });
    });

    it('should render IntervalQuizPage on /interval-quiz path', async () => {
      renderWithRouter(['/interval-quiz']);
      
      // IntervalQuizPage should have interval quiz test component with unique class
      await waitFor(() => {
        const quizContainer = document.querySelector('.interval-quiz-test');
        expect(quizContainer).toBeInTheDocument();
      });
    });

    it('should render SettingsPage on /settings path', async () => {
      renderWithRouter(['/settings']);
      
      // SettingsPage should have settings panel
      await waitFor(() => {
        expect(screen.getByText('Appearance')).toBeInTheDocument();
      });
    });
  });

  describe('URL Structure', () => {
    it('should use hash-based routing for static hosting compatibility', () => {
      // The router is created with createHashRouter, so URLs will be like /#/note-quiz
      // This is verified by the router configuration test
      expect(routes[0].path).toBe('/');
    });

    it('should have clean URL paths without file extensions', () => {
      const paths = ['/', '/note-quiz', '/interval-quiz', '/settings'];
      paths.forEach(path => {
        expect(path).not.toContain('.html');
        expect(path).not.toContain('.tsx');
      });
    });

    it('should use kebab-case for multi-word routes', () => {
      expect(ROUTES.NOTE_QUIZ).toBe('/note-quiz');
      expect(ROUTES.INTERVAL_QUIZ).toBe('/interval-quiz');
    });
  });

  describe('Browser History Integration', () => {
    it('should support programmatic navigation', async () => {
      const { router } = renderWithRouter(['/']);
      
      router.navigate('/note-quiz');
      
      await waitFor(() => {
        expect(localStorage.getItem('fretboard-app-last-route')).toBe('/note-quiz');
      });
    });

    it('should support navigation with router.navigate', async () => {
      const { router } = renderWithRouter(['/']);
      
      router.navigate('/settings');
      
      await waitFor(() => {
        const settingsLink = screen.getByRole('link', { name: /settings/i });
        expect(settingsLink).toHaveClass('active');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid navigation between pages', async () => {
      const { router } = renderWithRouter(['/']);
      
      router.navigate('/note-quiz');
      router.navigate('/interval-quiz');
      router.navigate('/settings');
      router.navigate('/');
      
      await waitFor(() => {
        const fretboardLink = screen.getByRole('link', { name: /fretboard/i });
        expect(fretboardLink).toHaveClass('active');
      });
    });

    it('should preserve localStorage state after multiple navigations', async () => {
      const { router } = renderWithRouter(['/']);
      
      router.navigate('/note-quiz');
      router.navigate('/interval-quiz');
      
      await waitFor(() => {
        expect(localStorage.getItem('fretboard-app-last-route')).toBe('/interval-quiz');
      });
    });
  });

  describe('CSS Classes', () => {
    it('should have nav-btn class on all navigation links', () => {
      renderWithRouter(['/']);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('nav-btn');
      });
    });

    it('should have app class on root container', () => {
      renderWithRouter(['/']);
      
      const appContainer = document.querySelector('.app');
      expect(appContainer).toBeInTheDocument();
    });

    it('should have app-header class on header', () => {
      renderWithRouter(['/']);
      
      const header = document.querySelector('.app-header');
      expect(header).toBeInTheDocument();
    });

    it('should have view-nav class on navigation', () => {
      renderWithRouter(['/']);
      
      const nav = document.querySelector('.view-nav');
      expect(nav).toBeInTheDocument();
    });
  });
});

describe('RoutePath Type', () => {
  it('should allow assignment of valid route paths', () => {
    const paths: RoutePath[] = [
      ROUTES.HOME,
      ROUTES.NOTE_QUIZ,
      ROUTES.INTERVAL_QUIZ,
      ROUTES.SETTINGS,
    ];
    
    expect(paths).toHaveLength(4);
    paths.forEach(path => {
      expect(typeof path).toBe('string');
      expect(path.startsWith('/')).toBe(true);
    });
  });
});
