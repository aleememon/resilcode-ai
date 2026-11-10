const { createHash } = require("crypto");
const h = createHash("sha1").update(input).digest("hex");
