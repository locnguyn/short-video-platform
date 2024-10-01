import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { Box, Typography, CircularProgress, Grid, Container } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import VideoPreview from './VideoPreview';
import { GET_USER_VIDEO } from '../GraphQLQueries/videoQueries';
import UserInfo from './UserInfo'; // Assuming you've moved UserInfo to a separate file

const VIDEOS_PER_PAGE = 12;

const UserProfile = () => {
    const { userId } = useParams();
    const [page, setPage] = useState(1);
    const [videos, setVideos] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const loader = useRef(null);

    const { loading, error, data, fetchMore } = useQuery(GET_USER_VIDEO, {
        variables: { id: userId, page: 1, limit: VIDEOS_PER_PAGE },
        notifyOnNetworkStatusChange: true,
    });

    useEffect(() => {
        setVideos([]);
        setPage(1);
        setHasMore(true);
    }, [userId]);

    useEffect(() => {
        if (data?.getUserVideos) {
            setVideos(data.getUserVideos);
            setHasMore(data.getUserVideos.length >= VIDEOS_PER_PAGE);
        }
    }, [data, userId]);

    const loadMore = useCallback(() => {
        if (!hasMore) return;

        console.log(" load more")
        fetchMore({
            variables: {
                id: userId,
                page: page + 1,
                limit: VIDEOS_PER_PAGE,
            },
        }).then((fetchMoreResult) => {
            const newVideos = fetchMoreResult.data.getUserVideos;
            if (newVideos.length > 0) {
                setVideos([...videos, ...newVideos]);
                setPage(page + 1);
                setHasMore(newVideos.length === VIDEOS_PER_PAGE);
            } else {
                setHasMore(false);
            }
        });
    }, [fetchMore, hasMore, loading, page, userId]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop
                >= document.documentElement.offsetHeight - 100
            ) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMore]);

    if (error) return <Typography color="error">Error: {error.message}</Typography>;

    return (
        <Container maxWidth="lg">
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <UserInfo userId={userId} />
                <Grid container spacing={0.5}>
                    {videos.map((video) => (
                        <Grid item xs={4} sm={3} md={3} lg={2} key={video.id}>
                            <VideoPreview
                                videoUrl={video.videoUrl}
                                thumbnailUrl={video.thumbnailUrl}
                                views={video.views}
                                likes={video.likeCount}
                                isViewed={video.isViewed}
                                aspectRatio='9/16'
                                onClick={() => {
                                    navigate(`/${userId}/video/${video.id}`, {
                                        state: {
                                            prevUrl: location.pathname
                                        }
                                    })
                                }}
                            />
                        </Grid>
                    ))}
                </Grid>
                {hasMore && <div ref={loader} style={{ height: "20px", margin: "20px 0" }} />}
                {loading && <CircularProgress sx={{ mt: 2, display: 'block', margin: '0 auto' }} />}
                {!hasMore && <Typography sx={{ mt: 2, textAlign: 'center' }}>No more videos to load</Typography>}
            </Box>
        </Container>
    );
};

export default UserProfile;
