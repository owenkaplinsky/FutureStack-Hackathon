from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from email.mime.text import MIMEText
import base64
import os

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDS_PATH = os.path.join(os.path.dirname(BASE_DIR), "credentials.json")
TOKEN_PATH = os.path.join(os.path.dirname(BASE_DIR), "token.json")

def get_gmail_service():
    creds = None
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())

    if not creds or not creds.valid:
        raise Exception("No valid Gmail credentials. token.json missing or invalid.")

    return build('gmail', 'v1', credentials=creds)


def send_message(to, subject, message_text, sender="me"):
    service = get_gmail_service()
    message = MIMEText(message_text, "html")
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    body = {'raw': raw}

    return service.users().messages().send(userId="me", body=body).execute()