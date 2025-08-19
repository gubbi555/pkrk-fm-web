import React, { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import AudioPlayer from './AudioPlayer';

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

  const API_BASE_URL = 'https://1929mh4l2j.execute-api.ap-south-1.amazonaws.com/prod';

  useEffect(() => {
    fetchCategories();
    fetchContent();
    checkAuthStatus();
  }, []);

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
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(['all', ...data.categories]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  };

  const fetchContent = async (category) => {
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
  };

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
    <div className="content-browser">
      <header className="app-header">
        <h1>🎵 PKRK FM</h1>
        <p>Your Favorite Kannada Audio Streaming Platform</p>
        <div className="header-actions">
          <span>{content.length} Audio Files Available</span>
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
