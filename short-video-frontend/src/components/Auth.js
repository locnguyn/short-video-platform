import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';

// GraphQL mutations
const REGISTER_USER = gql`
  mutation RegisterUser($username: String!, $email: String!, $password: String!) {
    registerUser(username: $username, email: $email, password: $password) {
      token
      user {
        id
        username
        email
      }
    }
  }
`;

const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    loginUser(email: $email, password: $password) {
      token
      user {
        id
        username
        email
      }
    }
  }
`;const saveToken = (token) => {
    localStorage.setItem('authToken', token);
  };

  // Hàm để lấy token
  export const getToken = () => {
    return localStorage.getItem('authToken');
  };

  // Hàm để xóa token (sử dụng khi đăng xuất)
  const removeToken = () => {
    localStorage.removeItem('authToken');
  };

// Register Component
export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerUser, { data, loading, error }] = useMutation(REGISTER_USER);

  const handleSubmit = (e) => {
    e.preventDefault();
    registerUser({ variables: { username, email, password } });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (data) return <p>Registration successful! User ID: {data.registerUser.user.id}</p>;

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Register</button>
    </form>
  );
}

// Login Component
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginUser, { data, loading, error }] = useMutation(LOGIN_USER);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await loginUser({ variables: { email, password } });
    console.log(result);
    const token = result.data.loginUser.token;
    saveToken(token);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (data) return <p>Login successful! User: {data.loginUser.user.username}</p>;

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
