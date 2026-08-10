import mongoose from "mongoose";
import logger from '../utils/logger.js';
import models from "../models/index.js";
import uploadService from "./uploadService.js";

const getVideo = async (id) => {
  return models.Video.findById(id);
};

const isSaved = async (userId, videoId) => {
  const save = await models.Save.findOne({
    userId: userId,
    videoId: videoId
  });
  return !!save;
};

const isLiked = async (userId, videoId) => {
  const like = await models.Like.findOne({
    user: userId,
    targetId: videoId,
    targetType: 'Video',
  });
  return !!like;
};

const isViewed = async (userId, videoId) => {
  const view = await models.View.findOne({
    user: userId,
    video: videoId
  });
  return !!view;
};

const getRecommendedVideos = async (userId, limit = 10) => {
  try {
    const viewedVideoIds = await models.View.distinct('video', { user: userId });

    const likedVideoIds = await models.Like.distinct('targetId', { user: userId, targetType: 'Video' });

    let recommendedVideos;

    if (viewedVideoIds.length === 0 && likedVideoIds.length === 0) {
      recommendedVideos = await models.Video.aggregate([
        {
          $addFields: {
            score: {
              $add: [
                { $multiply: ['$views', 0.5] },
                { $multiply: ['$likeCount', 2] }
              ]
            },
            id: "$_id"
          }
        },
        { $sort: { score: -1 } },
        { $limit: limit }
      ]);
    } else {
      const userInterests = await models.Video.aggregate([
        {
          $match: {
            $or: [
              { _id: { $in: viewedVideoIds } },
              { _id: { $in: likedVideoIds } }
            ]
          }
        },
        {
          $group: {
            _id: null,
            categories: { $addToSet: '$category' },
            tags: { $addToSet: '$tags' }
          }
        },
        {
          $project: {
            _id: 0,
            categories: 1,
            tags: {
              $reduce: {
                input: '$tags',
                initialValue: [],
                in: { $setUnion: ['$$value', '$$this'] }
              }
            }
          }
        }
      ]);

      const { categories, tags } = userInterests[0] || { categories: [], tags: [] };

      recommendedVideos = await models.Video.aggregate([
        {
          $match: {
            _id: { $nin: [...viewedVideoIds, ...likedVideoIds] },
            $or: [
              { category: { $in: categories } },
              { tags: { $in: tags } }
            ]
          }
        },
        {
          $addFields: {
            score: {
              $add: [
                { $multiply: ['$views', 0.5] },
                { $multiply: ['$likeCount', 2] },
                {
                  $cond: [
                    { $in: ['$category', categories] },
                    10,
                    0
                  ]
                },
              ]
            },
            id: "$_id",
          }
        },
        { $sort: { score: -1 } },
        { $limit: limit },
      ]);
    }

    if (recommendedVideos.length < limit) {
      const additionalVideos = await models.Video.aggregate([
        {
          $match: {
            _id: { $nin: [...recommendedVideos.map(v => v._id), ...viewedVideoIds, ...likedVideoIds] }
          }
        },
        {
          $addFields: {
            score: {
              $add: [
                { $multiply: ['$views', 0.5] },
                { $multiply: ['$likeCount', 2] }
              ]
            },
            id: "$_id"
          }
        },
        { $sort: { score: -1 } },
        { $limit: limit - recommendedVideos.length }
      ]);

      recommendedVideos = [...recommendedVideos, ...additionalVideos];
    }

    return recommendedVideos;
  } catch (error) {
    logger.error('Error getting recommended videos:', error);
    throw new Error('An error occurred while fetching recommended videos');
  }
};



const uploadVideo = async (userId, title, videoFile, thumbnailFile, category, tags) => {
  let uploadedVideoLocation = null;
  let uploadedThumbnailLocation = null;
  try {
    const res = await uploadService.uploadToS3(thumbnailFile, 'thumbnail');
    uploadedThumbnailLocation = res.Location;
    const result = await uploadService.uploadToS3(videoFile, 'video');
    uploadedVideoLocation = result.Location;

    const video = new models.Video({
      user: userId,
      title,
      videoUrl: uploadedVideoLocation,
      thumbnailUrl: uploadedThumbnailLocation,
      tags,
      category
    });


    video.save();
    return video;
  } catch (error) {
    if (uploadedVideoLocation) {
      try {
        uploadService.deleteFromS3(uploadedVideoLocation);
      } catch (deleteError) {
        logger.error('Could not delete video from S3', deleteError);
      };
    }
    if (uploadedThumbnailLocation) {
      try {
        uploadService.deleteFromS3(uploadedThumbnailLocation);
      } catch (deleteError) {
        logger.error('Could not delete video from S3', deleteError);
      };
    }
    logger.error("Error in upload video:", error);
    throw new Error(error.message || "An error occurred during upload video");
  };
};

const getUserVideos = async (id, page, limit) => {
  try {
    let user = await models.User.findOne({ username: id });
    if (!user) {
      user = await models.User.findById(id);
    }
    if (!user) {
      throw new Error("User not found");
    }
    const skip = (page - 1) * limit;
    const videos = await models.Video.find({ user: user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return videos;
  } catch (error) {
    logger.error('Error fetching user videos:', error);
    throw new Error('An error occurred while fetching videos');
  }
};

const getNextUserVideo = async (currentVideoCreatedAt, userId) => {
  try {
    const video = await models.Video.findOne({
      createdAt: { $lt: currentVideoCreatedAt },
      user: userId
    }).sort({ createdAt: -1 });
    return video;
  } catch (error) {
    logger.error('Error get next user video:', error);
    throw new Error('An error occurred while fetching next user video');
  }
};

const getPrevUserVideo = async (currentVideoCreatedAt, userId) => {
  try {
    const video = await models.Video.findOne({
      createdAt: {
        $gt: currentVideoCreatedAt
      },
      user: userId
    });
    return video;
  } catch (error) {
    logger.error('Error get previous user video:', error);
    throw new Error('An error occurred while fetching previous user video');
  }
};

/**
 * Chuyển id dạng string sang ObjectId. Cần thiết cho aggregate() vì aggregation
 * pipeline không được mongoose tự động cast theo schema như find()/findOne().
 */
const toObjectId = (id) =>
  id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id);

/**
 * Lấy các video (mới nhất trước) của một nhóm tác giả mà `userObjectId` CHƯA xem.
 *
 * Trước đây hàm gọi View.find({ user }) rồi truyền toàn bộ id đã xem vào $nin.
 * Cách đó tải không giới hạn số bản ghi về memory và làm query phình to theo
 * thời gian sử dụng. Ở đây việc loại video đã xem được đẩy xuống MongoDB bằng
 * $lookup có $limit 1, nên chi phí không phụ thuộc vào lịch sử xem của user.
 */
const findUnviewedVideosByUsers = async (userObjectId, authorIds, limit) => {
  return models.Video.aggregate([
    { $match: { user: { $in: authorIds } } },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: models.View.collection.name,
        let: { videoId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$video', '$$videoId'] },
                  { $eq: ['$user', userObjectId] }
                ]
              }
            }
          },
          { $limit: 1 },
          { $project: { _id: 1 } }
        ],
        as: 'viewedByMe'
      }
    },
    { $match: { viewedByMe: { $size: 0 } } },
    { $project: { viewedByMe: 0 } },
    { $limit: limit }
  ]);
};

const getFollowingVideos = async (userId, limit = 10) => {
  try {
    const userObjectId = toObjectId(userId);

    const following = await models.Follow.find({ follower: userObjectId })
      .select('following')
      .lean();
    const followingIds = following.map(f => f.following);
    if (followingIds.length === 0) {
      return [];
    }

    return findUnviewedVideosByUsers(userObjectId, followingIds, limit);
  } catch (error) {
    logger.error('Error fetching following videos:', error);
    throw new Error('An error occurred while fetching following videos');
  }
};

const getFriendVideos = async (userId, limit = 10) => {
  try {
    // aggregate() KHÔNG tự cast string sang ObjectId như find(), nên phải cast tay,
    // nếu không $match sẽ không khớp bản ghi nào.
    const userObjectId = toObjectId(userId);

    const friendIds = await models.Follow.aggregate([
      { $match: { follower: userObjectId } },
      {
        $lookup: {
          // Lấy tên collection từ model để tránh hardcode sai ('follow' vs 'follows').
          from: models.Follow.collection.name,
          let: { followingId: '$following' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$follower', '$$followingId'] },
                    { $eq: ['$following', userObjectId] }
                  ]
                }
              }
            },
            { $limit: 1 },
            { $project: { _id: 1 } }
          ],
          as: 'mutualFollow'
        }
      },
      { $match: { 'mutualFollow.0': { $exists: true } } },
      { $project: { _id: 0, friendId: '$following' } }
    ]);

    const mutualFriendIds = friendIds.map(friend => friend.friendId);
    if (mutualFriendIds.length === 0) {
      return [];
    }

    return findUnviewedVideosByUsers(userObjectId, mutualFriendIds, limit);
  } catch (error) {
    logger.error('Error fetching friend videos:', error);
    throw new Error('An error occurred while fetching friend videos');
  }
};

export default {
  getVideo,
  getNextUserVideo,
  getPrevUserVideo,
  getRecommendedVideos,
  uploadVideo,
  getUserVideos,
  isSaved,
  isLiked,
  isViewed,
  getFollowingVideos,
  getFriendVideos,
};
