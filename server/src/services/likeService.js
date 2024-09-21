import models from "../models/index.js";

const likeVideo = async (_, { videoId }, { user }) => {
    const newLike = new models.Like({ userId: user.id, targetType: 'Video', targetId: videoId });
    await newLike.save();
    return newLike;
}

const unlikeVideo = async (_, { videoId }, { user }) => {
    const result = await models.Like.findOneAndDelete({ userId: user.id, targetType: 'Video', targetId: videoId });
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
