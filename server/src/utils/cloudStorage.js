const AWS = require('aws-sdk');
const stream = require('stream');

class CloudStorage {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    this.bucket = process.env.AWS_S3_BUCKET;
  }

  uploadFile(fileStream, key, contentType) {
    return new Promise((resolve, reject) => {
      const pass = new stream.PassThrough();

      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: pass,
        ContentType: contentType,
      };

      this.s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Location);
        }
      });

      fileStream.pipe(pass);
    });
  }

  deleteFile(key) {
    const params = {
      Bucket: this.bucket,
      Key: key,
    };

    return this.s3.deleteObject(params).promise();
  }
}

module.exports = new CloudStorage();
