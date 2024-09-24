import models from "../models/index.js";

const likeVideo = async (videoId, userId) => {
    try {
        const existingLike = await models.Like.findOne({
            user: userId,
            targetId: videoId,
            targetType: 'Video'
        });
        if (existingLike) {
            return false;
        }
        const newLike = new models.Like({ user: userId, targetType: 'Video', targetId: videoId });


        console.log("New like object before save:", newLike.toObject());
        await newLike.save();
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                likeCount: 1
            }
        });
        return true;
    } catch (error) {
        console.error("error like video", error);
        return false;
    }
}

const unlikeVideo = async (videoId, userId) => {
    const result = await models.Like.findOneAndDelete({ user: userId, targetType: 'Video', targetId: videoId });
    if(result)
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                likeCount: -1
            }
        })
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
