import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';

const AudioPlayer = ({ streamingUrl, title, description }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const audioRef = useRef(null);
  const hlsRef = useRef(null);

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

  const initializePlayer = () => {
    const audio = audioRef.current;
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      
      hlsRef.current = hls;
      hls.loadSource(streamingUrl);
      hls.attachMedia(audio);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        setError(null);
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        setError('Failed to load audio stream');
        setLoading(false);
      });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = streamingUrl;
      setLoading(false);
    } else {
      setError('HLS not supported in this browser');
      setLoading(false);
    }
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
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
    const clickX = e.nativeEvent.offsetX;
    const width = e.currentTarget.offsetWidth;
    const newTime = (clickX / width) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="audio-player loading">
        <div className="loading-spinner"></div>
        <p>Loading audio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audio-player error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
      
      <div className="player-info">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      
      <div className="player-controls">
        <button 
          className="play-pause-btn"
          onClick={togglePlayPause}
          disabled={loading}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="time-info">
          <span>{formatTime(currentTime)}</span>
        </div>
        
        <div className="progress-container" onClick={handleSeek}>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="time-info">
          <span>{formatTime(duration)}</span>
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

export default AudioPlayer;
