import models from "../models/index.js";

const likeVideo = async (videoId, userId) => {
    const newLike = new models.Like({ user: userId, targetType: 'Video', targetId: videoId });
    await newLike.save();
    return !!newLike;
}

const unlikeVideo = async (videoId, userId) => {
    const result = await models.Like.findOneAndDelete({ userId: userId, targetType: 'Video', targetId: videoId });
    return !!result;
}

const likeComment = async (_, { commentId }, { user }) => {
    const newLike = new models.Like({ userId: user.id, targetType: 'Comment', targetId: commentId });
    await newLike.save();
    return newLike;
}

const unlikeComment = async (_, { commentId }, { user }) => {
    const result = await models.Like.findOneAndDelete({ userId: user.id, targetType: 'Comment', targetId: commentId });
    return !!result;
}

export default {
    likeVideo,
    unlikeVideo,
    likeComment,
    unlikeComment
}
