import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Box, Typography, CircularProgress, Grid, Card, CardMedia, CardContent, Alert } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { useParams } from 'react-router-dom';

const GET_USER_PROFILE = gql`
  query GetUser($userId: ID!) {
    getUser(id: $userId) {
      id
      username
      email
      videos {
        id
        title
        thumbnailUrl
        views
        likes
      }
    }
  }
`;

const UserProfile = () => {
    const {userId} = useParams();
    console.log(userId)
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

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Card sx={{ mb: 4, p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {user.username}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {user.email}
                </Typography>
            </Card>

            <Typography variant="h5" component="h2" gutterBottom>
                User Videos
            </Typography>

            <Grid container spacing={3}>
                {user.videos.map((video) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
                        <Card>
                            <CardMedia
                                component="img"
                                height="194"
                                image={video.thumbnailUrl || '/api/placeholder/1080/1920'}
                                alt={video.title}
                            />
                            <CardContent>
                                <Typography variant="h6" component="div" noWrap>
                                    {video.title}
                                </Typography>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                    <Box display="flex" alignItems="center">
                                        <VisibilityIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {video.views}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center">
                                        <ThumbUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {video.likes}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default UserProfile;
