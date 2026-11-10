res.cookie("sid", id, { httpOnly: true, secure: true, sameSite: "lax" });
app.use(session({ secret: process.env.S, cookie: { secure: isProd, httpOnly: true } }));
