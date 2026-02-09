import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv() # Load secrets from a .env file

# If no DB URL is found, it falls back to SQLite (so it still works locally for you!)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hrms.db")

# Industry Check: Postgres needs different connection args than SQLite
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()