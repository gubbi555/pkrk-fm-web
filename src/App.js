import React from 'react';
import ContentBrowser from './components/ContentBrowser';
import Auth from './components/Auth';
import './App.css';

function App() {
  return (
    <div className="App">
      <Auth>
        <ContentBrowser />
      </Auth>
    </div>
  );
}

export default App;
