"""
Author: Zizhen WANG (backend configuration and environment loading)
"""

import os
from datetime import timedelta
from urllib.parse import quote_plus

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

_DEFAULT_FRONTEND_ORIGINS = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:5173"

# LLM configuration
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_URL = os.getenv("LLM_URL", "https://api.deepseek.com/v1/chat/completions")
LLM_MODEL = os.getenv("LLM_MODEL")

# Frontend configuration
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", _DEFAULT_FRONTEND_ORIGINS).split(",")
    if origin.strip()
]

# Default scheduling rule
DEFAULT_RULE = "FIFO"

#
# Database (MySQL 8.0)
#
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "intellisched")

if os.getenv("DATABASE_URL"):
    DATABASE_URL = os.getenv("DATABASE_URL")
else:
    # URL-encode password to avoid parsing errors when it contains special chars
    _safe_password = quote_plus(DB_PASSWORD) if DB_PASSWORD else ""
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{_safe_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

#
# Auth / JWT
#
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
ACCESS_TOKEN_EXPIRE = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

if os.getenv("DEBUG_CONFIG_PRINTS", "0") == "1":
    if LLM_API_KEY:
        print("Loaded Key prefix:", LLM_API_KEY[:8])
    else:
        print("LLM API key not configured")
    print("LLM URL:", LLM_URL)
    print("Allowed Frontend Origins:", FRONTEND_ORIGINS)
    print("Database URL:", DATABASE_URL)
