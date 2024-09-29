import models from "../models/index.js";
import userService from "./userService.js";
import videoService from "./videoService.js";


const getUserNotifications = async (userId) => {
    return await models.Notification.find({ user: userId }).sort({
        createdAt: -1
    }).limit(20);
};

const markNotificationAsRead = async (notificationId, userId) => {
    const notification = await models.Notification.findOneAndUpdate({
        user: userId,
        _id: notificationId
    }, {
        $set: {
            read: true
        }
    }, {
        new: true
    });

    if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
    }
    return notification;
};

const createLikeNotification = async (videoId, actorId) => {
    const video = await videoService.getVideo(videoId);
    const actor = await userService.getUserById(actorId);
    const notification = await models.Notification.createNotification({
        type: 'VIDEO_LIKE',
        content: `${actor.username} ${video.likeCount - 1 > 0 ? `và ${video.likeCount - 1} người khác` : ''} thích video ${video.title} của bạn!`,
        user: video.user,
        actor: actor.id,
        video: videoId
    });
    return {notification, user: video.user};
}

export default {
    getUserNotifications,
    markNotificationAsRead,
    createLikeNotification
};
