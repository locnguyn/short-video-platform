import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
    Close,
    HeartBroken
} from '@mui/icons-material';
import { Heart, HeartIcon, MessageSquareMore, Play, Send, X } from 'lucide-react';
import { FOLLOW_USER, UNFOLLOW_USER } from '../GraphQLQueries/followQueries';
import moment from 'moment';
import 'moment/locale/vi';
import { SAVE_VIDEO, UNSAVE_VIDEO } from '../GraphQLQueries/saveQueries';
import { VIEW_VIDEO } from '../GraphQLQueries/viewQueries';
import { ADD_COMMENT } from '../GraphQLQueries/commentQueries';
moment.locale('vi');

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
        isFollowed
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
  mutation LikeVideo($targetId: ID!) {
    likeVideo(targetId: $targetId)
  }
`;

const UNLIKE_VIDEO = gql`
  mutation UnlikeVideo($targetId: ID!) {
    unlikeVideo(targetId: $targetId)
  }
`;

const DEFAULT_ASPECT_RATIO = 9 / 16;

const VideoDetailPage = ({ handleFollowUserParent = () => { }, handleUnfollowUserParent = () => { } }) => {
    const { id, userId } = useParams();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [showComments, setShowComments] = useState(true);
    const [expandedComments, setExpandedComments] = useState({});
    const [videoSize, setVideoSize] = useState({ width: 500, height: 1000 });
    const [localLikeCount, setLocalLikeCount] = useState(0);
    const [localSavesCount, setLocalSavesCount] = useState(0);
    const [localCommentsCount, setLocalCommentsCount] = useState(0);
    const [localIsLiked, setLocalIsLiked] = useState(false);
    const [localIsFollowed, setLocalIsFollowed] = useState(false);
    const [localIsSaved, setLocalIsSaved] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();

    const { data: videoData, loading: videoLoading, error: videoError } = useQuery(GET_VIDEO_DETAILS, {
        variables: { id },
    });


    const { data: commentsData, loading: commentsLoading, error: commentsError } = useQuery(GET_VIDEO_COMMENTS, {
        variables: { videoId: id, page: 1, limit: 10 },
    });

    const [likeVideo] = useMutation(LIKE_VIDEO);
    const [unlikeVideo] = useMutation(UNLIKE_VIDEO);
    const [saveVideo] = useMutation(SAVE_VIDEO);
    const [unsaveVideo] = useMutation(UNSAVE_VIDEO);
    const [followUser] = useMutation(FOLLOW_USER);
    const [unfollowUser] = useMutation(UNFOLLOW_USER);
    const [viewVideo] = useMutation(VIEW_VIDEO);
    const [addComment] = useMutation(ADD_COMMENT, {
        update(cache, { data: { addComment } }) {
            const existingComments = cache.readQuery({
                query: GET_VIDEO_COMMENTS,
                variables: { videoId: id, page: 1, limit: 10 },
            });

            if (existingComments) {
                const updatedComments = replyingTo
                    ? existingComments.getVideoComments.map(comment =>
                        comment.id === replyingTo
                            ? { ...comment, replies: [...comment.replies, addComment] }
                            : comment
                    )
                    : [addComment, ...existingComments.getVideoComments];

                cache.writeQuery({
                    query: GET_VIDEO_COMMENTS,
                    variables: { videoId: id, page: 1, limit: 10 },
                    data: { getVideoComments: updatedComments },
                });
            }
        },
    });
    const [localViews, setLocalViews] = useState(0);
    const [showLikeAnimation, setShowLikeAnimation] = useState(false);
    const doubleClickTimeoutRef = useRef(null);
    const timeWatchedRef = useRef(0);
    const lastUpdateTimeRef = useRef(0);
    const viewCountedRef = useRef(false);

    const handleAddComment = async () => {
        if (commentContent.trim() === '') return;

        try {
            await addComment({
                variables: {
                    videoId: id,
                    content: commentContent,
                    parentCommentId: replyingTo,
                },
            });
            setCommentContent('');
            setReplyingTo(null);
            setLocalCommentsCount(prevCount => prevCount + 1);
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const handleReply = (commentId) => {
        console.log(commentsData?.getVideoComments)
        console.log(videoData?.getVideo)
        setReplyingTo(commentId);
    };

    const handleVideoClick = (e) => {
        e.preventDefault();
        if (doubleClickTimeoutRef.current === null) {
            doubleClickTimeoutRef.current = setTimeout(() => {
                doubleClickTimeoutRef.current = null;
                if (videoRef.current.paused) {
                    videoRef.current.play();
                } else {
                    videoRef.current.pause();
                }
            }, 300);
        } else {
            clearTimeout(doubleClickTimeoutRef.current);
            doubleClickTimeoutRef.current = null;
            handleLikeVideo();
            setShowLikeAnimation(true);
            setTimeout(() => setShowLikeAnimation(false), 1000);
        }
    };


    const resetViewState = () => {
        timeWatchedRef.current = 0;
        lastUpdateTimeRef.current = 0;
        viewCountedRef.current = false;
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const duration = videoRef.current.duration;

            // Tính toán thời gian đã xem
            const timeElapsed = currentTime - lastUpdateTimeRef.current;
            if (timeElapsed > 0 && timeElapsed < 1) { // Chỉ cộng dồn nếu thời gian hợp lý (tránh tua)
                timeWatchedRef.current += timeElapsed;
            }
            lastUpdateTimeRef.current = currentTime;

            // Kiểm tra điều kiện để tính lượt xem
            if (!viewCountedRef.current && (timeWatchedRef.current >= duration / 2 || timeWatchedRef.current >= 90)) {
                handleVideoView();
                viewCountedRef.current = true;
            }

            // Reset trạng thái nếu video gần kết thúc
            if (currentTime >= duration - 1) {
                resetViewState();
            }
        }
    };

    const handleSeeked = () => {
        // Reset thời gian xem khi người dùng tua video
        lastUpdateTimeRef.current = videoRef.current.currentTime;
    };

    const handleEnded = () => {
        // Reset trạng thái khi video kết thúc
        resetViewState();
    };

    const handleVideoView = async () => {
        try {
            await viewVideo({ variables: { videoId: id } });
            setLocalViews(prevViews => prevViews + 1);
        } catch (error) {
            console.error("Error viewing video:", error);
        }
    };


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

    let video;
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.addEventListener('loadedmetadata', updateVideoSize);

            return () => {
                if (videoRef.current) {
                    videoRef.current.removeEventListener('loadedmetadata', updateVideoSize);
                }
            };
        }
    }, [videoData, navigate]);

    useEffect(() => {
        video = videoData?.getVideo;
        if (video && localLikeCount === 0) {
            setLocalViews(video.views);
            setLocalIsLiked(video.isLiked);
            setLocalIsFollowed(video.user.isFollowed);
            setLocalIsSaved(video.isSaved);
            setLocalCommentsCount(video.commentsCount);
            setLocalSavesCount(video.savesCount);
            setLocalLikeCount(video.likeCount);
            console.log(video)
        }
    }, [videoData, navigate]);


    if (videoLoading || commentsLoading) return <Typography>Loading...</Typography>;
    if (videoError || commentsError) return <Typography>Error loading data</Typography>;

    video = videoData?.getVideo;

    const handleFollowUser = async () => {
        try {
            await followUser({
                variables: { followingId: video.user.id },
            });
            setLocalIsFollowed(true);
            handleFollowUserParent();
        } catch (error) {
            console.error("Follow error", error);
        }
    };

    const handleUnfollowUser = async () => {
        try {
            await unfollowUser({
                variables: { followingId: video.user.id },
            });
            setLocalIsFollowed(false);
            handleUnfollowUserParent();
        } catch (error) {
            console.error("Unfollow error", error);
        }
    };
    const handleLikeVideo = () => {
        if (!localIsLiked) {
            setLocalIsLiked(true);
            setLocalLikeCount(pre => pre + 1)
            likeVideo({ variables: { targetId: id } });
        }
    };

    const handleUnlikeVideo = () => {
        setLocalIsLiked(false);
        setLocalLikeCount(pre => pre - 1)
        unlikeVideo({ variables: { targetId: id } });
    }


    const handleSaveVideo = () => {
        setLocalIsSaved(true);
        setLocalSavesCount(pre => pre + 1)
        saveVideo({ variables: { videoId: id } });
    };

    const handleUnsaveVideo = () => {
        setLocalIsSaved(false);
        setLocalSavesCount(pre => pre - 1)
        unsaveVideo({ variables: { videoId: id } });
    }

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
                <IconButton size="small" onClick={() => { }}>
                    <ThumbUpOutlined fontSize="small" />
                </IconButton>
                <Typography variant="caption" sx={{ ml: 1 }}>{comment.likeCount} likes</Typography>
                <Typography variant="caption" sx={{ ml: 2 }}>{moment(comment.createdAt).fromNow()}</Typography>
                {!isReply && (
                    <Button size="small" onClick={() => handleReply(comment.id)} sx={{ ml: 2 }}>
                        Reply
                    </Button>
                )}
            </Box>
            {!isReply && comment.replies && comment.replies.length > 0 && (
                <>
                    <Button
                        size="small"
                        onClick={() => toggleCommentExpansion(comment.id)}
                        startIcon={expandedComments[comment.id] ? <ExpandLess /> : <ExpandMore />}
                        sx={{ mt: 1 }}
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

    const handleBackToHome = () => {
        navigate(location.state.prevUrl, {
            state: {
                isFollowed: localIsFollowed
            }
        });
    }

    const handleVideoDoubleClick = (event) => {
        // Ngăn chặn hành vi mặc định
        event.preventDefault();

        // handleLikeVideo();
        // setShowLikeAnimation(true);
        // setTimeout(() => setShowLikeAnimation(false), 1000);
    };


    return (
        <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={0}>
                <Grid item xs={12} md={8} sx={{
                    padding: 2
                }}>
                    <Box
                        ref={videoContainerRef}
                        sx={{
                            position: 'relative',
                            width: '100%',
                            // paddingTop: '56.25%', // 16:9 aspect ratio
                            aspectRatio: 9 / 16,
                            overflow: 'hidden',
                            backgroundColor: '#000',
                            maxHeight: '90vh',
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}><Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: `url(${video.thumbnailUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backdropFilter: 'blur(45px)',
                                    transform: 'scale(1.1)',
                                },
                            }}
                        />
                        <IconButton
                            sx={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                zIndex: 10
                            }}
                            onClick={handleBackToHome}
                        >
                            <X />
                        </IconButton>
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
                                onTimeUpdate={handleTimeUpdate}
                                onSeeked={handleSeeked}
                                onEnded={handleEnded}
                                onClick={handleVideoClick}
                                onDoubleClick={handleVideoDoubleClick}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: videoSize.width,
                                    height: videoSize.height,
                                }}
                            />
                            {showLikeAnimation && (
                                <Heart
                                    size={100}
                                    color="red"
                                    fill="red"
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        opacity: 0,
                                        animation: 'likeAnimation 1s ease-out',
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4} sx={{
                    padding: 2
                }}>
                    <Card sx={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {/* User info and follow button */}
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box display="flex" alignItems="center">
                                    <Avatar src={video.user.profilePicture} sx={{ width: 40, height: 40, mr: 1 }} />
                                    <Typography variant="subtitle1">{video.user.username}</Typography>
                                </Box>
                                <Button
                                    variant={localIsFollowed ? 'outlined' : 'contained'}
                                    onClick={localIsFollowed ? handleUnfollowUser : handleFollowUser}
                                >
                                    {localIsFollowed ? 'Hủy theo dõi' : 'Theo dõi'}
                                </Button>
                            </Box>

                            {/* Video title */}
                            <Typography variant="h6" sx={{ mb: 2 }}>{video.title}</Typography>

                            <Divider sx={{ mb: 2 }} />

                            {/* Like, comment, save buttons */}
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box>
                                    <IconButton onClick={localIsLiked ? handleUnlikeVideo : handleLikeVideo}>
                                        <Heart fill={localIsLiked ? 'red' : 'none'} color={localIsLiked ? 'red' : 'currentColor'} />
                                    </IconButton>
                                    <Typography variant="body2" component="span" sx={{
                                        ml: -0.5
                                    }}>{localLikeCount}</Typography>
                                    <IconButton sx={{ ml: 1 }}>
                                        <Play />
                                    </IconButton>
                                    <Typography variant="body2" component="span" sx={{
                                        ml: -0.5
                                    }}>{localViews}</Typography>
                                    <IconButton sx={{ ml: 1 }}>
                                        <MessageSquareMore />
                                    </IconButton>
                                    <Typography variant="body2" component="span" sx={{
                                        ml: -0.5
                                    }}>{localCommentsCount}</Typography>
                                    <IconButton onClick={localIsSaved ? handleUnsaveVideo : handleSaveVideo} sx={{ ml: 1 }}>
                                        {localIsSaved ? <Bookmark /> : <BookmarkBorder />}
                                    </IconButton>
                                    <Typography variant="body2" component="span" sx={{
                                        ml: -0.5
                                    }}>{localSavesCount}</Typography>
                                </Box>
                                <Typography variant="subtitle2">Đăng {moment(video.createdAt).fromNow()}</Typography>
                            </Box>

                            {/* Comments section */}
                            <Typography variant="h6" sx={{ mb: 2 }}>Bình luận ({localCommentsCount})</Typography>
                            <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                                {commentsData?.getVideoComments.map(comment => renderComment(comment))}
                            </Box>
                        </CardContent>

                        {/* Fixed comment input at the bottom */}
                        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                                    size="small"
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddComment();
                                        }
                                    }}
                                />
                                <IconButton sx={{ ml: 1 }} onClick={handleAddComment}>
                                    <Send />
                                </IconButton>
                                {replyingTo && (
                                    <IconButton sx={{ ml: 1 }} onClick={() => setReplyingTo(null)}>
                                        <Close />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                    </Card>
                </Grid>
            </Grid>

        </Box>
    );
};

export default VideoDetailPage;
