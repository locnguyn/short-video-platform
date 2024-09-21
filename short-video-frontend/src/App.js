import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import client from './configs/apolloClient';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Home';
import VideoUpload from './components/upload';
import VideoPlayer from './components/VideoDetails';
import { LoginPage, RegisterPage } from './components/Auth';
import { ToggleColorMode } from './contexts/themeProvider';
import UserProfile from './components/UserProfile';

function App() {
  return (
    <ApolloProvider client={client}>
      <ToggleColorMode>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<VideoUpload />} />
              <Route path="/video/:id" element={<VideoPlayer />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/user/:userId" element={<UserProfile />} />
            </Routes>
          </MainLayout>
        </Router>
      </ToggleColorMode>
    </ApolloProvider>
  );
}

export default App;
