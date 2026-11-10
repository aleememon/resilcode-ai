app.use(cors({ origin: "https://app.example.com", credentials: true }));
res.setHeader("Access-Control-Allow-Origin", "https://app.example.com");
