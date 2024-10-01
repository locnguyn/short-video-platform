import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true}
});

const commentSchema = new mongoose.Schema({
    content: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    level: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

commentSchema.index({ videoId: 1, parentCommentId: 1 });
const followSchema = new mongoose.Schema({
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

followSchema.index({ follower: 1, following: 1 }, { unique: true });
const interactionTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String
});
const likeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetType: { type: String, enum: ['Video', 'Comment'] },
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: 'targetType' },
    createdAt: { type: Date, default: Date.now },
});

likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
const recommendationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, required: true },
    isViewed: { type: mongoose.Schema.Types.Boolean, default: false },
});
const saveSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    createAt: { type: Date, default: Date.now() },
});
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: String,
    createdAt: { type: Date, default: Date.now },
  });
  const userInteractionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true},
    interactionTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InteractionType', required: true },
    score: Number,
    timestamp: { type: Date, default: Date.now() }
});


userInteractionSchema.index({ userId: 1, videoId: 1 });
userInteractionSchema.index({ interactionTypeId: 1 });
const userPreferenceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    score: Number,
});

const videoSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    videoKey: { type: String, required: true },
    thumbnailUrl: String,
    duration: { type: Number, required: true},
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    tags: [String],
    likeCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  });


  
