// src/components/auth/LoginForm.js
import React from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { Button, Typography, useTheme } from '@mui/material';
import StyledForm from "../styledComponents/StyledForm.js";
import StyledTextField from "../styledComponents/StyledTextField.js";

const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    loginUser(email: $email, password: $password) {
      token
      user {
        id
        username
        email
        profilePicture
      }
    }
  }
`;

const LoginForm = ({ onSuccess }) => {
  const theme = useTheme();
  const [loginUser, { loading, error }] = useMutation(LOGIN_USER);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      const { data } = await loginUser({
        variables: {
          email: formData.get('email'),
          password: formData.get('password'),
        },
      });
      onSuccess(data.loginUser);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <Typography variant="h4" align="center" gutterBottom>
        Login
      </Typography>
      <StyledTextField
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus
      />
      <StyledTextField
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        Sign In
      </Button>
      {error && (
        <Typography color="error" align="center">
          {error.message}
        </Typography>
      )}
    </StyledForm>
  );
};

export default LoginForm;
