import models from "../models/index.js";
import logger from '../utils/logger.js';

const followUser = async (followerId, followingId) => {

    try {
        const existingFollow = await models.Follow.findOne({
            follower: followerId,
            following: followingId
        });

        if (existingFollow) {
            return false;
        }

        const follow = new models.Follow({
            follower: followerId,
            following: followingId,
        });

        await follow.save();

        await models.User.findByIdAndUpdate(followerId, {
            $inc: { followingCount: 1 }
        });

        await models.User.findByIdAndUpdate(followingId, {
            $inc: { followerCount: 1 }
        });

        return true;
    } catch (error) {
        logger.error("Error while following user", error);
        throw new Error("Failed to follow user");
    }
};
const unfollowUser = async (followerId, followingId) => {
    try {
        const result = await models.Follow.findOneAndDelete({
            follower: followerId,
            following: followingId
        });

        if (!result) {
            return false;
        }

        await models.User.findByIdAndUpdate(followerId, {
            $inc: { followingCount: -1 }
        });

        await models.User.findByIdAndUpdate(followingId, {
            $inc: { followerCount: -1 }
        });
        return true;
    } catch (error) {
        logger.error("Error while unfollowing user", error);
        throw new Error("Failed to unfollow user");
    }
}


export default {
    followUser,
    unfollowUser
}
