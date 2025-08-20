import React, { useState, useEffect, useCallback } from 'react';
import AudioPlayer from './AudioPlayer';

// Import background images
import monssonragaImg from '../assets/images/monssonraga.jfif';
import paramathmaImg from '../assets/images/paramathma.jfif';
import rajImg from '../assets/images/raj.jfif';
import educationalImg from '../assets/images/educational.jfif';
import horrorImg from '../assets/images/horror.jpg';
import storiesImg from '../assets/images/stories.jfif';

const ContentBrowser = () => {
  const [content, setContent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
    'https://1929mh4l2j.execute-api.ap-south-1.amazonaws.com/prod';

  useEffect(() => {
    fetchCategories();
    fetchContent();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(() => {
    const savedUser = localStorage.getItem('pkrk-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(['all', ...data.categories]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  }, [API_BASE_URL]);

  const fetchContent = useCallback(async (category) => {
    try {
      setLoading(true);
      const url = category && category !== 'all' 
        ? `${API_BASE_URL}/content?category=${category}`
        : `${API_BASE_URL}/content`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch content');
      
      const data = await response.json();
      setContent(data.items || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content');
      setContent([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchContent(category);
  };

  const playTrack = (track) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setCurrentTrack(track);
  };

  const handleSignOut = () => {
    localStorage.removeItem('pkrk-user');
    setUser(null);
    setCurrentTrack(null);
  };

  const handleAuthSuccess = (email, password) => {
    // Simple mock authentication
    const userData = { email, name: email.split('@')[0] };
    localStorage.setItem('pkrk-user', JSON.stringify(userData));
    setUser(userData);
    setShowAuth(false);
  };

  const groupedContent = content.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  if (showAuth) {
    return (
      <div className="auth-overlay">
        <div className="auth-modal">
          <button 
            className="close-auth"
            onClick={() => setShowAuth(false)}
          >
            ✕
          </button>
          <div className="auth-container">
            <h2>🎵 Welcome to PKRK FM</h2>
            <p>Sign in to access your favorite Kannada content</p>
            <SimpleAuthForm onSuccess={handleAuthSuccess} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-browser">
      <header className="app-header">
        <h1>🎵 PKRK FM</h1>
        <p>Your Favorite Kannada Audio Streaming Platform</p>
        <div className="header-actions">
          <span>{content.length} Audio Files Available</span>
          {user ? (
            <button onClick={handleSignOut} className="auth-btn">
              Sign Out ({user.name})
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="auth-btn">
              Sign In / Sign Up
            </button>
          )}
        </div>
      </header>

      <div className="category-filter">
        <label>Browse by Category: </label>
        <select 
          value={selectedCategory} 
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Content' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your favorite content...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error">
            <h3>⚠️ Something went wrong</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              🔄 Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="content-grid">
          {selectedCategory === 'all' ? (
            Object.entries(groupedContent).map(([category, items]) => (
              <div key={category} className="category-section">
                <h2>
                  {category.charAt(0).toUpperCase() + category.slice(1)} 
                  <span className="count">({items.length})</span>
                </h2>
                <div className="content-items">
                  {items.map(item => (
                    <ContentItem key={item.contentId} item={item} onPlay={playTrack} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="content-items">
              {content.map(item => (
                <ContentItem key={item.contentId} item={item} onPlay={playTrack} />
              ))}
            </div>
          )}
        </div>
      )}

      {currentTrack && user && (
        <div className="current-player">
          <div className="player-container">
            <button 
              className="close-player"
              onClick={() => setCurrentTrack(null)}
            >
              ✕
            </button>
            <AudioPlayer
              streamingUrl={currentTrack.streamingUrl}
              title={currentTrack.title}
              description={currentTrack.description}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Auth Form Component
const SimpleAuthForm = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </div>
      
      <button type="submit" className="auth-submit-btn">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </button>
      
      <p className="auth-toggle">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="toggle-link"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </form>
  );
};

// Content Item Component
const ContentItem = ({ item, onPlay }) => {
  const getBackgroundImage = () => {
    if (item.category === 'music') {
      switch (item.album?.toLowerCase()) {
        case 'monssonraga': return monssonragaImg;
        case 'paramathma': return paramathmaImg;
        case 'raj': return rajImg;
        default: return educationalImg;
      }
    }
    
    switch (item.category) {
      case 'educational': return educationalImg;
      case 'stories':
        return item.subcategory === 'horror' ? horrorImg : storiesImg;
      default: return educationalImg;
    }
  };

  const backgroundImage = getBackgroundImage();

  return (
    <div 
      className="content-item"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="item-overlay">
        <div className="item-info">
          <h3>{item.title}</h3>
          <p className="description">{item.description}</p>
          <div className="item-meta">
            <span className="duration">⏱️ {item.duration}</span>
            <span className="language">🗣️ {item.language}</span>
            {item.artist && <span className="artist">🎤 {item.artist}</span>}
          </div>
        </div>
        <button 
          onClick={() => onPlay(item)}
          className="play-button"
        >
          ▶️ Play Now
        </button>
      </div>
    </div>
  );
};

export default ContentBrowser;
