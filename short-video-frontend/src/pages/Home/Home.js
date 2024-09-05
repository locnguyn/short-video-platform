import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import ShortVideoComponent from '../../components/VideoDetails';
import VideoPlayer from '../../components/VideoPlayer';

const HomePage = () => {
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoStates, setVideoStates] = useState({});
    const [scrollPosition, setScrollPosition] = useState(0);
    const containerRef = useRef(null);
    const loadingRef = useRef(false);

    const loadVideos = useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const newVideos = await fetchVideos(page);
            setVideos(prevVideos => [...prevVideos, ...newVideos]);
            setPage(prevPage => prevPage + 1);
            console.log(page);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [page]);

    useEffect(() => {
        loadVideos();
    }, []);


    const fetchVideos = async (page) => {
        // Giả lập API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { id: page * 3 - 2, title: `Video ${page * 3 - 2}`, views: Math.floor(Math.random() * 1000000), thumbnail: `https://picsum.photos/id/${page * 3 - 2}/1080/1920`, videoUrl: "https://s3.ap-southeast-1.amazonaws.com/locshortvideo.com/39564c71-bc55-4832-a837-c192413ce42c-1.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIASU566UIPCGQZBM3T%2F20240904%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20240904T140535Z&X-Amz-Expires=3600&X-Amz-Signature=9a61f86eab87b0a146d4c4549bb8854071e01c9f03c5e64d85e300c3778d4666&X-Amz-SignedHeaders=host&x-id=GetObject" },
                    { id: page * 3 - 1, title: `Video ${page * 3 - 1}`, views: Math.floor(Math.random() * 1000000), thumbnail: `https://picsum.photos/id/${page * 3 - 1}/1080/1920`, videoUrl: "https://s3.ap-southeast-1.amazonaws.com/locshortvideo.com/39564c71-bc55-4832-a837-c192413ce42c-1.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIASU566UIPCGQZBM3T%2F20240904%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20240904T140535Z&X-Amz-Expires=3600&X-Amz-Signature=9a61f86eab87b0a146d4c4549bb8854071e01c9f03c5e64d85e300c3778d4666&X-Amz-SignedHeaders=host&x-id=GetObject" },
                    { id: page * 3, title: `Video ${page * 3}`, views: Math.floor(Math.random() * 1000000), thumbnail: `https://picsum.photos/id/${page * 3}/1080/1920`, videoUrl: "https://s3.ap-southeast-1.amazonaws.com/locshortvideo.com/39564c71-bc55-4832-a837-c192413ce42c-1.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIASU566UIPCGQZBM3T%2F20240904%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20240904T140535Z&X-Amz-Expires=3600&X-Amz-Signature=9a61f86eab87b0a146d4c4549bb8854071e01c9f03c5e64d85e300c3778d4666&X-Amz-SignedHeaders=host&x-id=GetObject" },
                ]);
            }, 1000);
        });
    };

    useEffect(() => {
        if (!selectedVideo && containerRef.current) {
            containerRef.current.scrollTop = scrollPosition;
        }
    }, [selectedVideo, scrollPosition]);

    const handleSmoothScroll = useCallback((event) => {
        console.log('handleSmoothScroll')
        event.preventDefault();
        const container = containerRef.current;
        const videoHeight = container.clientHeight;
        const currentScroll = container.scrollTop;
        const targetScroll = Math.round(currentScroll / videoHeight) * videoHeight;

        if (event.deltaY > 0 && currentScroll < container.scrollHeight - videoHeight) {
            // Scroll down
            container.scrollTo({
                top: targetScroll + videoHeight,
                behavior: 'smooth'
            });
        } else if (event.deltaY < 0 && currentScroll > 0) {
            // Scroll up
            container.scrollTo({
                top: targetScroll - videoHeight,
                behavior: 'smooth'
            });
        }
    }, []);

    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            loadVideos();
        }
    }, [])

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleSmoothScroll, { passive: false });
        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('wheel', handleSmoothScroll);
            container.removeEventListener('scroll', handleScroll);
        };
    }, [handleSmoothScroll, loadVideos, handleScroll]);

    const handleVideoClick = useCallback((video, videoRef) => {
        if (containerRef.current) {
            setScrollPosition(containerRef.current.scrollTop);
        }
        setVideoStates(prevStates => ({
            ...prevStates,
            [video.id]: {
                currentTime: videoRef.current.currentTime || 0,
                currentVolume: videoRef.current.currentVolume || 0.5
            }
        }));
        setSelectedVideo(video);
    }, []);

    const handleBackToHome = useCallback((video) => {
        setVideoStates(prevStates => ({
            ...prevStates,
            [video.id]: {
                currentTime: video.currentTime || 0,
                currentVolume: video.currentVolume || 0.5
            }
        }));
        setSelectedVideo(null);
        setTimeout(() => {
            const currentContainer = containerRef.current;
            if (currentContainer) {
                currentContainer.addEventListener('wheel', handleSmoothScroll, { passive: false });
                currentContainer.addEventListener('scroll', handleScroll);
            }
        }, 0);
    }, []);

    if (selectedVideo) {
        console.log(videoStates)
        return (
            <ShortVideoComponent
                video={selectedVideo}
                onClose={handleBackToHome}
                initialTime={videoStates[selectedVideo.id]?.currentTime || 0}
                initialVolume={videoStates[selectedVideo.id]?.currentVolume || 0.5}
            />
        );
    }

    return (
        <Box
            ref={containerRef}
            sx={{
                height: 'calc(100vh - 64px)',
                scrollSnapType: 'y mandatory',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                    width: '6px',
                    backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                    borderRadius: '3px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.3)',
                    },
                },
                // For Firefox
                // scrollbarWidth: 'thin',
                // scrollbarColor: 'rgba(0,0,0,0.2) transparent',
            }}
        >
            {videos.map((video, index) => (
                <Box
                    key={index}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        scrollSnapAlign: 'start',
                        scrollSnapStop: 'always',
                        mb: 2
                    }}
                >
                    <VideoPlayer
                        video={video}
                        onClick={handleVideoClick}
                        videoStates={videoStates[video.id] || {}}
                    />
                </Box>
            ))}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                </Box>
            )}
        </Box>
    );
};

export default HomePage;
