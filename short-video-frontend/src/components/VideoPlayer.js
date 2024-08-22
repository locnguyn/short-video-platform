import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

const StyledVideo = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  backgroundColor: 'black',
});

const ControlsOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  color: 'white',
  padding: theme.spacing(2),
  transition: 'bottom 0.3s ease-in-out',
}));

const VideoPlayer = ({ video, onClick, videoStates }) => {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(videoStates?.currentVolume || 0.5);
  const [currentTime, setCurrentTime] = useState(videoStates?.currentTime || 0);
  const [duration, setDuration] = useState(0);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      videoRef.current.currentTime = videoStates?.currentTime || 0;
      videoRef.current.volume = videoStates?.volume || 0.5;
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible && !isVideoLoaded) {
      videoRef.current.load();
    }
  }, [isVisible, isVideoLoaded]);

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
    setDuration(videoRef.current.duration);
    if (isVisible) {
      attemptAutoplay();
    }
  };

  const attemptAutoplay = () => {
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.warn("Autoplay was prevented:", error);
        setIsPlaying(false);
      });
    }
  };

  useEffect(() => {
    if (isVisible && isVideoLoaded) {
      attemptAutoplay();
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isVisible, isVideoLoaded]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
  };

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    videoRef.current.currentTime = time;
  };

  const handleControlClick = (e) => {
    e.stopPropagation();
  };

  const toggleVolume = (e) => {
    e.stopPropagation();
    const newVolume = volume === 0 ? 1 : 0;
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
  };

  const handleVideoClick = () => {
    if (onClick) {
      onClick(video, videoRef);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        scrollSnapAlign: 'start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          maxWidth: '30%',
          height: '90vh',
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
        onClick={handleVideoClick}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {!isVideoLoaded && (
          <Box
            component="img"
            src={video.thumbnail}
            alt={video.title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        )}
        <StyledVideo
          ref={videoRef}
          src={video.videoUrl}
          loop
          playsInline
          onLoadedData={handleVideoLoaded}
          onTimeUpdate={handleTimeUpdate}
          sx={{ display: isVideoLoaded ? 'block' : 'none' }}
        />
        <ControlsOverlay
          sx={{ bottom: showControls ? '0' : '-100%' }}
          onClick={handleControlClick}
        >
          <Typography variant="h6">{video.title}</Typography>
          <Typography variant="body2">{video.views} views</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <IconButton onClick={togglePlay} sx={{ color: 'white', p: 0 }}>
              {isPlaying ? (
                <Pause color='#fff' size={24} />
              ) : (
                <Play color='#fff' size={24} />
              )}
            </IconButton>
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              style={{
                flex: 1,
                margin: '0 10px',
                WebkitAppearance: 'none',
                background: `linear-gradient(90deg, rgba(255,0,0,1) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)`
              }}
            />
            <Box
              sx={{ position: 'relative' }}
              onMouseEnter={() => setShowVolumeControl(true)}
              onMouseLeave={() => setShowVolumeControl(false)}
            >
              <IconButton onClick={toggleVolume} sx={{ color: 'white', p: 0 }}>
                {volume === 0 ? (
                  <VolumeX size={24} />
                ) : (
                  <Volume2 size={24} />
                )}
              </IconButton>
              {showVolumeControl && (
                <Box sx={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '30px',
                  height: '100px',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: '15px',
                  padding: '10px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{
                      WebkitAppearance: 'none',
                      width: '80px',
                      height: '4px',
                      background: '#fff',
                      outline: 'none',
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center',
                      background: `linear-gradient(90deg, rgba(255,0,0,1) ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%)`
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </ControlsOverlay>
      </Box>
      <style>
        {`
        input[type=range] {
          -webkit-appearance: none;
          margin: 10px 0;
          width: 100%;
          background: transparent;
        }
        input[type=range]:focus {
          outline: none;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 3px;
          cursor: pointer;
          animate: 0.1s;
          border-radius: 1.5px;
        }
        input[type=range]::-webkit-slider-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          -webkit-appearance: none;
          margin-top: -4.5px;
          box-shadow: 0 0 3px rgba(0,0,0,0.4);
        }
        input[type=range]:focus::-webkit-slider-runnable-track {
        }
        input[type=range]::-moz-range-track {
          width: 100%;
          height: 3px;
          cursor: pointer;
          animate: 0.1s;
          border-radius: 1.5px;
        }
        input[type=range]::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 3px rgba(0,0,0,0.4);
        }
        `}
      </style>
    </Box>
  );
};

export default VideoPlayer;
