FROM alpine:3.22.1

ARG TARGETARCH
ARG PB_VERSION=0.40.4

RUN apk add --no-cache ca-certificates unzip \
	&& wget -qO /tmp/pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" \
	&& unzip /tmp/pocketbase.zip pocketbase -d /pb \
	&& rm /tmp/pocketbase.zip \
	&& addgroup -S pocketbase \
	&& adduser -S -G pocketbase pocketbase \
	&& mkdir -p /pb/pb_data \
	&& chown -R pocketbase:pocketbase /pb

WORKDIR /pb
USER pocketbase
EXPOSE 8080

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
