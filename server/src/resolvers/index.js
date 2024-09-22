import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import models from '../models/index.js';
import userService from '../services/userService.js';
import videoService from '../services/videoService.js';
import likeService from '../services/likeService.js';
import commentService from '../services/commentService.js';
import followService from '../services/followService.js';
import categoryService from '../services/categoryService.js';


const resolvers = {
    Upload: GraphQLUpload,
    Query: {
        getUser: async (_, { id }, { user }) => {
            console.log(id)
            return userService.getUser(id, user.id);
        },
        getVideo: async (_, { id }) => {
            return videoService.getVideo(id);
        },
        getRecommendedVideos: async (_, { userId }) => {
            return videoService.getRecommendedVideos(userId);
        },
        getCategories: async (_, __, { user, tokenError }) => {
            if (tokenError) {
                throw new Error(tokenError);
            }
            if (!user) {
                throw new Error('Không được phép truy cập');
            }
            return categoryService.getCategories();
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
            console.log(title, category, context)
            // if (!context.user) {
            //     throw new Error('You must be logged in to upload a video');
            // }
            // if (context.tokenError) {
            //     throw new Error(tokenError);
            // }
            return videoService.uploadVideo(context.user.id, title, videoFile, thumbnailFile, category, tags);
        },
        likeVideo: likeService.likeVideo,
        unlikeVideo: likeService.unlikeVideo,
        likeComment: likeService.likeComment,
        unlikeComment: likeService.unlikeComment,
        addComment: commentService.addComment,
        followUser: async (_, { userId }, { user }) => {
            return followService.followUser(user.id, userId);
        },
        unfollowUser: async (_, { userId }, { user }) => {
            return followService.unfollowUser(user.id, userId);
        }
    },
    User: {
        videos: async (parent, _) => {
            return await models.Video.find({ user: parent._id });
        },
    },
    Video: {
        user: async (parent, _) => {
            return await models.User.findById(parent.user);
        },
    },
};

export default resolvers;
