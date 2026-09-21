# Scorecard Runner - Multi-runtime environment for executing checks
FROM node:20.20.2-bookworm@sha256:8f693eaa7e0a8e71560c9a82b55fd54c2ae920a2ba5d2cde28bac7d1c01c9ba5 AS node
FROM ubuntu:22.04@sha256:b8b6ee6aa931ecd9d0d952abc34dc0e5f7c6a30c6bb71b079fe399fde0329c02

LABEL org.opencontainers.image.source="https://github.com/feddericovonwernich/scorecards"

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Bootstrap snapshot HTTPS from the pinned stage before Ubuntu installs its own CAs.
COPY --from=node /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

# Signed, dated archive fixes apt's entire dependency closure, not just direct packages.
# No fallback to the live archive: snapshot expiry/unavailability must fail the build.
RUN snapshot=20260921T000000Z \
    && printf 'deb https://snapshot.ubuntu.com/ubuntu/%s %s main restricted universe multiverse\n' \
    "$snapshot" jammy "$snapshot" jammy-updates "$snapshot" jammy-security \
    > /etc/apt/sources.list \
    && apt-get update --error-on=any && apt-get install -y \
    # Base tools
    curl \
    wget \
    git \
    jq \
    ca-certificates \
    gnupg \
    # Shell tools
    bash \
    grep \
    sed \
    gawk \
    findutils \
    coreutils \
    # Python runtime
    python3 \
    python3-pip \
    python3-venv \
    # Build tools (for some checks that might need compilation)
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Official Node binaries and npm, verified by the image digest; no remote installer.
COPY --from=node /usr/local/ /usr/local/

# Create symlinks for common aliases
RUN ln -s /usr/bin/python3 /usr/bin/python

# Keep the runtime dependency closure separate from frontend development packages.
COPY package.json package-lock.json /action/

# Install npm packages locally (required for ES module resolution)
RUN cd /action && \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund && \
    npm cache clean --force

# Set NODE_PATH so ES modules can find packages in /action/node_modules
ENV NODE_PATH=/action/node_modules

# Set working directory
WORKDIR /scorecard

# Copy utility scripts
COPY utils/ /scorecard/utils/

# Copy library files for checks
COPY lib/ /action/lib/

# Remediation descriptor validation uses the same policy as the trusted action.
COPY config/ /action/config/
RUN chmod -R a-w /action/config

# Create /checks directory and symlink node_modules for ES module resolution
# This is necessary because ES modules don't respect NODE_PATH
RUN mkdir -p /checks && ln -s /action/node_modules /checks/node_modules

# Make all scripts executable
RUN chmod +x /scorecard/utils/*.sh

# Set the entrypoint to the check runner
ENTRYPOINT ["/scorecard/utils/run-checks.sh"]
