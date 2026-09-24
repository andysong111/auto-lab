# Build only trusted Factory code. Candidate files are supplied read-only at runtime.
FROM mcr.microsoft.com/playwright:v1.55.0-noble
WORKDIR /opt/factory
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY qa ./qa
RUN chmod -R a+rX /opt/factory/qa
COPY orchestrator ./orchestrator
COPY schema ./schema
COPY policies ./policies
COPY isolation/entry.cjs isolation/probe.cjs ./isolation/
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENTRYPOINT ["node", "/opt/factory/isolation/entry.cjs"]
