import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, debounce, Typography } from '@mui/material';
import { Heart, Play } from 'lucide-react';

const VideoPreview = ({ videoUrl, thumbnailUrl, views, likes, isViewed, onThumbnailGenerated, onClick = () => {} }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [autoThumbnail, setAutoThumbnail] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const playVideo = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(error => {
                // Ignore abort errors, log others
                if (error.name !== 'AbortError') {
                    console.error('Error playing video:', error);
                }
            });
        }
    }, []);

    const pauseVideo = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
    }, []);

    const debouncedPlay = useCallback(debounce(playVideo, 200), [playVideo]);
    const debouncedPause = useCallback(debounce(pauseVideo, 200), [pauseVideo]);

    useEffect(() => {
        if (videoUrl && !thumbnailUrl) {
            generateThumbnail();
        }
    }, [videoUrl, thumbnailUrl]);

    useEffect(() => {
        if (isHovered) {
            debouncedPlay();
        } else {
            debouncedPause();
        }

        return () => {
            debouncedPlay.clear();
            debouncedPause.clear();
        };
    }, [isHovered, debouncedPlay, debouncedPause]);

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
                fetch(thumbnailDataUrl)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], "auto-thumbnail.jpg", { type: "image/jpeg" });
                        onThumbnailGenerated(file);
                    });
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
                aspectRatio: '12/16',
                cursor: 'pointer',
                margin: 'auto',
                overflow: 'hidden',
                borderRadius: '8px',
                overflow: 'hidden',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${thumbnailUrl || autoThumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(20px)',
                    transform: 'scale(1.1)',
                    zIndex: 1,
                }}
            />
            <img
                src={thumbnailUrl || autoThumbnail}
                alt={"thumbnail"}
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
            <Box sx={
                {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    top: 0,
                    zIndex: 10,
                    display: isViewed ? 'flex' : 'none',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    alignItems: 'center',
                }
            }>
                <Typography color={"#fff"}>
                    Đã Xem
                </Typography>
            </Box>
            <Box sx={{
                display: 'flex',
                position: 'absolute',
                justifyContent: 'space-between',
                bottom: 0,
                left: 0,
                right: 0,
            }}>
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: 'white',
                        padding: '8px',
                        textOverflow: 'ellipsis',
                        fontWeight: '600',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        zIndex: 3,
                    }}
                >
                    <Play size={12} strokeWidth={4} /> {" "}
                    {views}
                </Typography>
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: 'white',
                        padding: '8px',
                        textOverflow: 'ellipsis',
                        fontWeight: '600',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        zIndex: 3,
                    }}
                >
                    <Heart size={12} strokeWidth={4} /> {" "}
                    {likes}
                </Typography>
            </Box>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Box>
    );
};

export default VideoPreview;
