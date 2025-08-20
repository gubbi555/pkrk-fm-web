import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';

const EnhancedAudioPlayer = ({ streamingUrl, title, description, onNext, onPrevious, playlist }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  
  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const progressRef = useRef(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (streamingUrl && audioRef.current) {
      initializePlayer();
    }
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamingUrl]);

  const initializePlayer = useCallback(() => {
    const audio = audioRef.current;
    setLoading(true);
    setError(null);
    
    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      
      hlsRef.current = hls;
      hls.loadSource(streamingUrl);
      hls.attachMedia(audio);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        setError('Failed to load audio stream');
        setLoading(false);
      });
      
      hls.on(Hls.Events.BUFFER_APPENDING, () => setIsBuffering(true));
      hls.on(Hls.Events.BUFFER_APPENDED, () => setIsBuffering(false));
      
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = streamingUrl;
      setLoading(false);
    } else {
      setError('HLS not supported in this browser');
      setLoading(false);
    }
  }, [streamingUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const adjustVolume = (delta) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    setDuration(audio.duration);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    audioRef.current.playbackRate = rate;
  };

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="enhanced-audio-player loading">
        <div className="loading-spinner"></div>
        <p>Loading premium audio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enhanced-audio-player error">
        <p>⚠️ {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="enhanced-audio-player">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onNext) onNext();
        }}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        preload="metadata"
      />
      
      <div className="player-header">
        <div className="track-info">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="player-extras">
          <button 
            className="playback-rate-btn"
            onClick={() => {
              const rates = [0.75, 1, 1.25, 1.5, 2];
              const currentIndex = rates.indexOf(playbackRate);
              const nextRate = rates[(currentIndex + 1) % rates.length];
              handlePlaybackRateChange(nextRate);
            }}
          >
            {playbackRate}×
          </button>
        </div>
      </div>
      
      <div className="player-controls">
        {onPrevious && (
          <button className="control-btn" onClick={onPrevious}>
            ⏮️
          </button>
        )}
        
        <button className="control-btn" onClick={() => seek(-10)}>
          ⏪
        </button>
        
        <button 
          className="play-pause-btn primary"
          onClick={togglePlayPause}
          disabled={loading || isBuffering}
        >
          {isBuffering ? '⏳' : (isPlaying ? '⏸️' : '▶️')}
        </button>
        
        <button className="control-btn" onClick={() => seek(10)}>
          ⏩
        </button>
        
        {onNext && (
          <button className="control-btn" onClick={onNext}>
            ⏭️
          </button>
        )}
      </div>
      
      <div className="progress-section">
        <span className="time-display">{formatTime(currentTime)}</span>
        
        <div 
          ref={progressRef}
          className="progress-container" 
          onClick={handleSeek}
        >
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <span className="time-display">{formatTime(duration)}</span>
      </div>
      
      <div className="volume-section">
        <button 
          className="volume-btn"
          onClick={() => setShowVolumeControl(!showVolumeControl)}
        >
          {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>
        
        {showVolumeControl && (
          <div className="volume-slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                setVolume(newVolume);
                audioRef.current.volume = newVolume;
              }}
              className="volume-slider"
            />
          </div>
        )}
      </div>
      
      <div className="keyboard-shortcuts">
        <small>
          🎹 Space: Play/Pause | ← →: Seek | ↑ ↓: Volume
        </small>
      </div>
    </div>
  );
};

export default EnhancedAudioPlayer;
