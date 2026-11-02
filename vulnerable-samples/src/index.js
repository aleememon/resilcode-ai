const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

app.get("/", (req, res) => {
  res.send("HEllo");
});

app.get("/read", (req, res) => {
  const filename = req.query.file;

  // VULENRABILITY: Directly concatenating user input allows an attacker
  // to break out of the directory using "../../etc/passwd"

  fs.readFile("./public/" + filename, "utf8", (err, data) => {
    // if (err) return res.status(500).send("File not found");
    res.send(data);
  });
});

// CODE FIX of app.get("/read")
const SAFE_DIR = path.resolve(__dirname, "public");

app.get("/read-fix", (req, res) => {
    const filename = req.query.file;

    if (!filename || typeof filename !== "string") {
        return res.status(400).send("Invalid file parameter");
    }

    const sanitizedFilename = path.basename(filename);
    // nosemgrep: javascript.express.security.audit.express-path-join-resolve-traversal.express-path-join-resolve-traversal
    const targetPath = path.join(SAFE_DIR, sanitizedFilename);

    const safePrefix = SAFE_DIR.endsWith(path.sep) ? SAFE_DIR : SAFE_DIR + path.sep;
    if (!targetPath.startsWith(safePrefix)) {
        return res.status(403).send("Access Denied: Path traversal detected");
    }

    fs.readFile(targetPath, "utf8", (err, data) => {
        if (err) {
            return res.status(404).send("File not found");
        }
        res.send(data);
    });
});