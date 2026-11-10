const a = crypto.createCipheriv("des-ede3", key, iv);
const b = crypto.createCipheriv("aes-128-ecb", key, null);
