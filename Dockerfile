FROM nginxinc/nginx-unprivileged:1.27-alpine

LABEL org.opencontainers.image.title="MetaboBrief"
LABEL org.opencontainers.image.description="Static local-first SNP pathway scoring app"
LABEL org.opencontainers.image.source="https://github.com/otcan/metabo-brief"
LABEL org.opencontainers.image.licenses="MIT"

COPY --chown=101:101 --chmod=0644 nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY --chown=101:101 *.html ./
COPY --chown=101:101 README.md CHANGELOG.md CONTRIBUTING.md LICENSE SECURITY.md package.json ./
COPY --chown=101:101 analyzer ./analyzer
COPY --chown=101:101 assets ./assets
COPY --chown=101:101 css ./css
COPY --chown=101:101 data ./data
COPY --chown=101:101 docs ./docs
COPY --chown=101:101 examples ./examples
COPY --chown=101:101 js ./js
COPY --chown=101:101 models ./models

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:8080/healthz | grep -q '^ok$'
