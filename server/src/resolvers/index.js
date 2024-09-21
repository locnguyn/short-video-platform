import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import models from '../models/index.js';
import userService from '../services/userService.js';
import videoService from '../services/videoService.js';
import likeService from '../services/likeService.js';
import commentService from '../services/commentService.js';
import followService from '../services/followService.js';


const resolvers = {
    Upload: GraphQLUpload,
    Query: {
        getUser: async (_, { id }, { user }) => {
            return userService.getUser(id, user.id);
        },
        getVideo: async (_, { id }) => {
            return videoService.getVideo(id);
        },
        getRecommendedVideos: async(_, { userId }) => {
            return videoService.getRecommendedVideos(userId);
        },
    },
    Mutation: {
        registerUser: async (_, {username, email, password, avatarFile}) => {
            return userService.registerUser(username, email, password, avatarFile);
        },
        loginUser: async (_, { email, password }) => {
            return userService.loginUser(email, password);
        },
        uploadVideo: videoService.uploadVideo,
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
            return await models.Video.find({ user: parent.id });
        },
    },
    Video: {
        user: async (parent, _) => {
            return await models.User.findById(parent.user);
        },
    },
};

export default resolvers;
