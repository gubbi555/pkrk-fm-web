import React, { Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import EnhancedContentBrowser from './components/EnhancedContentBrowser';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <Suspense fallback={
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading PKRK FM...</p>
          </div>
        }>
          <EnhancedContentBrowser />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
