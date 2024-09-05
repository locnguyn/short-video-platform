import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import client from './configs/apolloClient';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Home/Home';
import VideoUpload from './components/upload';
import VideoPlayer from './components/VideoDetails';
import { Login, Register } from './components/Auth';
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
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              {/* Add more routes as needed */}
            </Routes>
          </MainLayout>
        </Router>
      </ToggleColorMode>
    </ApolloProvider>
  );
}

export default App;
