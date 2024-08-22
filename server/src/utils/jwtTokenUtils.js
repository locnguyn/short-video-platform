import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config()

export const createToken = (user) => {
    return jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

export const getToken = () => {
    return localStorage.getItem('authToken');
};

export const removeToken = () => {
    localStorage.removeItem('authToken');
};

export const decodeToken = (token) => {

}
