import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoint thresholds for responsive design
 */
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
} as const;

/**
 * Default fret counts for each device type
 */
export const DEFAULT_FRET_COUNTS = {
  mobile: 4,
  tablet: 8,
  desktop: 12,
} as const;

/**
 * Return type for the useResponsiveViewport hook
 */
export interface ResponsiveViewportResult {
  /** Recommended default fret count based on current screen size */
  defaultFretCount: number;
  /** Whether current viewport is mobile (<480px) */
  isMobile: boolean;
  /** Whether current viewport is tablet (480-768px) */
  isTablet: boolean;
  /** Whether current viewport is desktop (>768px) */
  isDesktop: boolean;
  /** Current device type */
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Custom hook that provides responsive viewport information for the fretboard.
 * Automatically detects screen size and returns appropriate default fret count.
 * 
 * @returns ResponsiveViewportResult - Object containing viewport information
 * 
 * @example
 * ```tsx
 * const { defaultFretCount, isMobile, deviceType } = useResponsiveViewport();
 * const [visibleFrets, setVisibleFrets] = useState(defaultFretCount);
 * ```
 */
export function useResponsiveViewport(): ResponsiveViewportResult {
  const getDeviceInfo = useCallback(() => {
    if (typeof window === 'undefined') {
      // SSR fallback
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop' as const,
        defaultFretCount: DEFAULT_FRET_COUNTS.desktop,
      };
    }

    const width = window.innerWidth;
    
    if (width < BREAKPOINTS.mobile) {
      return {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        deviceType: 'mobile' as const,
        defaultFretCount: DEFAULT_FRET_COUNTS.mobile,
      };
    }
    
    if (width < BREAKPOINTS.tablet) {
      return {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        deviceType: 'tablet' as const,
        defaultFretCount: DEFAULT_FRET_COUNTS.tablet,
      };
    }
    
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      deviceType: 'desktop' as const,
      defaultFretCount: DEFAULT_FRET_COUNTS.desktop,
    };
  }, []);

  const [viewportInfo, setViewportInfo] = useState<ResponsiveViewportResult>(getDeviceInfo);

  useEffect(() => {
    // Update on mount in case SSR values differ
    setViewportInfo(getDeviceInfo());

    const handleResize = () => {
      setViewportInfo(getDeviceInfo());
    };

    // Use matchMedia for more efficient resize detection
    const mobileQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
    const tabletQuery = window.matchMedia(`(max-width: ${BREAKPOINTS.tablet - 1}px)`);

    // Modern browsers support addEventListener on matchMedia
    mobileQuery.addEventListener('change', handleResize);
    tabletQuery.addEventListener('change', handleResize);

    // Also listen to resize for edge cases
    window.addEventListener('resize', handleResize);

    return () => {
      mobileQuery.removeEventListener('change', handleResize);
      tabletQuery.removeEventListener('change', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [getDeviceInfo]);

  return viewportInfo;
}

export default useResponsiveViewport;
