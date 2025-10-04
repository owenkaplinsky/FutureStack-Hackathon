from sqlalchemy import Column, Integer, String, JSON, DateTime
from .db import Base

# Tasks that can be created by the user
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, nullable=False, index=True, autoincrement=True)
    userid = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    text = Column(String, nullable=False)
    sources = Column(Integer, nullable=False)
    searches = Column(JSON, nullable=False)
    last_cron = Column(DateTime, nullable=False)
    last_report = Column(DateTime, nullable=False)
    contact = Column(Integer, nullable=False)
    reports_sent = Column(Integer, nullable=False)

# Items that went through both filters and are waiting to be used
class Items(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, nullable=False, index=True, autoincrement=True)
    taskid = Column(Integer, nullable=False)
    userid = Column(Integer, nullable=False)
    task_title = Column(String, nullable=False)
    item_title = Column(String, nullable=False)
    text = Column(String, nullable=False)
    link = Column(String, nullable=False)
    site_date = Column(DateTime)

# User information
class Users(Base):
    __tablename__ = "users"
    hashed_password = Column(String, nullable=False)
    userid = Column(Integer, primary_key=True, nullable=False, index=True, autoincrement=True)
    email = Column(String, nullable=False, unique=True)
    active_count = Column(Integer, nullable=False)
    reports_sent = Column(Integer, nullable=False)
    last_time = Column(DateTime)

# User activity (actions taken by the user, reports sent to them, etc.)
class UserActivity(Base):
    __tablename__ = "useractivity"
    id = Column(Integer, primary_key=True, nullable=False, index=True, autoincrement=True)
    userid = Column(Integer, nullable=False)
    action = Column(String, nullable=False)
    time = Column(DateTime, nullable=False)