import aj from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetProtection = async (req, res, next) => {
    try {
        const decision = await aj.protect(req);

        if (decision.isDenided) {
            if(decision.reason.isRateLimit()){
                return res.status(429).json({ message: "Too many requests. Please try again later." });
            } else if (decision.reason.isBot()) {
                return res.status(403).json({ message: "Access denied. Please complete the challenge." });
            } else {
            return res.status(403).json({ message: "Access denied by security policy" });
            }
        }

        // check for spoofed bots and log them for further analysis
        if (decision.results.some(isSpoofedBot)) {
            return res.status(403).json({ error: "Spoofed bot detected.", 
                message: "Malicious bot activity detected." });
             
        }

        next();
        
    } catch (error) {
        console.error("Error in Arcjet middleware:", error);
        next(error);
        
    }
}