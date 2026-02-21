import mongoose from 'mongoose';

export const connectDB = async () => {
    try {

        const { MONGO_URI } = process.env;
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log ("MONGODB CONNECTE: ", conn.connection.host);
        }catch (error) {
        console.error ("MONGODB ERROR: ", error);
        process.exit(1); //1 status means faiolure, 0 means success
    }
};

