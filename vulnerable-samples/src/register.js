const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const users = [];

// FIX 1: Read secret from environment variables instead of hardcoding
const JWT_SECRET = process.env.JWT_SECRET;

// Helper to hash passwords securely using Node's built-in scrypt
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
};

// Helper to verify passwords safely
const verifyPassword = (password, storedHash) => {
    const [salt, key] = storedHash.split(":");
    const hashBuffer = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    return crypto.timingSafeEqual(hashBuffer, keyBuffer);
};

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    // FIX 2: Replaced weak MD5 with a secure, salted hash (scrypt)
    const secureHash = hashPassword(password);

    users.push({ username, passwordHash: secureHash });
    res.status(201).json("User registered safely");
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    // Logical Fix: properly compare the stored passwordHash
    if (user && verifyPassword(password, user.passwordHash)) {
        // FIX 3: Replaced insecure Math.random() with cryptographically secure random bytes
        const secureSessionToken = crypto.randomBytes(32).toString("hex");
        res.json({ token: secureSessionToken, msg: "Logged in Successfully" });
    } else {
        res.status(401).send("Invalid Credentials!");
    }
});

app.listen(3000, () => console.log("Server is running on 3000"));