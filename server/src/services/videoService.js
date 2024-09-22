import { Upload } from "@aws-sdk/lib-storage";
import models from "../models/index.js";
import uploadService from "./uploadService.js";

const getVideo = async (id) => {
  return await models.Video.findById(id);
}

const getRecommendedVideos = async (userId) => {
  // Implement recommendation logic here
  return await models.Video.find().limit(10);
}



const uploadVideo = async (userId, title, videoFile, thumbnailFile, category, tags) => {
  let uploadedVideoLocation = null;
  let uploadedThumbnailLocation = null;
  try {
    const res = await uploadService.uploadToS3( thumbnailFile, 'thumbnail');
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
}

export default {
  getVideo,
  getRecommendedVideos,
  uploadVideo
}
