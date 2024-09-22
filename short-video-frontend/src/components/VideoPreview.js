import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

const VideoPreview = ({ videoUrl, thumbnailUrl, title, onThumbnailGenerated }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [autoThumbnail, setAutoThumbnail] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (videoUrl && !thumbnailUrl) {
      generateThumbnail();
    }
  }, [videoUrl, thumbnailUrl]);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isHovered]);

  const generateThumbnail = () => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.onloadeddata = () => {
      video.currentTime = 0;
    };
    video.onseeked = () => {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg');
      setAutoThumbnail(thumbnailDataUrl);
      if (onThumbnailGenerated) {
        onThumbnailGenerated(thumbnailDataUrl);
      }
    };
  };

  const effectiveThumbnail = thumbnailUrl || autoThumbnail;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 300,
        aspectRatio: '9/16',
        cursor: 'pointer',
        margin: 'auto',
        overflow: 'hidden',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${effectiveThumbnail})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
          zIndex: 1,
        }}
      />
      <img
        src={effectiveThumbnail}
        alt={title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 2,
          opacity: isHovered ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        loop
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
      <Typography
        variant="subtitle1"
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          zIndex: 3,
        }}
      >
        {title}
      </Typography>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default VideoPreview;
