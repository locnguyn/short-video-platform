import { Upload } from "@aws-sdk/lib-storage";
import models from "../models/index.js";

const getVideo = async (id) => {
  return await models.Video.findById(id);
}

const getRecommendedVideos = async (userId) => {
  // Implement recommendation logic here
  return await models.Video.find().limit(10);
}



const uploadVideo = async (_, { title, videoFile, category, tags }, context) => {
  console.log('Received upload request:', { title, description, category, tags });
  if (!context.user) {
    throw new Error('You must be logged in to upload a video');
  }

  const { createReadStream, filename, mimetype } = await videoFile;

  const uniqueFilename = `${uuidv4()}-${filename}`;

  const stream = createReadStream();

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: uniqueFilename,
      Body: stream,
      ContentType: mimetype,
    },
  });

  try {
    const result = await upload.done();
    console.log(result);

    const newVideo = new models.Video({
      user: context.user.id,
      title,
      videoUrl: result.Location,
      category,
      tags: tags || [],
    });

    const savedVideo = await newVideo.save();

    return savedVideo;
  } catch (error) {
    console.error("Error uploading to S3", error);
    throw new Error("Failed to upload video");
  }
}

export default {
  getVideo,
  getRecommendedVideos,
  uploadVideo
}
