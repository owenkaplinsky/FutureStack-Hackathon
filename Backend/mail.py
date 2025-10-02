from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from email.mime.text import MIMEText
import base64
import os
import json

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def get_gmail_service():
    creds = None

    # Load token.json contents from env var
    token_json = os.getenv("GOOGLE_TOKEN_JSON")

    if token_json:
        creds = Credentials.from_authorized_user_info(json.loads(token_json), SCOPES)

    # Refresh expired creds if possible
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        os.environ["GOOGLE_TOKEN_JSON"] = creds.to_json()  # update in memory (Render has no writable disk)

    if not creds or not creds.valid:
        raise Exception("No valid Gmail credentials. GOOGLE_TOKEN_JSON missing or invalid.")

    return build("gmail", "v1", credentials=creds)


def send_message(to, subject, message_text, sender="me"):
    service = get_gmail_service()
    message = MIMEText(message_text, "html")
    message["to"] = to
    message["from"] = sender
    message["subject"] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    body = {"raw": raw}

    return service.users().messages().send(userId="me", body=body).execute()