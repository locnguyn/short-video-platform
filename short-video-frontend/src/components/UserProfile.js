import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import { Box, Typography, CircularProgress, Grid, Card, Container, Avatar, Button, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';
import VideoPreview from './VideoPreview';
import { debounce } from 'lodash';

const GET_USER_PROFILE = gql`
    query GetUser($userId: ID!) {
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
    query GetUserVideos($id: ID!, $page: Int!, $limit: Int!) {
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

const FOLLOW_USER = gql`
  mutation FollowUser($followingId: ID!) {
    followUser(followingId: $followingId)
  }
`;

const UNFOLLOW_USER = gql`
  mutation UnfollowUser($followingId: ID!) {
    unfollowUser(followingId: $followingId)
  }
`;

const VIDEOS_PER_PAGE = 12;

const UserInfo = ({ userId }) => {
    const theme = useTheme();
    const { data } = useQuery(GET_USER_PROFILE, {
        variables: { userId },
    });

    const [followUser] = useMutation(FOLLOW_USER);
    const [unfollowUser] = useMutation(UNFOLLOW_USER);

    const [localFollowerCount, setLocalFollowerCount] = useState(0);
    const [localIsFollowed, setLocalIsFollowed] = useState(false);
    const handleFollowUser = async () => {
        try {
            await followUser({
                variables: { followingId: userId },
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
                variables: { followingId: userId },
            });
            setLocalIsFollowed(false);
            setLocalFollowerCount(prev => prev - 1);
        } catch (error) {
            console.error("Unfollow error", error);
        }
    };
    const user = data?.getUser;
    if (localFollowerCount === 0 && user) {
        setLocalFollowerCount(user.followerCount);
        setLocalIsFollowed(user.isFollowed);
    }
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

    const { loading, error, data, fetchMore } = useQuery(GET_USER_VIDEO, {
        variables: { id: userId, page: 1, limit: VIDEOS_PER_PAGE },
    });

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
