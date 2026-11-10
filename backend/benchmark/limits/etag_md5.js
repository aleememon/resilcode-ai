// MD5 used only as a cache ETag, not for security. Semgrep cannot tell the difference.
const etag = crypto.createHash("md5").update(body).digest("hex");
