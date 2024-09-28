import React, { useEffect, useReducer, useState } from 'react';
import { ApolloProvider, useQuery } from '@apollo/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import client from './configs/apolloClient';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Home';
import VideoUpload from './components/upload';
import VideoPlayer from './components/VideoDetails';
import { LoginPage, RegisterPage } from './components/Auth';
import { ToggleColorMode } from './contexts/themeProvider';
import UserProfile from './components/UserProfile';
import UserContext from './contexts/userContext';
import UserReducer from './reducers/UserReducer';
import VideoDetailPage from './pages/VideoDetail';
import HomeLayout from './layouts/HomeLayout';
import { VERIFY_TOKEN } from './GraphQLQueries/userQueries'
import { CircularProgress } from '@mui/material';

function useAuth() {
  const [user, userDispatcher] = useReducer(UserReducer, JSON.parse(localStorage.getItem("user")) || null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const { loading, error, data } = useQuery(VERIFY_TOKEN);

  const logout = () => {
    userDispatcher({
      type: "logout"
    });
    navigate('/login');
  }

  useEffect(() => {
    if (!loading) {
      if (error) {
        logout();
      } else if (data?.verifyToken) {
        userDispatcher({
          type: "login",
          payload: data.verifyToken
        });
      }
      setIsLoading(false);
    }
  }, [data, error, loading]);

  return { user, userDispatcher, logout, isLoading };
}

function AuthenticatedApp() {
  const { user, userDispatcher, logout, isLoading } = useAuth();

  if (isLoading) return <CircularProgress />;

  return (
    <UserContext.Provider value={{ user, userDispatcher, logout }}>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomeLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="upload" element={<VideoUpload />} />
          </Route>
          <Route path="/:userId/video/:id" element={<VideoDetailPage />} />
          <Route path="/:userId" element={<UserProfile />} />
        </Routes>
      </MainLayout>
    </UserContext.Provider>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <ToggleColorMode>
        <Router>
          <AuthenticatedApp />
        </Router>
      </ToggleColorMode>
    </ApolloProvider>
  )
}

export default App;
