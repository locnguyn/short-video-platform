import models from "../models/index.js";

const addComment = async (_, { videoId, content, parentCommentId }, { user }) => {
    const MAX_DEPTH = 3;

    let parentComment = null;
    let newCommentLevel = 0;

    if (parentCommentId) {
        parentComment = await models.Comment.findById(parentCommentId);
        if (!parentComment) {
            throw new Error('Parent comment not found');
        }

        newCommentLevel = parentComment.level + 1;

        if (newCommentLevel >= MAX_DEPTH) {
            newCommentLevel = MAX_DEPTH - 1;
            parentCommentId = parentComment.parentCommentId;
        }
    }

    const newComment = new models.Comment({
        content,
        userId: user.id,
        videoId,
        parentCommentId,
        level: newCommentLevel,
    });

    await newComment.save();

    return newComment;
}

export default {
    addComment
}
