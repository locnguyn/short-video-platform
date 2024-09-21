import mongoose from "mongoose";
import models from "../models/index.js";

const followUser = async (followerId, followingId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const follow = new models.Follow({
            follower: followerId,
            following: followingId,
        })

        await follow.save({ session });

        await models.User.findByIdAndUpdate(followerId, {
            $inc: { followingCount: 1 }
        }, {
            session
        });

        await models.User.findByIdAndUpdate(followingId, {
            $inc: { followerCount: 1 }
        }, {
            session
        });

        session.commitTransaction();
        return true;
    } catch (error) {
        await session.abortTransaction();
        if (error.code === 11000) {
            return false;
        }
        console.error("Error while following user", error);
        throw new Error("Failed to follow user");
    } finally {
        session.endSession();
    }
}

const unfollowUser = async (followerId, followingId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await models.Follow.findOneAndDelete({
            follower: followerId,
            following: followingId
        }, {
            session
        });

        if (!result) {
            await session.abortTransaction();
            return false;
        }

        await models.User.findByIdAndUpdate(followerId, {
            $inc: { followingCount: -1 }
        }, {
            session
        });

        await models.User.findByIdAndUpdate(followingId, {
            $inc: { followerCount: -1 }
        }, {
            session
        });

        session.commitTransaction();
        return true;
    } catch (error) {
        await session.abortTransaction();
        console.error("Error while unfollowing user", error);
        throw new Error("Failed to unfollow user");
    }
}

const getFollowers = async (userId, first, after) => {
    try {
        const query = { following: userId };
    } catch (error) {
        console.error("Error while getting followers", error);
        throw new Error("Failed to get followers");
    }
}


export default {
    followUser,
    unfollowUser
}
