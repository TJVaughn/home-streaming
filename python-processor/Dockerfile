FROM python:3.11-slim-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libglib2.0-0 libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/python-processor
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py yolov8n.pt ./

CMD ["python3", "main.py"]
