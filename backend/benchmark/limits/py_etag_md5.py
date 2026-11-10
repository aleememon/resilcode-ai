# Known false positive: MD5 used only as a cache ETag; usedforsecurity=False is missing.
etag = hashlib.md5(body).hexdigest()
