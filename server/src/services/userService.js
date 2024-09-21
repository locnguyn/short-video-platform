import models from "../models/index.js";
import { createToken } from "../utils/jwtTokenUtils.js";
import bcrypt from 'bcryptjs'
import uploadService from "./uploadService.js";

const getUser = async (userId, viewerId) => {
    console.log('getUser called with id:', id);
    try {
        const user = await models.User.findById(userId);
        if (!user) {
            console.log('User not found for id:', userId);
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        console.error('Error in getUser:', error);
        throw error;
    }
}

const registerUser = async (username, email, password, profilePicture) => {
    let uploadedFileLocation;
    try {
        if (profilePicture) {
            const res = await uploadService.uploadToS3(profilePicture, "avatar");
            console.log(res);
            uploadedFileLocation = res.Location;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new models.User({ username, email, password: hashedPassword, profilePicture: uploadedFileLocation });
        await user.save();
        const token = createToken(user);
        return { token, user };
    } catch (error) {
        if (uploadedFileLocation) {
            try {
                uploadService.deleteFromS3(uploadedFileLocation);
            } catch (deleteError) {
                console.error("Error deleting uploaded file from S3: ", deleteError);
            }
        }
        console.error("Error in registerUser:", error);
        throw new Error(error.message || "An error occurred during registration");
    }
}

const loginUser = async (email, password) => {
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
}


export default {
    getUser,
    registerUser,
    loginUser
}
