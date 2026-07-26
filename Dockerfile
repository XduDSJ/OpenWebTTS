FROM docker.io/library/python:3.11-slim-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
  gcc \
  g++ \
  libwebkit2gtk-4.0-37 \
  libgirepository1.0-dev \
  libcairo2-dev \
  ffmpeg \
  pkg-config \
  espeak-ng \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# 第一步：从 PyTorch 官方 CPU 索引预装 torch + torchaudio
# 避免后续 pip 从 PyPI 拉取带 CUDA 库的版本（约 2-3GB），CPU 推理无需 CUDA
# 预装后 pip 发现 torch 已满足版本要求会跳过，openai-whisper / coqui-tts / kokoro 共用此 torch
RUN pip install --no-cache-dir \
    torch \
    torchaudio \
    --index-url https://download.pytorch.org/whl/cpu

# 第二步：安装其余 Python 依赖（torch 已满足，pip 跳过，不会重复拉 CUDA 版）
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install https://github.com/KittenML/KittenTTS/releases/download/0.1/kittentts-0.1.0-py3-none-any.whl
RUN pip install https://github.com/rsxdalv/chatterbox/releases/download/v0.4.4/tts_webui_chatterbox_tts-0.4.4-py3-none-any.whl

# 前端构建产物（static/css/style.css、static/js/*、static/icons/）已提交到仓库
# 无需在容器内执行 npm install / npm run build，基础镜像无需 Node.js

# Copy application code
COPY . .

# Create directories for models and audio
RUN mkdir -p models/coqui models/piper models/kokoro static/audio static/audio_cache

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Run the application
CMD ["python", "app.py", "--host", "0.0.0.0", "--port", "8000"]








