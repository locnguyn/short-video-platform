import mongoose from "mongoose";

const interactionTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String
});

export default mongoose.model('InteractionType', interactionTypeSchema);
