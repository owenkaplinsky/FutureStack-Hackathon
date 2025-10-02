# Official image has browsers + all system deps
FROM mcr.microsoft.com/playwright/python:v1.49.0-jammy

WORKDIR /app

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# (Browsers are already bundled in this image. This is usually not needed,
# but harmless if you want to force a refresh.)
# RUN playwright install --with-deps chromium

COPY . .

# Make sure Playwright looks in the baked-in path
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Adjust module path below to your FastAPI app entrypoint 
CMD ["uvicorn", "Backend.api:app", "--host", "0.0.0.0", "--port", "10000"]
