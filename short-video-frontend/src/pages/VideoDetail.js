import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Avatar,
    Button,
    IconButton,
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
    Collapse,
    Divider,
    TextField
} from '@mui/material';
import {
    ThumbUp,
    ThumbUpOutlined,
    Bookmark,
    BookmarkBorder,
    ExpandMore,
    ExpandLess,
    Close
} from '@mui/icons-material';
import { Send } from 'lucide-react';

const GET_VIDEO_DETAILS = gql`
  query GetVideoDetails($id: ID!) {
    getVideo(id: $id) {
      id
      title
      videoUrl
      thumbnailUrl
      duration
      category {
        name
      }
      tags
      likeCount
      views
      commentsCount
      savesCount
      engagementRate
      createdAt
      isViewed
      isLiked
      isSaved
      user {
        id
        username
        profilePicture
      }
    }
  }
`;

const GET_VIDEO_COMMENTS = gql`
  query GetVideoComments($videoId: ID!, $page: Int!, $limit: Int!) {
    getVideoComments(videoId: $videoId, page: $page, limit: $limit) {
      id
      content
      user {
        id
        username
        profilePicture
      }
      level
      createdAt
      likeCount
      replies {
        id
        content
        user {
          id
          username
          profilePicture
        }
        level
        createdAt
        likeCount
      }
    }
  }
`;

const LIKE_VIDEO = gql`
  mutation LikeVideo($videoId: ID!) {
    likeVideo(videoId: $videoId)
  }
`;

const SAVE_VIDEO = gql`
  mutation SaveVideo($videoId: ID!) {
    saveVideo(videoId: $videoId)
  }
`;

const DEFAULT_ASPECT_RATIO = 9 / 16;

const VideoDetailPage = () => {
    const { id } = useParams();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [showComments, setShowComments] = useState(true);
    const [expandedComments, setExpandedComments] = useState({});
    const [videoSize, setVideoSize] = useState({ width: 1000, height: 1000 });
    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);

    const { data: videoData, loading: videoLoading, error: videoError } = useQuery(GET_VIDEO_DETAILS, {
        variables: { id },
    });


    const { data: commentsData, loading: commentsLoading, error: commentsError } = useQuery(GET_VIDEO_COMMENTS, {
        variables: { videoId: id, page: 1, limit: 10 },
    });
    console.log(commentsData)

    const [likeVideo] = useMutation(LIKE_VIDEO);
    const [saveVideo] = useMutation(SAVE_VIDEO);

    const updateVideoSize = () => {
        if (videoContainerRef.current) {
            const containerWidth = videoContainerRef.current.offsetWidth;
            const containerHeight = videoContainerRef.current.offsetHeight;

            let newWidth, newHeight;

            if (videoRef.current && videoRef.current.videoWidth && videoRef.current.videoHeight) {
                // Sử dụng kích thước thực của video nếu có
                const videoAspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
                newWidth = Math.min(videoRef.current.videoWidth, containerWidth);
                newHeight = newWidth / videoAspectRatio;
            } else {
                // Sử dụng tỷ lệ mặc định nếu chưa có kích thước thực
                newWidth = containerWidth;
                newHeight = containerWidth / DEFAULT_ASPECT_RATIO;
            }

            // Đảm bảo video không cao hơn container
            if (newHeight > containerHeight) {
                newHeight = containerHeight;
                newWidth = newHeight * (videoRef.current?.videoWidth / videoRef.current?.videoHeight || DEFAULT_ASPECT_RATIO);
            }

            setVideoSize({ width: newWidth, height: newHeight });
        }
    };

    useEffect(() => {
        updateVideoSize(); // Gọi ngay lập tức để set kích thước ban đầu
        window.addEventListener('resize', updateVideoSize);

        return () => {
            window.removeEventListener('resize', updateVideoSize);
        };
    }, []);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.addEventListener('loadedmetadata', updateVideoSize);

            return () => {
                if (videoRef.current) {
                    videoRef.current.removeEventListener('loadedmetadata', updateVideoSize);
                }
            };
        }
    }, [videoData]);

    if (videoLoading || commentsLoading) return <Typography>Loading...</Typography>;
    if (videoError || commentsError) return <Typography>Error loading data</Typography>;

    const video = videoData.getVideo;
    const comments = commentsData.getVideoComments;

    const handleLikeVideo = () => {
        likeVideo({ variables: { videoId: id } });
    };

    const handleSaveVideo = () => {
        saveVideo({ variables: { videoId: id } });
    };

    const toggleComments = () => {
        setShowComments(!showComments);
    };

    const toggleCommentExpansion = (commentId) => {
        setExpandedComments(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const renderComment = (comment, isReply = false) => (
        <Box key={comment.id} sx={{ ml: isReply ? 4 : 0, mt: 2 }}>
            <Box display="flex" alignItems="center">
                <Avatar src={comment.user.profilePicture} sx={{ width: 32, height: 32, mr: 1 }} />
                <Typography variant="subtitle2">{comment.user.username}</Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>{comment.content}</Typography>
            <Box display="flex" alignItems="center" mt={1}>
                <IconButton size="small">
                    <ThumbUpOutlined fontSize="small" />
                </IconButton>
                <Typography variant="caption" sx={{ ml: 1 }}>{comment.likeCount} likes</Typography>
                <Typography variant="caption" sx={{ ml: 2 }}>{new Date(comment.createdAt).toLocaleString()}</Typography>
            </Box>
            {!isReply && comment.replies.length > 0 && (
                <>
                    <Button
                        size="small"
                        onClick={() => toggleCommentExpansion(comment.id)}
                        startIcon={expandedComments[comment.id] ? <ExpandLess /> : <ExpandMore />}
                    >
                        {expandedComments[comment.id] ? 'Hide' : 'Show'} {comment.replies.length} replies
                    </Button>
                    <Collapse in={expandedComments[comment.id]}>
                        {comment.replies.map(reply => renderComment(reply, true))}
                    </Collapse>
                </>
            )}
        </Box>
    );
    console.log(videoSize)

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={0}>
                <Grid item xs={12} md={8}>
                    <Box
                        ref={videoContainerRef}
                        sx={{
                            position: 'relative',
                            width: '100%',
                            // paddingTop: '56.25%', // 16:9 aspect ratio
                            aspectRatio: 9 / 16,
                            overflow: 'hidden',
                            backgroundColor: '#000',
                            maxHeight: '93vh',
                        }}>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: `url(${video?.thumbnailUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'blur(20px)',
                                transform: 'scale(1.1)',
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <video
                                ref={videoRef}
                                src={video?.videoUrl}
                                poster={video?.thumbnailUrl}
                                controls
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: videoSize.width,
                                    height: videoSize.height,
                                }}
                            />
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{
                        mt: 2,
                        mr: 2,
                        ml: 2,
                        height: '97%',
                    }}>
                        <CardContent>
                            <Typography variant="h5" sx={{ mt: 2 }}>{video.title}</Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                <Box display="flex" alignItems="center">
                                    <Avatar src={video.user.profilePicture} sx={{ width: 40, height: 40, mr: 1 }} />
                                    <Typography variant="subtitle1">{video.user.username}</Typography>
                                </Box>
                                <Box>
                                    <IconButton onClick={handleLikeVideo}>
                                        {video.isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
                                    </IconButton>
                                    <Typography variant="body2" component="span">{video.likeCount}</Typography>
                                    <IconButton onClick={handleSaveVideo} sx={{ ml: 1 }}>
                                        {video.isSaved ? <Bookmark /> : <BookmarkBorder />}
                                    </IconButton>
                                </Box>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                {video.views} views • {new Date(video.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                Category: {video.category?.name} • Tags: {video.tags.join(', ')}
                            </Typography>
                            <Box sx={{ mt: 4, position: 'relative', display:'flex', flexDirection: 'column' }}>
                                <Typography variant="h6">Comments ({video.commentsCount})</Typography>
                                {isMobile && (
                                    <IconButton
                                        onClick={toggleComments}
                                        sx={{ position: 'absolute', top: 0, left: 0 }}
                                    >
                                        {showComments ? <Close /> : <ExpandMore />}
                                    </IconButton>
                                )}
                                <Collapse in={showComments || !isMobile} sx={{flex: 1}}>
                                    {commentsData?.getVideoComments.map(comment => renderComment(comment))}
                                    <Box>2</Box>
                                </Collapse>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
                                    <Divider sx={{ my: 2 }} />
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Thêm bình luận..."
                                    // value={commentInput}
                                    // onChange={(e) => setCommentInput(e.target.value)}
                                    // onKeyPress={(e) => {
                                    //     if (e.key === 'Enter') {
                                    //         handleCommentSubmit();
                                    //     }
                                    // }}
                                    />
                                    <IconButton >
                                        <Send />
                                    </IconButton>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

        </Box>
    );
};

export default VideoDetailPage;
