import bcrypt from "bcryptjs";
import { sendWelcomeEmail, sendOtpEmail } from "../emails/emailHandlers.js";
import cloudinary from "../lib/cloudinary.js";
import { ENV } from "../lib/env.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password)
      return res.status(400).json({ message: "All fields are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ fullName, email, password: hashedPassword });
    const saved = await newUser.save();

    generateToken(saved._id, res);
    res.status(201).json({
      _id: saved._id,
      fullName: saved.fullName,
      email: saved.email,
      profilePic: saved.profilePic,
    });

    sendWelcomeEmail(saved.email, saved.fullName, ENV.CLIENT_URL).catch(console.error);
  } catch (e) {
    console.error("signup error:", e);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const user = await User.findOne({ email }).select("+twoFA.enabled +twoFA.otpHash +twoFA.otpExpiry");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    // If 2FA is enabled, send OTP instead of issuing JWT
    if (user.twoFA?.enabled) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const hash = await bcrypt.hash(otp, 8);
      await User.findByIdAndUpdate(user._id, {
        "twoFA.otpHash":   hash,
        "twoFA.otpExpiry": new Date(Date.now() + 10 * 60 * 1000),
      });

      try { await sendOtpEmail(user.email, otp); } catch (e) {
        console.error("OTP email failed:", e.message);
        return res.status(500).json({ message: "Failed to send verification code. Try again." });
      }

      return res.json({ requiresOTP: true, userId: user._id });
    }

    generateToken(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (e) {
    console.error("login error:", e);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verify2FALogin = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp)
    return res.status(400).json({ message: "userId and otp are required" });

  try {
    const user = await User.findById(userId).select("+twoFA.otpHash +twoFA.otpExpiry");
    if (!user || !user.twoFA?.otpHash)
      return res.status(400).json({ message: "Invalid request" });

    if (new Date() > user.twoFA.otpExpiry)
      return res.status(400).json({ message: "Code expired. Please login again." });

    const valid = await bcrypt.compare(otp, user.twoFA.otpHash);
    if (!valid) return res.status(400).json({ message: "Invalid code" });

    // Clear OTP fields then issue JWT
    await User.findByIdAndUpdate(userId, {
      "twoFA.otpHash":   null,
      "twoFA.otpExpiry": null,
    });

    generateToken(user._id, res);
    const fresh = await User.findById(userId).select("-password");
    res.json(fresh);
  } catch (e) {
    console.error("verify2FALogin:", e);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggle2FA = async (req, res) => {
  const { password } = req.body;
  try {
    const user = await User.findById(req.user._id).select("+twoFA.enabled password");
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Incorrect password" });

    const newState = !user.twoFA.enabled;
    await User.findByIdAndUpdate(req.user._id, { "twoFA.enabled": newState });
    res.json({ enabled: newState });
  } catch (e) {
    console.error("toggle2FA:", e);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (_, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio, status } = req.body;
    const updates = {};

    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic);
      updates.profilePic = upload.secure_url;
    }
    if (fullName?.trim())    updates.fullName = fullName.trim();
    if (bio  !== undefined)  updates.bio      = bio.slice(0, 160);
    if (status !== undefined) updates.status  = status.slice(0, 139);

    if (!Object.keys(updates).length)
      return res.status(400).json({ message: "Nothing to update." });

    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.status(200).json(updated);
  } catch (e) {
    console.error("updateProfile:", e);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePrivacy = async (req, res) => {
  try {
    const { readReceipts, lastSeenFor, profilePhotoFor } = req.body;
    const updates = {};
    if (readReceipts   !== undefined) updates["privacySettings.readReceipts"]    = readReceipts;
    if (lastSeenFor    !== undefined) updates["privacySettings.lastSeenFor"]     = lastSeenFor;
    if (profilePhotoFor !== undefined) updates["privacySettings.profilePhotoFor"] = profilePhotoFor;

    if (!Object.keys(updates).length)
      return res.status(400).json({ message: "Nothing to update." });

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select("-password");
    res.json(updated);
  } catch (e) {
    console.error("updatePrivacy:", e);
    res.status(500).json({ message: "Server error" });
  }
};
