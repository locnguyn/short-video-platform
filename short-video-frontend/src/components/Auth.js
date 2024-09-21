// src/pages/AuthPages.js
import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Box, Link, useTheme } from '@mui/material';
import LoginForm from '../components/forms/LoginForm';
import RegisterForm from '../components/forms/RegisterForm';
import { saveToken } from '../utils/tokenUtils';

export const LoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleLoginSuccess = (data) => {
    saveToken(data.token);
    console.log('Login successful:', data);
    navigate('/'); // Redirect to home page
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <LoginForm onSuccess={handleLoginSuccess} />
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Don't have an account?{' '}
          <Link component={RouterLink} to="/register" color="primary">
            Sign Up
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export const RegisterPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleRegisterSuccess = (data) => {
    // Handle registration success (e.g., save token to localStorage, update global state)
    console.log('Registration successful:', data);
    navigate('/'); // Redirect to home page
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <RegisterForm onSuccess={handleRegisterSuccess} />
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" color="primary">
            Sign In
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};
