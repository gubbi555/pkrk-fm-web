import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Auth } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { AudioPlayer } from './LazyComponents';
import { apiCache } from '../utils/apiCache';

// Import background images
import monssonragaImg from '../assets/images/monssonraga.jfif';
import paramathmaImg from '../assets/images/paramathma.jfif';
import rajImg from '../assets/images/raj.jfif';
import educationalImg from '../assets/images/educational.jfif';
import horrorImg from '../assets/images/horror.jpg';
import storiesImg from '../assets/images/stories.jfif';

const EnhancedContentBrowser = () => {
  const [content, setContent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');

  const API_BASE_URL = 'https://1929mh4l2j.execute-api.ap-south-1.amazonaws.com/prod';

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await Promise.all([
      fetchCategories(),
      fetchContent(),
      checkAuthStatus()
    ]);
  };

  const checkAuthStatus = useCallback(async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const cacheKey = 'categories';
      const cachedData = apiCache.get(cacheKey);
      
      if (cachedData) {
        setCategories(['all', ...cachedData]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      
      apiCache.set(cacheKey, data.categories);
      setCategories(['all', ...data.categories]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  }, [API_BASE_URL]);

  const fetchContent = useCallback(async (category) => {
    try {
      setLoading(true);
      const cacheKey = category ? `content-${category}` : 'content-all';
      const cachedData = apiCache.get(cacheKey);
      
      if (cachedData) {
        setContent(cachedData);
        setLoading(false);
        return;
      }

      const url = category && category !== 'all' 
        ? `${API_BASE_URL}/content?category=${category}`
        : `${API_BASE_URL}/content`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch content');
      
      const data = await response.json();
      const items = data.items || [];
      
      apiCache.set(cacheKey, items);
      setContent(items);
      setError(null);
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content');
      setContent([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    fetchContent(category);
  }, [fetchContent]);

  const playTrack = useCallback((track) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setCurrentTrack(track);
  }, [user]);

  const filteredAndSortedContent = useMemo(() => {
    let filtered = content.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.artist && item.artist.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return (a.artist || '').localeCompare(b.artist || '');
        case 'duration':
          return (a.duration || '').localeCompare(b.duration || '');
        default:
          return 0;
      }
    });
  }, [content, searchTerm, sortBy]);

  const groupedContent = useMemo(() => {
    return filteredAndSortedContent.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [filteredAndSortedContent]);

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
            <div className="auth-header">
              <h2>🎵 Welcome to PKRK FM</h2>
              <p>Sign in to access your favorite Kannada content</p>
            </div>
            <Authenticator
              variation="modal"
              hideSignUp={false}
              signUpAttributes={['email']}
            >
              {({ signOut, user }) => {
                setUser(user);
                setShowAuth(false);
                return null;
              }}
            </Authenticator>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-browser">
      <header className="app-header">
        <div className="header-content">
          <h1>🎵 PKRK FM</h1>
          <p>Your Favorite Kannada Audio Streaming Platform</p>
          <div className="header-stats">
            <span className="stat-item">
              📊 {content.length} Audio Files
            </span>
            <span className="stat-item">
              📂 {categories.length - 1} Categories
            </span>
            {user && (
              <span className="stat-item">
                👤 Welcome, {user.attributes?.email?.split('@')[0]}
              </span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {user ? (
            <button onClick={() => { Auth.signOut(); setUser(null); }} className="auth-btn">
              Sign Out
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="auth-btn">
              Sign In / Sign Up
            </button>
          )}
        </div>
      </header>

      <div className="controls-section">
        <div className="search-filter">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search by title, artist, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="category-filter">
              <label>Category:</label>
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
            
            <div className="sort-filter">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="title">Title</option>
                <option value="artist">Artist</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-container">
          <div className="error">
            <h3>⚠️ Something went wrong</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              🔄 Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your favorite content...</p>
        </div>
      ) : filteredAndSortedContent.length === 0 ? (
        <div className="no-content">
          <h3>🔍 No content found</h3>
          <p>Try adjusting your search or filter settings</p>
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
              {filteredAndSortedContent.map(item => (
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

const ContentItem = React.memo(({ item, onPlay }) => {
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
            <span className="category">📁 {item.category}</span>
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
});

ContentItem.displayName = 'ContentItem';

export default EnhancedContentBrowser;
