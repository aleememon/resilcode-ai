const express = require("express");
const mysql = require("mysql2");

const app = express();

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "test"
});

app.get("/get-all-records", (req, res) => {
    const userID = req.query.id;

    // FIX: Use a ? placeholder instead of interpolating the string
    const query = `SELECT * FROM users WHERE id = ?`;

    // Pass the userID as an array in the second argument
    db.query(query, [userID], (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.json(results);
    });
});
app.listen(3000, () => console.log("server is running on 3000"))