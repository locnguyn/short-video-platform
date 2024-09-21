import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const uploadToS3 = async (file, folder = '/upload') => {
    const { createReadStream, filename, mimetype } = await file;

    const key = `${folder}/${uuidv4()}-${filename}`;
    const stream = createReadStream();

    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            Body: stream,
            ContentType: mimetype,
            // ACL: 'public-read'
        }
    })

    try {
        const result = await upload.done();
        console.log(result);
        return result;
    } catch (error) {
        console.error("Error uploading file to S3", error);
        throw new Error("File upload failed");
    }
}

const deleteFromS3 = async (fileKey) => {
    try {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey
        }))
        console.log("File deleted successfully");
    } catch (error) {
        console.error("Error deleting file from S3", error);
        throw new Error("File deletion failed");
    }
}


export default {
    uploadToS3,
    deleteFromS3,
}
