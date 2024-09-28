import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Box, CircularProgress, debounce, Typography } from '@mui/material';
import ShortVideoComponent from '../components/VideoDetails';
import VideoPlayer from '../components/VideoPlayer';
import { useQuery } from '@apollo/client';
import { GET_RECOMMENDED_VIDEOS } from '../GraphQLQueries/videoQueries';
import CommentContext from '../contexts/commentContext';
const VIDEOS_PER_PAGE = 10;
const HomePage = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoStates, setVideoStates] = useState({});
    const [scrollPosition, setScrollPosition] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const containerRef = useRef(null);
    const loadingRef = useRef(false);

    const { loading: videoLoading, error: videoError, data, fetchMore } = useQuery(GET_RECOMMENDED_VIDEOS, {
        variables: {
            limit: VIDEOS_PER_PAGE
        }
    });

    const { showCommentVideoId } = useContext(CommentContext);

    const loadMore = useCallback(debounce(() => {
        console.log(hasMore);
        if (!hasMore) return;
        console.log('Loading video');
        fetchMore({
            variables: {
                limit: VIDEOS_PER_PAGE,
            },
        }).then((fetchMoreResult) => {
            const newVideos = fetchMoreResult.data.getRecommendedVideos;
            console.log(newVideos)
            if (newVideos.length > 0) {
                setVideos(pre => [...pre, ...newVideos]);
                setHasMore(newVideos.length === VIDEOS_PER_PAGE);
            } else {
                setHasMore(false);
            }
        });
    }, 100), [fetchMore, hasMore, videoLoading, videos]);

    useEffect(() => {
        if (data?.getRecommendedVideos.length > 0) {
            console.log(data.getRecommendedVideos);
            setVideos(data.getRecommendedVideos);
            setHasMore(data.getRecommendedVideos.length >= VIDEOS_PER_PAGE);
        }
    }, [data]);


    useEffect(() => {
        if (!selectedVideo && containerRef.current) {
            containerRef.current.scrollTop = scrollPosition;
        }
    }, [selectedVideo, scrollPosition]);

    const handleSmoothScroll = useCallback((event) => {
        console.log(videos, hasMore)
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
            // setCurrentVideoIndex(prev => Math.min(prev + 1, videos.length - 1));
        } else if (event.deltaY < 0 && currentScroll > 0) {
            // Scroll up
            container.scrollTo({
                top: targetScroll - videoHeight,
                behavior: 'smooth'
            });
            // setCurrentVideoIndex(prev => Math.max(prev - 1, 0));
        }

        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            console.log('Scroll to bottom of container');
            loadMore();
        }
    }, [videos, loadMore]);

    useEffect(() => {
        if (videos[currentVideoIndex]) {
            showCommentVideoId(videos[currentVideoIndex].id);
        }
    }, [currentVideoIndex, videos, showCommentVideoId]);

    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const { scrollTop, clientHeight } = container;
        const newIndex = Math.round(scrollTop / clientHeight);

        // if (newIndex !== currentVideoIndex) {
        //     setCurrentVideoIndex(newIndex);
        // }

        if (container.scrollHeight - scrollTop <= clientHeight + 100) {
            loadMore();
        }
    }, [currentVideoIndex, loadMore]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleSmoothScroll, { passive: false });
        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('wheel', handleSmoothScroll);
            container.removeEventListener('scroll', handleScroll);
        };
    }, [handleSmoothScroll, loadMore, handleScroll]);

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
    if (videoError) return <Typography color="error">Error: {videoError.message}</Typography>;
    return (
        <Box
            ref={containerRef}
            sx={{
                height: 'calc(100vh - 64px)',
                scrollSnapType: 'y mandatory',
                overflowY: 'hidden',
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
            {videoLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            )}
        </Box>
    );
};

export default HomePage;
