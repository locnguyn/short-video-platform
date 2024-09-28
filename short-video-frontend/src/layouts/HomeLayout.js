import React, { useState } from 'react';
import { Card, CardContent, Container, Grid, useMediaQuery, useTheme } from "@mui/material";
import { Outlet } from 'react-router-dom';
import CommentList from '../components/CommentList';
import CommentContext from '../contexts/commentContext'

const HomeLayout = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
    const [videoId, setVideoId] = useState(null);
    const [isShowComments, setIsShowComments] = useState(false);

    return (
        <CommentContext.Provider value={{ showCommentVideoId: setVideoId, setShowComments: setIsShowComments }}>
            <Container maxWidth="full" sx={{
                // mr: -3
            }} disableGutters={isSmallScreen}>
                <Grid container spacing={2}>
                    <Grid item xs={1} md={2} lg={2}
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            height: 'calc(100vh - 64px)',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Navigation Component */}
                        <nav>
                            {/* Add your navigation items here */}
                        </nav>
                    </Grid>
                    <Grid item xs={11} md={isShowComments ? 7 : 8}
                        sx={{
                            height: 'calc(100vh - 64px)',
                            // overflow: 'auto'
                        }}
                    >
                        <Outlet />
                    </Grid>
                    <Grid item xs={0} md={isShowComments ? 3 : 2}
                    >
                        {isShowComments && videoId && <CommentList videoId={videoId} showCommentVideoId={setVideoId} setShowComments={setIsShowComments} />}
                    </Grid>
                </Grid>
            </Container>
        </CommentContext.Provider>
    );
};

export default HomeLayout;
