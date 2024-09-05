import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from 'uuid';
import models from '../models/index.js';
import bcrypt from 'bcryptjs'
import { createToken } from '../utils/jwtTokenUtils.js';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const resolvers = {
    Upload: GraphQLUpload,
    Query: {
        getUser: async (_, { id }, context) => {
            console.log('getUser called with id:', id);
            try {
              const user = await models.User.findById(id);
              if (!user) {
                console.log('User not found for id:', id);
                throw new Error('User not found');
              }
              return user;
            } catch (error) {
              console.error('Error in getUser:', error);
              throw error;
            }
          },
        getVideo: async (_, { id }) => {
            return await models.Video.findById(id);
        },
        getRecommendedVideos: async (_, { userId }) => {
            // Implement recommendation logic here
            return await models.Video.find().limit(10);
        },
    },
    Mutation: {
        registerUser: async (_, { username, email, password }) => {
            try {
                console.log(username, email, password);
                const hashedPassword = await bcrypt.hash(password, 10);
                const user = new models.User({ username, email, password: hashedPassword });
                await user.save();
                const token = createToken(user);
                return { token, user };
            } catch (error) {
                console.error("Error in registerUser:", error);
                throw new Error(error.message || "An error occurred during registration");
            }
        },
        loginUser: async (_, { email, password }) => {
            console.log(email)
            try {
                const user = await models.User.findOne({
                    $or: [{ email: email }, { username: email }]
                });

                if (!user) {
                    throw new Error('User not found');
                }

                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    throw new Error('Invalid password');
                }

                const token = createToken(user);
                return { token, user };
            } catch (error) {
                console.error("Error in loginUser:", error);
                throw new Error(error.message || "An error occurred during login");
            }
        },
        uploadVideo: async (_, { title, videoFile, category, tags }, context) => {
            console.log('Received upload request:', { title, description, category, tags });
            if (!context.user) {
                throw new Error('You must be logged in to upload a video');
            }

            const { createReadStream, filename, mimetype } = await videoFile;

            // Generate a unique filename
            const uniqueFilename = `${uuidv4()}-${filename}`;

            // Create a read stream for the file
            const stream = createReadStream();

            // Set up the S3 upload
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
                // Perform the upload
                const result = await upload.done();
                console.log(result);

                // Create a new video document
                const newVideo = new models.Video({
                    user: context.user.id,
                    title,
                    videoUrl: result.Location,
                    category,
                    tags: tags || [],
                });

                // Save the video document
                const savedVideo = await newVideo.save();

                return savedVideo;
            } catch (error) {
                console.error("Error uploading to S3", error);
                throw new Error("Failed to upload video");
            }
        },
        likeVideo: async (_, { userId, videoId }) => {
            const video = await models.Video.findById(videoId);
            if (!video.likes.includes(userId)) {
                video.likes.push(userId);
                await video.save();
            }
            return video;
        }
    },
    User: {
        videos: async (parent, _) => {
            return await models.Video.find({ user: parent.id });
        },
    },
    Video: {
        user: async (parent, _) => {
            return await models.User.findById(parent.user);
        },
        comments: async (parent, _) => {
            return await models.Comment.find({ video: parent.id });
        },
        likes: async (parent, _) => {

        }
    },
};

export default resolvers;
