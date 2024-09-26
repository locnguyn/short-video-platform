import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
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
    Divider,
    TextField,
    CircularProgress,
    debounce
} from '@mui/material';
import {
    Bookmark,
    BookmarkBorder,
    Close,
} from '@mui/icons-material';
import { ChevronDown, ChevronUp, Heart, MessageSquareMore, Play, Send, Volume2, VolumeX, X } from 'lucide-react';
import { FOLLOW_USER, UNFOLLOW_USER } from '../GraphQLQueries/followQueries';
import moment from 'moment';
import 'moment/locale/vi';
import { SAVE_VIDEO, UNSAVE_VIDEO } from '../GraphQLQueries/saveQueries';
import { VIEW_VIDEO } from '../GraphQLQueries/viewQueries';
import { ADD_COMMENT, COMMENT_ADDED_SUBSCRIPTION, GET_VIDEO_COMMENTS } from '../GraphQLQueries/commentQueries';
import UserContext from '../contexts/userContext';
import { GET_VIDEO_DETAILS } from '../GraphQLQueries/videoQueries';
import { LIKE_VIDEO, UNLIKE_VIDEO } from '../GraphQLQueries/likeQueries';
import Comment from '../components/Comment';
moment.locale('vi');

const DEFAULT_ASPECT_RATIO = 9 / 16;

const VideoDetailPage = ({ handleFollowUserParent = () => { }, handleUnfollowUserParent = () => { } }) => {
    const { id, userId } = useParams();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [showComments, setShowComments] = useState(true);
    const [expandedComments, setExpandedComments] = useState({});
    const [videoSize, setVideoSize] = useState({ width: 3000, height: 3000 });
    const [localLikeCount, setLocalLikeCount] = useState(0);
    const [localSavesCount, setLocalSavesCount] = useState(0);
    const [localCommentsCount, setLocalCommentsCount] = useState(0);
    const [localIsLiked, setLocalIsLiked] = useState(false);
    const [localIsFollowed, setLocalIsFollowed] = useState(false);
    const [localIsSaved, setLocalIsSaved] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [comments, setComments] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const commentsContainerRef = useRef(null);
    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);
    const touchStartY = useRef(null);
    const lastScrollTime = useRef(0);

    const { user } = useContext(UserContext);

    const navigate = useNavigate();
    const location = useLocation();

    const { data: videoData, loading: videoLoading, error: videoError } = useQuery(GET_VIDEO_DETAILS, {
        variables: { id },
    });

    const { data: commentsData, loading: commentsLoading, error: commentsError, fetchMore } = useQuery(GET_VIDEO_COMMENTS, {
        variables: { videoId: id, page: 1, limit: 10 },
    });

    const { data: subscriptionData } = useSubscription(COMMENT_ADDED_SUBSCRIPTION, {
        variables: { videoId: id },
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
                const newComment = {
                    ...addComment,
                    replies: addComment.replies || [],
                };

                const updatedComments = replyingTo
                    ? existingComments.getVideoComments.map(comment =>
                        comment.id === replyingTo
                            ? {
                                ...comment,
                                replies: [...(comment.replies || []), newComment]
                            }
                            : comment
                    )
                    : [newComment, ...existingComments.getVideoComments];

                const commentsWithReplies = updatedComments.map(comment => ({
                    ...comment,
                    replies: comment.replies || [],
                }));

                cache.writeQuery({
                    query: GET_VIDEO_COMMENTS,
                    variables: { videoId: id, page: 1, limit: 10 },
                    data: { getVideoComments: commentsWithReplies },
                });
            }
        },
    });
    const [localViews, setLocalViews] = useState(0);
    const [showLikeAnimation, setShowLikeAnimation] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const doubleClickTimeoutRef = useRef(null);
    const timeWatchedRef = useRef(0);
    const lastUpdateTimeRef = useRef(0);
    const viewCountedRef = useRef(false);

    const attemptAutoplay = () => {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.warn("Autoplay was prevented:", error);
                setIsPlaying(false);
            });
        }
    };

    useEffect(() => {
        if (isVideoLoaded && isVisible) {
            attemptAutoplay();
        } else if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isVideoLoaded, isVisible]);

    const handleVideoLoaded = () => {
        setIsVideoLoaded(true);
        if (isVisible) {
            attemptAutoplay();
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
          ([entry]) => {
            setIsVisible(entry.isIntersecting);
          },
          { threshold: 0.6 }
        );

        return () => {
          if (videoRef.current) {
            observer.unobserve(videoRef.current);
          }
        };
      }, []);

    useEffect(() => {
        if (subscriptionData && subscriptionData.commentAdded) {
            const newComment = subscriptionData.commentAdded;
            if (newComment.user.username !== user.username) {
                setComments(prevComments => {
                    if (newComment.level === 0) {
                        return [newComment, ...prevComments];
                    } else {
                        return prevComments.map(comment => {
                            if (comment.id === newComment.parentComment.id) {
                                return {
                                    ...comment,
                                    replies: [
                                        ...comment.replies,
                                        newComment
                                    ]
                                };
                            }
                            return comment;
                        });
                    }
                });
                setLocalCommentsCount(prevCount => prevCount + 1);
            }
        }
    }, [subscriptionData]);

    const loadMoreComments = useCallback(debounce(() => {
        if (!hasMore || commentsLoading) return;

        fetchMore({
            variables: {
                videoId: id,
                page: page + 1,
                limit: 10
            },
        }).then((fetchMoreResult) => {
            const newComments = fetchMoreResult.data.getVideoComments;
            if (newComments.length > 0) {
                console.log(newComments)
                setComments(pre => [...pre, ...newComments]);
                setPage(page + 1);
                setHasMore(newComments.length === 10);
            } else {
                setHasMore(false);
            }
        });
    }, 200), [fetchMore, hasMore, commentsLoading, id, page]);

    useEffect(() => {
        if (commentsData?.getVideoComments) {
            setComments(commentsData.getVideoComments);
            setHasMore(commentsData.getVideoComments.length === 10);
        }
    }, [commentsData])

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

    const handleScroll = useCallback(() => {
        if (commentsContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = commentsContainerRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 5) {
                loadMoreComments();
            }
        }
    }, [loadMoreComments]);
    useEffect(() => {
        const currentRef = commentsContainerRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (currentRef) {
                currentRef.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll]);

    const handleReply = (commentId) => {
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
            const timeElapsed = currentTime - lastUpdateTimeRef.current;
            if (timeElapsed > 0 && timeElapsed < 1) {
                timeWatchedRef.current += timeElapsed;
            }
            lastUpdateTimeRef.current = currentTime;

            if (!viewCountedRef.current && (timeWatchedRef.current >= duration / 2 || timeWatchedRef.current >= 90)) {
                handleVideoView();
                viewCountedRef.current = true;
            }

            if (currentTime >= duration - 1) {
                resetViewState();
            }
        }
    };

    const handleSeeked = () => {
        lastUpdateTimeRef.current = videoRef.current.currentTime;
    };

    const handleEnded = () => {
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
                const videoAspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
                newWidth = Math.min(videoRef.current.videoWidth, containerWidth);
                newHeight = newWidth / videoAspectRatio;
            } else {
                newWidth = containerWidth;
                newHeight = containerWidth / DEFAULT_ASPECT_RATIO;
            }

            if (newHeight > containerHeight) {
                newHeight = containerHeight;
                newWidth = newHeight * (videoRef.current?.videoWidth / videoRef.current?.videoHeight || DEFAULT_ASPECT_RATIO);
            }

            setVideoSize({ width: newWidth, height: newHeight });
        }
    };

    useEffect(() => {
        updateVideoSize();
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
        if (video) {

            setLocalViews(video.views);
            setLocalIsLiked(video.isLiked);
            setLocalIsFollowed(video.user.isFollowed);
            setLocalIsSaved(video.isSaved);
            setLocalCommentsCount(video.commentsCount);
            setLocalSavesCount(video.savesCount);
            setLocalLikeCount(video.likeCount);
        }
        // if (video && localLikeCount === 0) {
        //     console.log(video)
        // }
    }, [videoData, navigate, id]);


    const toggleMute = () => {
        setIsMuted(!isMuted);
    };
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.log("Autoplay was prevented:", error);
            });
        }
    }, [videoData]);
    const handleUpClick = () => {
        console.log(video?.prevVideo?.id)
        if (video?.prevVideo?.id)
            navigate(`/${userId}/video/${video?.prevVideo?.id}`);
    };

    const handleDownClick = () => {
        console.log(video?.nextVideo?.id)
        if (video?.nextVideo?.id)
            navigate(`/${userId}/video/${video?.nextVideo?.id}`);
    };



    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (touchStartY.current === null) return;

        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY.current - touchEndY;

        if (Math.abs(diff) > 50) { // Threshold để xác định là thao tác vuốt
            if (diff > 0) {
                handleDownClick();
            } else {
                handleUpClick();
            }
        }

        touchStartY.current = null;
    };

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleUpClick();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleDownClick();
        }
    }, [videoData]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const handleScrollVideo = useCallback((event) => {
        event.preventDefault();
        const now = new Date().getTime();
        const timeSinceLastScroll = now - lastScrollTime.current;

        if (timeSinceLastScroll > 500) { // Prevent rapid firing
            lastScrollTime.current = now;

            if (event.deltaY < 0) {
                handleUpClick();
            } else if (event.deltaY > 0) {
                handleDownClick();
            }
        }
    }, [videoData]);

    useEffect(() => {
        const container = videoContainerRef.current;
        if (container) {
            container.addEventListener('wheel', handleScrollVideo, { passive: false });
        }
        return () => {
            if (container) {
                container.removeEventListener('wheel', handleScrollVideo);
            }
        };
    }, [handleScrollVideo]);
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
        if (localIsLiked) {
            setLocalIsLiked(false);
            setLocalLikeCount(pre => pre - 1)
            unlikeVideo({ variables: { targetId: id } });
        }
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

    const handleBackToHome = () => {
        navigate(location.state?.prevUrl || `/${userId}` || "/");
    }

    const handleVideoDoubleClick = (event) => {
        event.preventDefault();
    };


    return (
        <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={0}>
                <Grid item xs={12} md={8} sx={{
                    padding: 2
                }}>
                    <Box
                        ref={videoContainerRef}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        sx={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: 9 / 16,
                            overflow: 'hidden',
                            backgroundColor: '#000',
                            maxHeight: '90vh',
                            borderRadius: '12px',
                        }}
                    >
                        <Box
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
                                onTimeUpdate={handleTimeUpdate}
                                onSeeked={handleSeeked}
                                onEnded={handleEnded}
                                onClick={handleVideoClick}
                                onDoubleClick={handleVideoDoubleClick}
                                onLoadedData={handleVideoLoaded}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: videoSize.width,
                                    height: videoSize.height,
                                }}
                                loop
                                playsInline
                                muted={isMuted}
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
                        <Box
                            sx={{
                                position: 'absolute',
                                right: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                zIndex: 10,
                            }}
                        >
                            <IconButton
                                onClick={handleUpClick}
                                disabled={!video?.prevVideo}
                                sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                                }}
                            >
                                <ChevronUp />
                            </IconButton>
                            <IconButton
                                onClick={handleDownClick}
                                disabled={!video?.nextVideo}
                                sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                                }}
                            >
                                <ChevronDown />
                            </IconButton>
                        </Box>
                        <IconButton
                            onClick={toggleMute}
                            sx={{
                                position: 'absolute',
                                bottom: 10,
                                right: 10,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                                zIndex: 10,
                            }}
                        >
                            {isMuted ? <VolumeX /> : <Volume2 />}
                        </IconButton>
                    </Box>
                </Grid>
                <Grid item xs={12} md={4} sx={{
                    padding: 2,
                    display: { xs: 'none', sm: 'block' }
                }}>
                    <Card sx={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

                            <Typography variant="h6" sx={{ mb: 2 }}>{video.title}</Typography>

                            <Divider sx={{ mb: 2 }} />
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
                            <Typography variant="h6" sx={{ mb: 2 }}>Bình luận ({localCommentsCount})</Typography>
                            <Box
                                ref={commentsContainerRef}
                                sx={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    mb: 2,
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
                                {comments.map(comment => <Comment
                                    key={comment.id}
                                    comment={comment}
                                    handleReply={handleReply}
                                    toggleCommentExpansion={toggleCommentExpansion}
                                    expandedComments={expandedComments}
                                />)}
                                {commentsLoading && (
                                    <Box display="flex" justifyContent="center" my={2}>
                                        <CircularProgress size={24} />
                                    </Box>
                                )}
                                {!hasMore && (
                                    <Typography variant="body2" textAlign="center" my={2}>
                                        No more comments to load
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
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
