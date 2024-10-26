FROM python:3.11-buster
ENV PYTHONUNBUFFERED=1

WORKDIR /lectopt/back
COPY . /lectopt/back/

RUN pip install -r requirements.txt

CMD ["uvicorn", "main:app","--reload","--host","0.0.0.0","--port","8080"]