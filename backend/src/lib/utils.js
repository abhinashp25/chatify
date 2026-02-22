import jwt from 'jsonwebtoken';
import { ENV } from './env.JS';

export const generateToken = (userId, res) => {
    const { JWT_SECRET } = ENV;
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const token = jwt.sign({ userId }, ENV.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
        httpOnly: true, // Prevent XSS attacks by making the cookie inaccessible to JavaScript
        secure: ENV.NODE_ENV === "development" ? false : true, // Use secure cookies in production
        sameSite: "strict" //CSRF protection by restricting cookie to same site requests    
    });

     

}

// http://localhost
// https://dsmakm.com