const h = crypto.createHash("sha256").update(data).digest("hex");
const c = crypto.createCipheriv("aes-256-gcm", key, iv);
const t = crypto.randomBytes(32).toString("hex");
const hashed = await bcrypt.hash(password, 12);
const hmac = crypto.createHmac("sha256", key);
