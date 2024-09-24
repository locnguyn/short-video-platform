import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import { Box, Typography, CircularProgress, Grid, Card, Container, Avatar, Button, useTheme } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import VideoPreview from './VideoPreview';
import { debounce } from 'lodash';
import { FOLLOW_USER, UNFOLLOW_USER } from '../GraphQLQueries/followQueries';

const GET_USER_PROFILE = gql`
    query GetUser($userId: String!) {
        getUser(id: $userId) {
            id
            username
            email
            profilePicture
            followerCount
            followingCount
            isFollowed
        }
    }
`;

const GET_USER_VIDEO = gql`
    query GetUserVideos($id: String!, $page: Int!, $limit: Int!) {
        getUserVideos(id: $id, page: $page, limit: $limit) {
            id
            thumbnailUrl
            views
            videoUrl
            likeCount
            isViewed
        }
    }
`;

const VIDEOS_PER_PAGE = 12;

const UserInfo = ({ userId }) => {
    const theme = useTheme();
    const { data } = useQuery(GET_USER_PROFILE, {
        variables: { userId },
    });
    const navigate = useNavigate();
    const location = useLocation();

    const [followUser] = useMutation(FOLLOW_USER);
    const [unfollowUser] = useMutation(UNFOLLOW_USER);
    let user;

    const [localFollowerCount, setLocalFollowerCount] = useState(0);
    const [localIsFollowed, setLocalIsFollowed] = useState(false);
    const handleFollowUser = async () => {
        try {
            await followUser({
                variables: { followingId: user?.id },
            });
            setLocalIsFollowed(true);
            setLocalFollowerCount(prev => prev + 1);
        } catch (error) {
            console.error("Follow error", error);
        }
    };

    const handleUnfollowUser = async () => {
        try {
            await unfollowUser({
                variables: { followingId: user?.id },
            });
            setLocalIsFollowed(false);
            setLocalFollowerCount(prev => prev - 1);
        } catch (error) {
            console.error("Unfollow error", error);
        }
    };
    user = data?.getUser;
    useEffect(() => {
        if (user) {
            setLocalFollowerCount(user.followerCount);
            setLocalIsFollowed(user.isFollowed);
        }
    }, [data])

    // useEffect(() => {
    //     if (location.state) {
    //         console.log(location.state.isFollowed)
    //         if (location.state.isFollowed !== localIsFollowed) {
    //             if (location.state.isFollowed === true) {
    //                 setLocalFollowerCount(pre => pre + 1);
    //             }
    //             else {
    //                 setLocalFollowerCount(pre => pre - 1);
    //             }
    //             setLocalIsFollowed(location.state.isFollowed);
    //         }
    //     }
    // }, [navigate, location]);
    if (!user) return null;

    return (
        <Card sx={{ mb: 2, p: 3 }}>
            <Box sx={{ display: 'flex' }}>
                <Avatar src={user.profilePicture} sx={{ width: 120, height: 120, mr: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Typography variant="h4" component="h1" fontWeight={700} margin={0}>
                        {user.username}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {user.email}
                    </Typography>
                    <Button
                        variant={localIsFollowed ? 'outlined' : 'contained'}
                        sx={{
                            backgroundColor: localIsFollowed ? 'transparent' : theme.palette.primary.main,
                            color: localIsFollowed ? theme.palette.primary.main : theme.palette.primary.contrastText,
                            '&:hover': {
                                backgroundColor: localIsFollowed ? theme.palette.primary.light : theme.palette.primary.dark,
                            },
                        }}
                        onClick={localIsFollowed ? handleUnfollowUser : handleFollowUser}
                    >
                        {localIsFollowed ? 'Hủy theo dõi' : 'Theo dõi'}
                    </Button>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', mt: 2 }}>
                <Typography sx={{ mr: 2 }}>
                    {user.followingCount} Đang theo dõi
                </Typography>
                <Typography>
                    {localFollowerCount} Người theo dõi
                </Typography>
            </Box>
        </Card>
    );
}

const UserProfile = () => {
    const { userId } = useParams();
    const [page, setPage] = useState(1);
    const [videos, setVideos] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, error, data, fetchMore } = useQuery(GET_USER_VIDEO, {
        variables: { id: userId, page: 1, limit: VIDEOS_PER_PAGE },
        skip: videos.length > 0, // Skip the initial query if we have videos in state
    });

    useEffect(() => {
        // Try to load saved state when component mounts
        const savedState = sessionStorage.getItem(`userProfile_${userId}`);
        if (savedState) {
            const { videos: savedVideos, page: savedPage, hasMore: savedHasMore } = JSON.parse(savedState);
            setVideos(savedVideos);
            setPage(savedPage);
            setHasMore(savedHasMore);
        }
    }, [userId]);

    useEffect(() => {
        // Save state when component updates
        const state = { videos, page, hasMore };
        sessionStorage.setItem(`userProfile_${userId}`, JSON.stringify(state));
    }, [userId, videos, page, hasMore]);

    useEffect(() => {
        if (data?.getUserVideos) {
            setVideos(data.getUserVideos);
            setHasMore(data.getUserVideos.length === VIDEOS_PER_PAGE);
        }
    }, [data]);

    console.log("render")

    const loadMore = useCallback(debounce(() => {
        if (!hasMore || loading) return;

        fetchMore({
            variables: {
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
    }, 200), [hasMore, loading, page, videos]);

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



    if (loading && page === 1) return <CircularProgress />;
    if (error) return <Typography color="error">Error: {error.message}</Typography>;


    return (
        <Container maxWidth="lg">
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <UserInfo userId={userId} />
                <Grid container spacing={1}>
                    {videos.map((video) => (
                        <Grid item xs={4} sm={3} md={3} lg={2} key={video.id}>
                            <VideoPreview
                                videoUrl={video.videoUrl}
                                thumbnailUrl={video.thumbnailUrl}
                                views={video.views}
                                likes={video.likeCount}
                                isViewed={video.isViewed}
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
                {loading && page > 1 && <CircularProgress sx={{ mt: 2 }} />}
                {!hasMore && <Typography sx={{ mt: 2, textAlign: 'center' }}>No more videos to load</Typography>}
            </Box>
        </Container>
    );
};

export default UserProfile;
