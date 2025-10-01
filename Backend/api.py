from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

import main
from database.db import Base, SessionLocal, engine
from database import models

from mail import send_message

Base.metadata.create_all(bind=engine)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CreateUser(BaseModel):
    email: str

class TaskBase(BaseModel):
    userid: int
    title: str
    text: str
    sources: int
    last_cron: datetime

class TaskCreate(TaskBase):
    userid: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    sources: Optional[int] = None

class TaskResponse(TaskBase):
    userid: int
    id: int
    searches: list

    class Config:
        orm_mode = True

# POST /create_user - add a new user
@app.post("/create_user", status_code=201)
def create_user(user: CreateUser, db: Session = Depends(get_db)):
    new_user = models.Users(
        email=user.email
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"detail": "User created successfully."}

# POST /run_cron - call this for the cron job. Does all the backend work for cron
@app.post("/run_cron")
def run_cron(db: Session = Depends(get_db)):
    tasks = db.query(models.Task).all()

    for task in tasks:
        id = task.id
        userid = task.userid
        title = task.title
        text = task.text
        sources = task.sources
        searches = main.create_query(task.text)
        last_cron = task.last_cron
        last_report = task.last_report

        # Update run timestamp
        task.last_cron = datetime.utcnow()
        db.add(task)
        db.commit()
        db.refresh(task)

        # Get the newly vetted items since the last cron
        new_items = main.refresh_data(text, searches, last_cron)

        # Filter existing items for this task
        existing_items = db.query(models.Items).filter(models.Items.taskid == id).all()

        all_items = list(new_items) + list(existing_items)

        # Check if we meet the minimum item count
        if len(all_items) >= sources:
            report = main.create_report(text, all_items, last_report)

            email = db.query(models.Users).filter(models.Users.userid == userid).first().email

            send_message(
                to=email,
                subject=f"Your report on {title} is waiting for you!",
                message_text=report
            )
        else:
            for name, link, date, reason in new_items:
                new_item = models.Items(
                    taskid=id,
                    userid=userid,
                    task_title=title,
                    item_title=name,
                    text=reason,
                    link=link,
                    site_date=date,
                )
                db.add(new_item)

            db.commit()

    return {"detail": "All tasks ran successfully."}

# GET /get_queries - return all tasks
@app.get("/get_queries", response_model=list[TaskResponse])
def get_queries(userid: int, db: Session = Depends(get_db)):
    return db.query(models.Task).filter(models.Task.userid == userid).all()

# POST /create_query - add a new task
@app.post("/create_query", status_code=201)
def create_query(task: TaskCreate, db: Session = Depends(get_db)):
    queries = db.query(models.Task).filter(models.Task.userid == task.userid).all()

    if len(queries) >= 3:
        raise HTTPException(
            status_code=409,
            detail="User already has 3 or more tasks; cannot create another."
        )

    new_task = models.Task(
        userid=task.userid,
        title=task.title,
        text=task.text,
        sources=task.sources,
        searches=main.create_query(task.text),
        last_cron=task.last_cron
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return {"detail": "Task created successfully."}

# PUT /update_query/:id - update an existing task
@app.put("/update_query/{id}", status_code=200)
def update_query(id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.title is not None:
        db_task.title = task.title
    if task.text is not None:
        db_task.text = task.text
    if task.sources is not None:
        db_task.sources = task.sources

    db.commit()
    db.refresh(db_task)
    return {"detail": "Task updated successfully."}

# DELETE /delete_query/:id - delete a task
@app.delete("/delete_query/{id}", status_code=200)
def delete_query(id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(db_task)
    db.commit()
    return {"detail": "Task deleted successfully."}