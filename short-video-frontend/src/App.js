import React, { useReducer } from 'react';
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
import UserContext from './contexts/userContext';
import UserReducer from './reducers/UserReducer';
import VideoDetailPage from './pages/VideoDetail';

function App() {
  const [user, userDispatcher] = useReducer(UserReducer, JSON.parse(localStorage.getItem("user")) || null);
  const logout = () => {
    userDispatcher({
      type: "logout"
    });
  }
  return (
    <ApolloProvider client={client}>
      <ToggleColorMode>
        <UserContext.Provider value={{user, userDispatcher, logout}}>
          <Router>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/upload" element={<VideoUpload />} />
                <Route path="/:userId/video/:id" element={<VideoDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/:userId" element={<UserProfile />} />
              </Routes>
            </MainLayout>
          </Router>
        </UserContext.Provider>
      </ToggleColorMode>
    </ApolloProvider>
  );
}

export default App;
