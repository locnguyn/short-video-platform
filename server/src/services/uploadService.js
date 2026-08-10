import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import logger from '../utils/logger.js';
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const uploadToS3 = async (file, folder = 'upload') => {
    try {
        logger.debug(`S3 upload started, folder=${folder}`);
        const { createReadStream, filename, mimetype } = await file;

        const key = `${folder}/${uuidv4()}-${filename}`;
        const stream = createReadStream();

        logger.debug(`S3 uploading ${filename} (${mimetype})`);

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: key,
                Body: stream,
                ContentType: mimetype,
                // ACL: 'public-read'
            }
        });

        const result = await upload.done();
        logger.info(`S3 upload done: ${result.Location}`);
        
        return result;
    } catch (error) {
        logger.error("Error uploading file to S3:", error);
        throw new Error(`File upload failed: ${error.message}`);
    }
};

const deleteFromS3 = async (fileKey) => {
    try {
        logger.debug(`S3 delete ${fileKey}`);
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey
        }));
        logger.info('S3 delete done');
    } catch (error) {
        logger.error("Error deleting file from S3:", error);
        throw new Error(`File deletion failed: ${error.message}`);
    }
};

export default {
    uploadToS3,
    deleteFromS3,
};
