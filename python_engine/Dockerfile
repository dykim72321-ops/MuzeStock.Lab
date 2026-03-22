# 베이스 이미지
FROM python:3.10-slim

# 시스템 의존성 설치 (Pandas, TA 등의 빌드를 위해 필요)
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리
WORKDIR /app

# 파이썬 환경 변수 설정 (버퍼링 없이 로그 즉시 출력)
ENV PYTHONUNBUFFERED=1

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# FastAPI 포트 노출
EXPOSE 8000

# 서버 실행 (외부 접속을 위해 host를 0.0.0.0으로 지정)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
