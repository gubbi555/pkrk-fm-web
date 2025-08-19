import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';

const EnhancedAudioPlayer = ({ streamingUrl, title, description }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const audioRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamingUrl) return;

    setIsLoading(true);
    setError(null);

    // HLS.js support
    if (Hls.isSupported() && streamingUrl.includes('.m3u8')) {
      const hls = new Hls();
      hlsRef.current = hls;
      
      hls.loadSource(streamingUrl);
      hls.attachMedia(audio);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setError('Failed to load audio stream');
          setIsLoading(false);
        }
      });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      audio.src = streamingUrl;
      audio.addEventListener('loadedmetadata', () => setIsLoading(false));
      audio.addEventListener('error', () => {
        setError('Failed to load audio');
        setIsLoading(false);
      });
    } else {
      // Fallback for regular audio files
      audio.src = streamingUrl;
      audio.addEventListener('loadedmetadata', () => setIsLoading(false));
      audio.addEventListener('error', () => {
        setError('Failed to load audio');
        setIsLoading(false);
      });
    }

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [streamingUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        setError('Playback failed');
        console.error('Playback error:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="enhanced-audio-player">
      <audio ref={audioRef} preload="metadata" />
      
      <div className="player-info">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {error && (
        <div className="player-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="player-controls">
        <button 
          onClick={togglePlayPause}
          disabled={isLoading || error}
          className={`play-pause-btn ${isLoading ? 'loading' : ''}`}
        >
          {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className="progress-section">
          <div 
            className="progress-bar" 
            onClick={handleSeek}
          >
            <div 
              className="progress-fill"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="volume-control">
          <span>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedAudioPlayer;
