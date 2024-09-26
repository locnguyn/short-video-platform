import React from 'react';
import { Container, Grid, useMediaQuery, useTheme } from "@mui/material";
import { Outlet } from 'react-router-dom';

const HomeLayout = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Container maxWidth="xl" disableGutters={isSmallScreen}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3} lg={2}
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
                <Grid item xs={12} md={6} lg={8}
                    sx={{
                        height: 'calc(100vh - 64px)',
                        // overflow: 'auto'
                    }}
                >
                    <Outlet />
                </Grid>
                <Grid item md={3} lg={2}
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        height: 'calc(100vh - 64px)',
                        overflow: 'auto'
                    }}
                >
                    {/* Chat List Component */}
                    <div>
                        {/* Add your chat list here */}
                    </div>
                </Grid>
            </Grid>
        </Container>
    );
};

export default HomeLayout;
