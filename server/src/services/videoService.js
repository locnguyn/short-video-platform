const cloudStorage = require('../utils/cloudStorage');
const videoProcessor = require('../utils/videoProcessor');
const Video = require('../models/Video');

class VideoService {
  async uploadVideo({ stream, filename, mimetype, title, description, userId }) {
    // Tạo tên file duy nhất
    const uniqueFilename = `${Date.now()}-${filename}`;

    // Upload video gốc lên cloud storage
    const videoUrl = await cloudStorage.uploadFile(stream, uniqueFilename, mimetype);

    // Xử lý video (nén, tạo thumbnail)
    const { processedVideoUrl, thumbnailUrl } = await videoProcessor.processVideo(videoUrl);

    // Lưu thông tin video vào database
    const video = new Video({
      title,
      description,
      url: processedVideoUrl,
      thumbnailUrl,
      user: userId,
    });

    await video.save();

    // Xóa file gốc nếu cần
    // await cloudStorage.deleteFile(uniqueFilename);

    return video;
  }
}

module.exports = new VideoService();
