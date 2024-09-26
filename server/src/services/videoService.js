import models from "../models/index.js";
import uploadService from "./uploadService.js";

const getVideo = async (id) => {
  return await models.Video.findById(id);
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
    // Get user's viewing history
    const viewedVideoIds = await models.View.distinct('video', { user: userId });

    // Get user's liked videos
    const likedVideoIds = await models.Like.distinct('targetId', { user: userId, targetType: 'Video' });

    // Get user's interests (categories and tags) from viewed and liked videos
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
          tags: { $reduce: {
            input: '$tags',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }}
        }
      }
    ]);

    const { categories, tags } = userInterests[0] || { categories: [], tags: [] };

    // Find recommended videos
    const recommendedVideos = await models.Video.aggregate([
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

    return recommendedVideos;
  } catch (error) {
    console.error('Error getting recommended videos:', error);
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

    console.log(video);

    video.save();
    return video;
  } catch (error) {
    if (uploadedVideoLocation) {
      try {
        uploadService.deleteFromS3(uploadedVideoLocation);
      } catch (deleteError) {
        console.error('Could not delete video from S3', deleteError);
      };
    }
    if (uploadedThumbnailLocation) {
      try {
        uploadService.deleteFromS3(uploadedThumbnailLocation);
      } catch (deleteError) {
        console.error('Could not delete video from S3', deleteError);
      };
    }
    console.error("Error in upload video:", error);
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
    console.error('Error fetching user videos:', error);
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
    console.error('Error get next user video:', error);
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
    console.error('Error get previous user video:', error);
    throw new Error('An error occurred while fetching previous user video');
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
  isViewed
};
