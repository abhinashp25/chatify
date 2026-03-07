import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6       
    },
    profilePic: {
        type: String,
        default: ""
    },

    bio: { 
        type: String,
        default: "",
        maxlength: 160 
    },

    status:     { type: String, default: "Hey there! I am using Chatify", maxlength: 139 },
    lastSeen:   { type: Date, default: Date.now },
    
    archivedChats: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, {timestamps: true}); 

const User = mongoose.model("User", userSchema);

export default User;

