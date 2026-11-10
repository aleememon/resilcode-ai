CORS(app)
api.add_middleware(CORSMiddleware, allow_origins=["*"])
