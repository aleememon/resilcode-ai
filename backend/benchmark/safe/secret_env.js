const DB_PASSWORD = process.env.DB_PASSWORD;
const password = req.body.password;
const passwordLabel = "Password";
const tokenType = "Bearer";
const apiKey = "";
const forgotPassword = "Forgot your password?";
const config = { secret: process.env.SECRET, timeout: "30 seconds" };
