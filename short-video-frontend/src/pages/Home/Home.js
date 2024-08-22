import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import ShortVideoComponent from '../../components/VideoDetails';
import VideoPlayer from '../../components/VideoPlayer';

const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoStates, setVideoStates] = useState({});
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    const newVideos = await fetchVideos(page);
    setVideos(prevVideos => [...prevVideos, ...newVideos]);
    setPage(prevPage => prevPage + 1);
    setLoading(false);
  };

  const fetchVideos = async (page) => {
    // Giả lập API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { id: page * 3 - 2, title: `Video ${page * 3 - 2}`, views: Math.floor(Math.random() * 1000000), thumbnail: `https://picsum.photos/id/${page * 3 - 2}/1080/1920`, videoUrl: "https://s3.ap-southeast-1.amazonaws.com/locshortvideo.com/9a6ab366-bee3-492f-8ea8-273a1eee9450-Download%20%282%29.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIASU566UIPCGQZBM3T%2F20240822%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20240822T180116Z&X-Amz-Expires=3600&X-Amz-Signature=343bb1df6b5f3ca83f46812c6d1932676aa970a958fa17b066416513368ff527&X-Amz-SignedHeaders=host&x-id=GetObject" },
          { id: page * 3 - 1, title: `Video ${page * 3 - 1}`, views: Math.floor(Math.random() * 1000000), thumbnail: `https://picsum.photos/id/${page * 3 - 1}/1080/1920`, videoUrl: "https://s3.ap-southeast-1.amazonaws.com/locshortvideo.com/9a6ab366-bee3-492f-8ea8-273a1eee9450-Download%20%282%29.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIASU566UIPCGQZBM3T%2F20240822%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20240822T180116Z&X-Amz-Expires=3600&X-Amz-Signature=343bb1df6b5f3ca83f46812c6d1932676aa970a958fa17b066416513368ff527&X-Amz-SignedHeaders=host&x-id=GetObject"  },
          { id: page * 3, title: `Video ${page * 3}`, views: Math.floor(Math.random() * 1000000), thumbnail: `https://picsum.photos/id/${page * 3}/1080/1920`, videoUrl: "https://s3.ap-southeast-1.amazonaws.com/locshortvideo.com/9a6ab366-bee3-492f-8ea8-273a1eee9450-Download%20%282%29.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIASU566UIPCGQZBM3T%2F20240822%2Fap-southeast-1%2Fs3%2Faws4_request&X-Amz-Date=20240822T180116Z&X-Amz-Expires=3600&X-Amz-Signature=343bb1df6b5f3ca83f46812c6d1932676aa970a958fa17b066416513368ff527&X-Amz-SignedHeaders=host&x-id=GetObject"  },
        ]);
      }, 1000);
    });
  };

  useEffect(() => {
    if (!selectedVideo && containerRef.current) {
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [selectedVideo, scrollPosition]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
          loadVideos();
        }
      }
    };

    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleVideoClick = (video, videoRef) => {
    if (containerRef.current) {
      setScrollPosition(containerRef.current.scrollTop);
    }
    setVideoStates(prevStates => ({
      ...prevStates,
      [video.id]: {
        currentTime: videoRef.current.currentTime || 0,
        currentVolume: videoRef.current.currentVolume || 0.5
      }
    }));
    setSelectedVideo(video);
  };

  const handleBackToHome = (video) => {
    setVideoStates(prevStates => ({
      ...prevStates,
      [video.id]: {
        currentTime: video.currentTime || 0,
        currentVolume: video.currentVolume || 0.5
      }
    }));
    setSelectedVideo(null);
  };

  if (selectedVideo) {
    console.log(videoStates)
    return (
      <ShortVideoComponent
        video={selectedVideo}
        onClose={handleBackToHome}
        initialTime={videoStates[selectedVideo.id]?.currentTime || 0}
        initialVolume={videoStates[selectedVideo.id]?.currentVolume || 0.5}
      />
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        height: 'calc(100vh - 64px)', // Assuming AppBar height is 64px
        scrollSnapType: 'y',
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '0.4em'
        },
        '&::-webkit-scrollbar-track': {
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
          webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,.1)',
          outline: '1px solid slategrey'
        }
      }}
    >
      {videos.map((video) => (
        <Box
          key={video.id}
          sx={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            scrollSnapAlign: 'start',
            mb: 2  // Add some margin between videos
          }}
        >
          <VideoPlayer
            video={video}
            onClick={handleVideoClick}
            videoStates={videoStates[video.id] || {}}
          />
        </Box>
      ))}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default HomePage;
