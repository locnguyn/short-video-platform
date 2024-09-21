import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetType: { type: String, enum: ['Video', 'Comment'] },
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: 'targetType' },
    createdAt: { type: Date, default: Date.now },
});

likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export default mongoose.model('Like', likeSchema);
