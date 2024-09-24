import models from "../models/index.js"

const viewVideo = async (userId, videoId) => {
    try {
        const existView = await models.View.findOne({
            user: userId,
            video: videoId
        });
        if(existView){
            existView.updateOne({
                $inc: {
                    viewVideo: 1
                }
            });
        } else {
            const newView = new models.View({
                user: userId,
                video: videoId
            });
            await newView.save();
        }
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                views: 1
            }
        });
        return true;
    } catch (error) {
        console.error("Error viewing video", error);
        return false;
    }
}

export default {
    viewVideo
}
