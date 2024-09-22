import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Box, Typography, CircularProgress, Grid, Card, CardMedia, CardContent, Alert, Container, Avatar, Button, useTheme } from '@mui/material';
import { useParams } from 'react-router-dom';
import VideoPreview from './VideoPreview';

const GET_USER_PROFILE = gql`
  query GetUser($userId: ID!) {
    getUser(id: $userId) {
      id
      username
      email
      profilePicture
      followerCount
      followingCount
      videos {
        id
        thumbnailUrl
        views
        videoUrl
        likeCount
      }
    }
  }
`;

const UserProfile = () => {
    const { userId } = useParams();
    const theme = useTheme();
    const { loading, error, data } = useQuery(GET_USER_PROFILE, {
        variables: { userId },
    });

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <CircularProgress />
        </Box>
    );

    if (error) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh" flexDirection="column">
            <Alert severity="error" sx={{ mb: 2 }}>
                An error occurred while fetching the user profile.
            </Alert>
            <Typography variant="body1">Error details: {error.message}</Typography>
            {error.networkError && (
                <Typography variant="body2">Network error: {error.networkError.message}</Typography>
            )}
        </Box>
    );

    const { getUser: user } = data;

    console.log(user)

    return (
        <Container maxWidth="lg">
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <Card sx={{ mb: 2, p: 3}}>
                    <Box sx={{ display: 'flex' }}>
                        <Avatar
                            src={user.profilePicture}
                            sx={{
                                width: 120,
                                height: 120,
                                mr: 2
                            }}
                        />
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}>
                            <Typography variant="h4" component="h1" gutterBottom fontWeight={700} margin={0}>
                                {user.username}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {user.email}
                            </Typography>
                            <Button sx={{
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark,
                                },
                            }}>Theo dõi</Button>

                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', mt: 2 }}>
                        <Typography sx={{ mr: 2 }}>
                            {user.followingCount} Đang theo dõi
                        </Typography>
                        <Typography>
                            {user.followerCount} Người theo dõi
                        </Typography>
                    </Box>
                </Card>

                <Grid container spacing={1}>
                    {user.videos.map((video, i) => (<Grid item xs={4} sm={3} md={3} lg={2} key={i}>
                        <VideoPreview videoUrl={video.videoUrl} thumbnailUrl={video.thumbnailUrl} title={video.views} />
                    </Grid>))}
                </Grid>
            </Box></Container>
    );
};

export default UserProfile;
