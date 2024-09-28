import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import models from '../models/index.js';
import userService from '../services/userService.js';
import videoService from '../services/videoService.js';
import likeService from '../services/likeService.js';
import commentService from '../services/commentService.js';
import followService from '../services/followService.js';
import categoryService from '../services/categoryService.js';
import saveService from '../services/saveService.js';
import viewService from '../services/viewService.js';
import { subscribe } from 'graphql';
import pubsub from './pubsub.js';


const resolvers = {
    Upload: GraphQLUpload,
    Query: {
        getUser: async (_, { id }, { user }) => {
            console.log(id)
            return userService.getUser(id, user.id);
        },
        verifyToken: async (_, __, context) => {
            if (!context.user) {
                throw new Error('Token expired!');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return userService.getUser(context.user.id, context.user.id);
        },
        getUserVideos: async (_, { id, page, limit }, { user }) => {
            console.log(limit)
            return videoService.getUserVideos(id, page, limit);
        },
        getNextUserVideo: async (_, { currentVideoCreatedAt, userId }) => {
            const createdAt = new Date(currentVideoCreatedAt);
            return videoService.getNextUserVideo(createdAt, userId);
        },
        getVideo: async (_, { id }) => {
            return videoService.getVideo(id);
        },
        getRecommendedVideos: async (_, { limit }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to get recommended videos');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return videoService.getRecommendedVideos(context.user.id, limit);
        },
        getCategories: async (_, __, { user, tokenError }) => {
            if (tokenError) {
                throw new Error(tokenError);
            }
            if (!user) {
                throw new Error('Không được phép truy cập');
            }
            return categoryService.getCategories();
        },
        getVideoComments: async (_, { videoId, page, limit }, context) => {
            return commentService.getVideoComments(videoId, page, limit);
        }
    },
    Mutation: {
        registerUser: async (_, { username, email, password, avatarFile }) => {
            return userService.registerUser(username, email, password, avatarFile);
        },
        loginUser: async (_, { email, password }) => {
            return userService.loginUser(email, password);
        },
        uploadVideo: async (_, { title, videoFile, thumbnailFile, category, tags }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to upload a video');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return videoService.uploadVideo(context.user.id, title, videoFile, thumbnailFile, category, tags);
        },
        likeVideo: async (_, { targetId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to like a video');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return likeService.likeVideo(targetId, context.user.id);
        },
        unlikeVideo: async (_, { targetId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to like a video');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return likeService.unlikeVideo(targetId, context.user.id);
        },
        viewVideo: async (_, { videoId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to like a video');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return viewService.viewVideo(context.user.id, videoId);
        },
        likeComment: async (_, { targetId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to like comment');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return likeService.likeComment(context.user.id, targetId);
        },
        unlikeComment: async (_, { targetId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to unlike comment');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return likeService.unlikeComment(context.user.id, targetId);
        },
        addComment: async (_, { videoId, content, parentCommentId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to comment on video');
            }
            if (context.tokenError) {
                throw new Error(context.tokenError);
            }
            let newComment = await commentService.addComment(videoId, content, parentCommentId, context.user.id);

            // Ensure replies is included
            newComment = {
                ...newComment.toObject(),
                id: newComment._id,
                replies: [],
            };

            console.log(newComment);
            pubsub.publish('COMMENT_ADDED', {
                commentAdded: newComment,
                videoId
            });

            return newComment;
        },
        followUser: async (_, { followingId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to follow this user!');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return followService.followUser(context.user.id, followingId);
        },
        unfollowUser: async (_, { followingId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to unfollow this user!');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return followService.unfollowUser(context.user.id, followingId);
        },
        saveVideo: async (_, { videoId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to save this video!');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return saveService.saveVideo(context.user.id, videoId);
        },
        unsaveVideo: async (_, { videoId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to unsave this video!');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return saveService.unsaveVideo(context.user.id, videoId);
        },
    },
    User: {
        isFollowed: async (parent, _, context) => {
            if (!context.user) {
                return false;
            }
            const follower = await models.Follow.findOne({
                follower: context.user.id,
                following: parent._id
            });
            return !!follower;
        }
    },
    Video: {
        user: async (parent, _) => {
            return await models.User.findById(parent.user);
        },
        isViewed: async (parent, _, context) => {
            if (!context.user) {
                return false;
            }
            return videoService.isViewed(context.user.id, parent._id)
        },
        isLiked: async (parent, _, context) => {
            if (!context.user) {
                return false;
            }
            return videoService.isLiked(context.user.id, parent._id);
        },
        isSaved: async (parent, _, context) => {
            if (!context.user) {
                return false;
            }
            return videoService.isSaved(context.user.id, parent._id);
        },
        category: async (parent, _) => {
            return categoryService.getCategory(parent.category);
        },
        nextVideo: async (parent, _) => {
            return videoService.getNextUserVideo(parent.createdAt, parent.user._id);
        },
        prevVideo: async (parent, _) => {
            return videoService.getPrevUserVideo(parent.createdAt, parent.user._id);
        },
    },
    Comment: {
        replies: (parent, _) => {
            return commentService.getChildrenComments(parent._id);
        },
        user: async (parent, _) => {
            return userService.getUser(parent.userId);
        },
        parentComment: async (parent, _) => {
            return commentService.getComment(parent.parentCommentId);
        },
        isLiked: async (parent, _, context) => {
            return commentService.isLiked(context.user.id, parent._id);
        },
    },
    Subscription: {
        commentAdded: {
            subscribe: (_, { videoId }, context) => {
                return pubsub.asyncIterator('COMMENT_ADDED');
            },
        },
    },
};

export default resolvers;
