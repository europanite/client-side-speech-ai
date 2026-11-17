FROM node:24-bookworm-slim
ENV ONNXRUNTIME_NODE_INSTALL_CUDA=skip

WORKDIR /app
COPY app/package*.json ./
RUN npm ci
COPY . .
