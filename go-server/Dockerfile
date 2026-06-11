FROM golang:1.21-bookworm AS builder
WORKDIR /build
COPY go.mod go.sum ./
COPY main.go ./
RUN CGO_ENABLED=0 go build -o /out/main .

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/go-server
COPY --from=builder /out/main ./main
COPY mediamtx ./mediamtx
COPY mediamtx.yml ./mediamtx.yml
RUN chmod +x ./main ./mediamtx

CMD ["./main"]
