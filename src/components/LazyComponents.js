import { lazy, Suspense } from 'react';

// Lazy load heavy components
const LazyContentBrowser = lazy(() => import('./ContentBrowser'));
const LazyEnhancedContentBrowser = lazy(() => import('./EnhancedContentBrowser'));
const LazyAudioPlayer = lazy(() => import('./AudioPlayer'));
const LazyEnhancedAudioPlayer = lazy(() => import('./EnhancedAudioPlayer'));

// Loading fallback component
const LoadingFallback = ({ message = "Loading..." }) => (
  <div className="loading-fallback">
    <div className="loading-spinner"></div>
    <p>{message}</p>
  </div>
);

// Wrapped lazy components with suspense
export const ContentBrowser = (props) => (
  <Suspense fallback={<LoadingFallback message="Loading Content Browser..." />}>
    <LazyContentBrowser {...props} />
  </Suspense>
);

export const EnhancedContentBrowser = (props) => (
  <Suspense fallback={<LoadingFallback message="Loading Enhanced Browser..." />}>
    <LazyEnhancedContentBrowser {...props} />
  </Suspense>
);

export const AudioPlayer = (props) => (
  <Suspense fallback={<LoadingFallback message="Loading Audio Player..." />}>
    <LazyAudioPlayer {...props} />
  </Suspense>
);

export const EnhancedAudioPlayer = (props) => (
  <Suspense fallback={<LoadingFallback message="Loading Enhanced Player..." />}>
    <LazyEnhancedAudioPlayer {...props} />
  </Suspense>
);

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const logPerformance = (name, duration) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${duration}ms`);
    }
  };

  return { logPerformance };
};

// Error boundary for lazy components
export const LazyErrorBoundary = ({ children, fallback }) => (
  <Suspense 
    fallback={fallback || <LoadingFallback />}
  >
    {children}
  </Suspense>
);
