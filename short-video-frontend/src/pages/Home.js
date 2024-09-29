import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Box, CircularProgress, debounce, Typography } from '@mui/material';
import ShortVideoComponent from '../components/VideoDetails';
import VideoPlayer from '../components/VideoPlayer';
import { useQuery } from '@apollo/client';
import { GET_RECOMMENDED_VIDEOS } from '../GraphQLQueries/videoQueries';
import CommentContext from '../contexts/commentContext';

const VIDEOS_PER_PAGE = 10;
const RENDER_WINDOW = 3; // Number of videos to render above and below the current video

const HomePage = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoStates, setVideoStates] = useState({});
    const [scrollPosition, setScrollPosition] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const containerRef = useRef(null);
    const continueScrollRef = useRef(null);

    const { loading: videoLoading, error: videoError, data, fetchMore } = useQuery(GET_RECOMMENDED_VIDEOS, {
        variables: {
            limit: VIDEOS_PER_PAGE
        }
    });

    const { showCommentVideoId } = useContext(CommentContext);

    const loadMore = useCallback(debounce(() => {
        if (!hasMore) return;
        console.log('Loading more videos');
        fetchMore({
            variables: {
                limit: VIDEOS_PER_PAGE,
            },
        }).then((fetchMoreResult) => {
            const newVideos = fetchMoreResult.data.getRecommendedVideos;
            if (newVideos.length > 0) {
                setVideos(pre => [...pre, ...newVideos]);
                setHasMore(newVideos.length === VIDEOS_PER_PAGE);
            } else {
                setHasMore(false);
            }
        });
    }, 100), [fetchMore, hasMore]);

    useEffect(() => {
        if (data?.getRecommendedVideos.length > 0) {
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

        if (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) {
            loadMore();
        }
    }, [videos, loadMore]);

    const lastScrollTime = useRef(Date.now());
    const lastIndex = useRef(0);

    const updateIndexAndComment = useCallback((newIndex) => {
        if (newIndex !== currentVideoIndex) {
            setCurrentVideoIndex(newIndex);
            showCommentVideoId(videos[newIndex]?.id);
        }
    }, [currentVideoIndex, videos, showCommentVideoId]);

    const debouncedUpdateIndex = useCallback(
        debounce((newIndex) => {
            updateIndexAndComment(newIndex);
        }, 200),
        [updateIndexAndComment]
    );

    const handleScroll = useCallback((e) => {
        const container = containerRef.current;
        if (!container) return;

        const { scrollTop, clientHeight, scrollHeight } = container;
        const newIndex = Math.round(scrollTop / clientHeight);

        const currentTime = Date.now();
        const timeSinceLastScroll = currentTime - lastScrollTime.current;

        if (timeSinceLastScroll > 200) {
            updateIndexAndComment(newIndex);
        } else {
            debouncedUpdateIndex(newIndex);
        }

        lastScrollTime.current = currentTime;
        lastIndex.current = newIndex;

        if (scrollHeight - scrollTop <= clientHeight + 100) {
            loadMore();
        }
    }, [updateIndexAndComment, debouncedUpdateIndex, loadMore]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleSmoothScroll, { passive: false });
        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('wheel', handleSmoothScroll);
            container.removeEventListener('scroll', handleScroll);
        };
    }, [handleSmoothScroll, handleScroll]);

    const handleVideoClick = useCallback((video, videoRef) => {
        if (containerRef.current) {
            setScrollPosition(containerRef.current.scrollTop);
        }
        setVideoStates(prevStates => ({
            ...prevStates,
            [video.id]: {
                currentTime: videoRef.current.currentTime || 0,
                currentVolume: videoRef.current.volume || 0.5
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
    }, []);

    const shouldRenderVideo = (index) => {
        return index >= currentVideoIndex - RENDER_WINDOW && index <= currentVideoIndex + RENDER_WINDOW;
    };

    const renderVideoContent = (video, index) => {
        if (shouldRenderVideo(index)) {
            return (
                <VideoPlayer
                    key={video.id}
                    video={video}
                    onClick={handleVideoClick}
                    videoStates={videoStates[video.id] || {}}
                />
            );
        }
        return null;
    };

    if (selectedVideo) {
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
                    {renderVideoContent(video, index)}
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
