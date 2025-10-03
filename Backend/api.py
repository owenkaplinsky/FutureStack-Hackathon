from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security.api_key import APIKeyHeader
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt, JWTError
from typing import Optional
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

from . import main
from Backend.database.db import Base, SessionLocal, engine
from Backend.database import models

from Backend.mail import send_message

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow frontend dev server and preflight (OPTIONS) including custom AUTH_KEY header
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET", "dev_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

API_KEY = os.getenv("AUTH_KEY")
api_key_header = APIKeyHeader(name="AUTH_KEY", auto_error=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_api_key(api_key: str = Depends(api_key_header)):
    if api_key == API_KEY:
        return api_key
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing API Key",
    )

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.Users).filter(models.Users.userid == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

onboarding_message = f"""
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #2c3e50;">Welcome!</h2>

    <p>Thank you for joining our service - we're excited to have you on board!</p>

    <p>With your new account, you'll be able to:</p>
    <ul>
      <li>Create and manage up to 3 custom tasks.</li>
      <li>Receive timely reports delivered straight to your inbox.</li>
      <li>Stay up to date with the latest insights tailored to your needs.</li>
    </ul>

    <p>To get started, simply log in to your dashboard and set up your first query!</p>
  </body>
</html>
"""

class CreateUser(BaseModel):
    email: str
    password: str

class LoginUser(BaseModel):
    email: str
    password: str

class UserInfo(BaseModel):
    userid: int
    email: str
    active_count: int
    reports_sent: int
    last_time: Optional[datetime] = None

class TaskBase(BaseModel):
    title: str
    text: str
    sources: int
    contact: int
    last_cron: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    sources: Optional[int] = None
    contact: Optional[int] = None

class TaskResponse(TaskBase):
    userid: int
    id: int
    searches: list

    class Config:
        orm_mode = True

def get_password_hash(password):
    if not isinstance(password, str):
        password = str(password)
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
  
# POST /create_user - add a new user
@app.post("/create_user", status_code=201)
def create_user(user: CreateUser, db: Session = Depends(get_db)):
    db_user = db.query(models.Users).filter(models.Users.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    
    new_user = models.Users(
        email=user.email,
        hashed_password=hashed_password,
        active_count=0,
        reports_sent=0,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_message(
        to=user.email,
        subject=f"Welcome to Proactive AI!",
        message_text=onboarding_message
    )
    
    return {"detail": "User created successfully."}

# POST /login - log the user into their account
@app.post("/login")
def login(user: LoginUser, db: Session = Depends(get_db)):
    db_user = db.query(models.Users).filter(models.Users.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(db_user.userid)})
    return {"access_token": access_token, "token_type": "bearer"}

# GET /user_info - get user info
@app.get("/user_info", response_model=UserInfo)
def user_info(current_user: models.Users = Depends(get_current_user)):
    return {
        "userid": current_user.userid,
        "email": current_user.email,
        "active_count": current_user.active_count,
        "reports_sent": current_user.reports_sent,
        "last_time": current_user.last_time,
    }

# POST /run_cron - call this for the cron job. Does all the backend work for cron
@app.post("/run_cron")
def run_cron(db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    tasks = []
    
    # Short session just to fetch tasks
    with SessionLocal() as db:
        tasks = db.query(models.Task).all()

    for task in tasks:
        # New session per task
        with SessionLocal() as db:
            try:
                id = task.id
                userid = task.userid
                title = task.title
                text = task.text
                sources = task.sources
                searches = task.searches
                last_cron = task.last_cron
                last_report = task.last_report
                contact = task.contact

                new_items = main.refresh_data(text, searches, last_cron)
                existing_items = db.query(models.Items).filter(models.Items.taskid == id).all()
                existing_as_tuples = [
                    (item.item_title, item.link, item.site_date, item.text)
                    for item in existing_items
                ]

                all_items = list(new_items) + existing_as_tuples

                contact_hours = {
                    0: 0,
                    1: 12,
                    2: 24,
                    3: 48,
                    4: 72,
                    5: 96,
                    6: 120,
                    7: 168,
                }

                hours = int((datetime.now() - last_report).total_seconds() / 3600)

                enough_time = hours >= contact_hours[contact]
                enough_sources = len(all_items) >= sources

                if enough_sources and enough_time:
                    # Sent the email
                    report = main.create_report(text, all_items, last_report)

                    email = db.query(models.Users).filter(models.Users.userid == userid).first().email

                    send_message(
                        to=email,
                        subject=f"Your report on {title} is waiting for you!",
                        message_text=report
                    )

                    db.query(models.Items).filter(models.Items.taskid == id).delete()

                    # Re-fetch the task in this session before updating
                    db_task = db.query(models.Task).filter(models.Task.id == id).first()
                    db_task.last_report = datetime.utcnow()
                    db_task.reports_sent += 1

                    db_user = db.query(models.Users).filter(models.Users.userid == userid).first()
                    db_user.reports_sent += 1
                    db_user.last_time = datetime.utcnow()
                elif not enough_sources:
                    # Only add items if we don't yet have enough
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

                # If we had enough sources but not enough time, skip adding new items entirely

                db_task = db.query(models.Task).filter(models.Task.id == id).first()
                db_task.last_cron = datetime.utcnow()

                db.commit()
            except:
                db.rollback()
                raise

    return {"detail": "All tasks ran successfully."}

# GET /get_queries - return all tasks
@app.get("/get_queries", response_model=list[TaskResponse])
def get_queries(current_user: models.Users = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Task).filter(models.Task.userid == current_user.userid).all()

# POST /create_query - add a new task
@app.post("/create_query", status_code=201)
async def create_query(request: Request, db: Session = Depends(get_db), current_user: models.Users = Depends(get_current_user)):
    # Be tolerant: parse payload and coerce types so frontend can send simple JSON
    try:
        payload = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    userid = current_user.userid

    title = payload.get("title")
    text = payload.get("text")
    try:
        sources = int(payload.get("sources", 4))
    except Exception:
        sources = 4

    try:
        contact = int(payload.get("contact", 0))
    except Exception:
        contact = 0

    if not title or not text:
        raise HTTPException(status_code=400, detail="'title' and 'text' are required")

    queries = db.query(models.Task).filter(models.Task.userid == userid).all()
    if len(queries) >= 3:
        raise HTTPException(status_code=409, detail="User already has 3 or more tasks; cannot create another.")

    searches = main.create_query(text)
    new_task = models.Task(
        userid=userid,
        title=title,
        text=text,
        sources=sources,
        searches=searches,
        last_cron=datetime.now(),
        last_report=datetime.now(),
        contact=contact,
        reports_sent=0,
    )

    current_user.active_count += 1

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Return the created task object (frontend expects the new item)
    return {
        "id": new_task.id,
        "userid": new_task.userid,
        "title": new_task.title,
        "text": new_task.text,
        "sources": new_task.sources,
        "searches": new_task.searches,
        "contact": new_task.contact,
        "last_cron": new_task.last_cron,
        "last_report": new_task.last_report,
    }

# PUT /update_query/:id - update an existing task
@app.put("/update_query/{id}", status_code=200)
def update_query(id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user: models.Users = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if db_task.userid != current_user.userid:
        raise HTTPException(status_code=403, detail="Not your task")

    if task.title is not None:
        db_task.title = task.title
    if task.text is not None:
        db_task.text = task.text
    if task.sources is not None:
        db_task.sources = task.sources
    if task.contact is not None:
        db_task.contact = task.contact

    db.commit()
    db.refresh(db_task)

    return {
        "id": id,
        "title": db_task.title,
        "text": db_task.text,
        "sources": db_task.sources,
        "contact": db_task.contact,
        "detail": "Task updated successfully."
    }

# DELETE /delete_query/:id - delete a task
@app.delete("/delete_query/{id}", status_code=200)
def delete_query(id: int, db: Session = Depends(get_db), current_user: models.Users = Depends(get_current_user)):
    db_task = db.query(models.Task).filter(models.Task.id == id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if db_task.userid != current_user.userid:
        raise HTTPException(status_code=403, detail="Not your task")
    
    if current_user.active_count > 0:
        current_user.active_count -= 1

    db.delete(db_task)
    db.commit()
    return {"detail": "Task deleted successfully."}