const TABLE = "users";
db.query("SELECT * FROM " + TABLE + " WHERE active = true");
