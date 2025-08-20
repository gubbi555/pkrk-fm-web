import React, { useState, useEffect, useMemo } from 'react';
import { Auth } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import EnhancedAudioPlayer from './EnhancedAudioPlayer';
import apiCache from '../utils/apiCache';

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
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

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

  const checkAuthStatus = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  const fetchCategories = async () => {
    try {
      // Check cache first
      const cached = apiCache.get('categories');
      if (cached) {
        setCategories(['all', ...cached]);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const data = await response.json();
      const categoryList = data.categories || [];
      
      // Cache for 10 minutes
      apiCache.set('categories', categoryList, 600000);
      setCategories(['all', ...categoryList]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  };

  const fetchContent = async (category = null) => {
    try {
      setLoading(true);
      const cacheKey = `content-${category || 'all'}`;
      
      // Check cache first
      const cached = apiCache.get(cacheKey);
      if (cached) {
        setContent(cached);
        setLoading(false);
        return;
      }

      const url = category && category !== 'all' 
        ? `${API_BASE_URL}/content?category=${category}`
        : `${API_BASE_URL}/content`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch content');
      
      const data = await response.json();
      const contentList = data.items || [];
      
      // Cache for 5 minutes
      apiCache.set(cacheKey, contentList, 300000);
      setContent(contentList);
      setError(null);
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content');
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchContent(category);
  };

  const playTrack = (track, playlist = null) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    const trackPlaylist = playlist || filteredContent;
    const trackIndex = trackPlaylist.findIndex(item => item.contentId === track.contentId);
    
    setCurrentTrack(track);
    setCurrentPlaylist(trackPlaylist);
    setCurrentTrackIndex(trackIndex);
  };

  const playNext = () => {
    if (currentTrackIndex < currentPlaylist.length - 1) {
      const nextTrack = currentPlaylist[currentTrackIndex + 1];
      setCurrentTrack(nextTrack);
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };

  const playPrevious = () => {
    if (currentTrackIndex > 0) {
      const prevTrack = currentPlaylist[currentTrackIndex - 1];
      setCurrentTrack(prevTrack);
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  // Enhanced filtering and searching
  const filteredContent = useMemo(() => {
    let filtered = content;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.artist?.toLowerCase().includes(query) ||
        item.album?.toLowerCase().includes(query)
      );
    }

    // Sort content
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return (a.artist || '').localeCompare(b.artist || '');
        case 'duration':
          return parseFloat(a.duration || 0) - parseFloat(b.duration || 0);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [content, searchQuery, sortBy]);

  const groupedContent = useMemo(() => {
    return filteredContent.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [filteredContent]);

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
          <Authenticator>
            {({ signOut, user }) => {
              setUser(user);
              setShowAuth(false);
              return null;
            }}
          </Authenticator>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-content-browser">
      <header className="app-header">
        <h1>🎵 PKRK FM</h1>
        <p>Your Favorite Kannada Audio Streaming Platform</p>
        <div className="header-actions">
          <span className="stats">{filteredContent.length} Audio Files Available</span>
          {user ? (
            <button onClick={() => { Auth.signOut(); setUser(null); }} className="auth-btn">
              Sign Out ({user.attributes?.email})
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="auth-btn">
              Sign In / Sign Up
            </button>
          )}
        </div>
      </header>

      <div className="controls-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search tracks, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="category-filter">
            <label>Category: </label>
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
            <label>Sort by: </label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="duration">Duration</option>
              <option value="category">Category</option>
            </select>
          </div>

          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your favorite content...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error">
            <p>⚠️ {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      ) : (
        <div className={`content-grid ${viewMode}`}>
          {selectedCategory === 'all' ? (
            Object.entries(groupedContent).map(([category, items]) => (
              <div key={category} className="category-section">
                <h2>
                  {category.charAt(0).toUpperCase() + category.slice(1)} 
                  <span className="count">({items.length})</span>
                </h2>
                <div className="content-items">
                  {items.map(item => (
                    <EnhancedContentItem 
                      key={item.contentId} 
                      item={item} 
                      onPlay={(track) => playTrack(track, items)}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="content-items">
              {filteredContent.map(item => (
                <EnhancedContentItem 
                  key={item.contentId} 
                  item={item} 
                  onPlay={(track) => playTrack(track, filteredContent)}
                  viewMode={viewMode}
                />
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
            <EnhancedAudioPlayer
              streamingUrl={currentTrack.streamingUrl}
              title={currentTrack.title}
              description={currentTrack.description}
              onNext={currentTrackIndex < currentPlaylist.length - 1 ? playNext : null}
              onPrevious={currentTrackIndex > 0 ? playPrevious : null}
              playlist={currentPlaylist}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const EnhancedContentItem = ({ item, onPlay, viewMode }) => {
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
      className={`content-item ${viewMode}`}
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
            {item.album && <span className="album">💿 {item.album}</span>}
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

export default EnhancedContentBrowser;
