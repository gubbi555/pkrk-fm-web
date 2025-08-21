import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

const ContentBrowser = () => {
  const [audioData, setAudioData] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const hlsRef = useRef(null);

  // Use environment variables for Amplify
  const CLOUDFRONT_URL = process.env.REACT_APP_CLOUDFRONT_URL;
  const S3_METADATA_BUCKET = process.env.REACT_APP_S3_METADATA_BUCKET;
  const S3_STATIC_ASSETS = process.env.REACT_APP_S3_STATIC_ASSETS;

  // List of all your metadata files
  const metadataFiles = [
    'metadata/kannada/music/MonssonRaga/Hombisilina (PenduJatt.Com.Se).json',
    'metadata/kannada/music/MonssonRaga/Muddada Moothi (PenduJatt.Com.Se).json',
    'metadata/kannada/music/Paramathma/Hesaru Poorthi (PenduJatt.Com.Se).json',
    'metadata/kannada/music/Paramathma/Thanmayaladenu (PenduJatt.Com.Se).json',
    'metadata/kannada/music/Raj/Kuch Kuch Anthide (PenduJatt.Com.Se).json',
    'metadata/kannada/music/Raj/Raja Heluvagella (PenduJatt.Com.Se).json',
    'metadata/kannada/educational/Season1/Episode1.json',
    'metadata/kannada/educational/Season1/Episode2.json',
    'metadata/kannada/educational/Season2/Episode1.json',
    'metadata/kannada/educational/Season2/Episode2.json',
    'metadata/kannada/podcasts/Film/Season1/Episode1.json',
    'metadata/kannada/podcasts/Film/Season1/Episode2.json',
    'metadata/kannada/podcasts/Film/Season2/Episode1.json',
    'metadata/kannada/podcasts/Film/Season2/Episode2.json',
    'metadata/kannada/podcasts/Seriel/Season1/Episode1.json',
    'metadata/kannada/podcasts/Seriel/Season1/Episode2.json',
    'metadata/kannada/podcasts/Seriel/Season2/Episode1.json',
    'metadata/kannada/podcasts/Seriel/Season2/Episode2.json',
    'metadata/kannada/stories/Horror/Season1/Episode1.json',
    'metadata/kannada/stories/Horror/Season1/Episode2.json',
    'metadata/kannada/stories/Horror/Season2/Episode1.json',
    'metadata/kannada/stories/Horror/Season2/Episode2.json',
    'metadata/kannada/stories/Thriller/Season1/Episode1.json',
    'metadata/kannada/stories/Thriller/Season1/Episode2.json',
    'metadata/kannada/stories/Thriller/Season2/Episode1.json',
    'metadata/kannada/stories/Thriller/Season2/Episode2.json',
  ];

  useEffect(() => {
    const fetchAudioMetadata = async () => {
      try {
        console.log('🔄 Loading metadata from S3...');
        const audioMetadata = [];
        
        for (const metadataFile of metadataFiles) {
          try {
            const metadataUrl = `${S3_METADATA_BUCKET}/${metadataFile}`;
            const response = await fetch(metadataUrl);
            
            if (!response.ok) {
              console.warn('⚠️ Failed to fetch:', metadataFile);
              continue;
            }
            
            const metadata = await response.json();
            
            // Convert file path to HLS CloudFront URL
            const hlsPath = metadata.file_path
              .replace('.mp3', '/index.m3u8')
              .replace('audio/', '');
            
            const hlsUrl = `${CLOUDFRONT_URL}/${hlsPath}`;
            
            audioMetadata.push({
              ...metadata,
              hlsUrl: hlsUrl,
              thumbnailUrl: `${S3_STATIC_ASSETS}/${metadata.thumbnail}`
            });
            
          } catch (error) {
            console.error('❌ Error fetching metadata:', metadataFile, error);
          }
        }
        
        setAudioData(audioMetadata);
        console.log('✅ Loaded', audioMetadata.length, 'audio tracks');
        
      } catch (error) {
        console.error('❌ Error loading audio metadata:', error);
      }
    };

    fetchAudioMetadata();
  }, []);

  const handlePlayAudio = async (audio) => {
    console.log('🎵 Playing:', audio.title);
    console.log('🔗 HLS URL:', audio.hlsUrl);

    try {
      setIsLoading(true);
      
      // Stop current playback
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setCurrentAudio(audio);

      if (Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          enableWorker: false,
        });
        
        hlsRef.current = hls;
        
        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          console.log('✅ HLS ready');
          try {
            await audioRef.current.play();
            setIsPlaying(true);
            setIsLoading(false);
            console.log('🎵 Playing successfully');
          } catch (playError) {
            console.error('❌ Play failed:', playError);
            setIsLoading(false);
          }
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ HLS error:', data);
          if (data.fatal) {
            setIsLoading(false);
            setIsPlaying(false);
            alert('Playback failed: ' + data.details);
          }
        });
        
        hls.loadSource(audio.hlsUrl);
        hls.attachMedia(audioRef.current);
        
      } else {
        // Fallback for browsers without HLS.js support
        audioRef.current.src = audio.hlsUrl;
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
      }

    } catch (error) {
      console.error('❌ Playback error:', error);
      setIsLoading(false);
      setIsPlaying(false);
      alert('Failed to play: ' + error.message);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="content-browser">
      <h1>🎵 PKRK FM</h1>
      <h2>ಕನ್ನಡ ಆಡಿಯೋ ವಿಷಯ</h2>
      
      {audioData.length === 0 ? (
        <div className="loading">🔄 Loading audio content...</div>
      ) : (
        <div className="audio-grid">
          {audioData.map((audio) => (
            <div key={audio.id} className="audio-card">
              <img 
                src={audio.thumbnailUrl} 
                alt={audio.title}
                className="audio-thumbnail"
                onError={(e) => {
                  e.target.src = '/path/to/default-thumbnail.jpg';
                }}
              />
              <div className="audio-info">
                <h3>{audio.title}</h3>
                <p className="audio-meta">
                  📂 {audio.category} • {audio.subcategory}
                </p>
                <p className="audio-duration">⏱️ {audio.duration}</p>
                {audio.movie && (
                  <p className="audio-movie">🎬 {audio.movie}</p>
                )}
              </div>
              
              <button 
                onClick={() => {
                  if (currentAudio?.id === audio.id && isPlaying) {
                    handlePause();
                  } else {
                    handlePlayAudio(audio);
                  }
                }}
                disabled={isLoading && currentAudio?.id === audio.id}
                className="play-button"
              >
                {isLoading && currentAudio?.id === audio.id ? 
                  '🔄 Loading...' : 
                  (currentAudio?.id === audio.id && isPlaying) ? 
                    '⏸️ Pause' : '▶️ Play Now'
                }
              </button>
            </div>
          ))}
        </div>
      )}

      <audio 
        ref={audioRef}
        style={{ display: 'none' }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentAudio(null);
        }}
      />

      {currentAudio && (
        <div className="now-playing">
          <p>🎵 {currentAudio.title}</p>
        </div>
      )}
    </div>
  );
};

export default ContentBrowser;
