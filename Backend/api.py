from fastapi import FastAPI
from pydantic import BaseModel

from datetime import datetime

# main.py
import main

app = FastAPI()

# Data models

class QueryRequest(BaseModel):
    user_query: str

class CronRequest(BaseModel):
    user_query: str
    searches: list
    last_time: datetime

class ReportRequest(BaseModel):
    user_query: str
    vetted_items: list
    first_time: datetime

# Endpoints

# 1. Create query
@app.post("/query")
def create_query(req: QueryRequest):
    searches = main.create_query(req.user_query)
    return {
        "searches": searches
    }

# 2. Cron job endpoint; run this every time a cron job happens
@app.post("/cron_refresh")
def cron_refresh(req: CronRequest):
    vetted_items = main.refresh_data(req.user_query, req.searches, req.last_time)
    return {
        "vetted_items": vetted_items
    }

# 3. Create report with user info
@app.post("/report")
def create_report(req: ReportRequest):
    report = main.create_report(req.user_query, req.vetted_items, req.first_time)
    return {
        "report": report
    }