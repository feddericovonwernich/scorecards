# Scorecard Runner - Multi-runtime environment for executing checks
FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install base tools and runtimes
RUN apt-get update && apt-get install -y \
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

# Install Node.js LTS (v20)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create symlinks for common aliases
RUN ln -s /usr/bin/python3 /usr/bin/python

# Copy package.json and install Node.js dependencies locally
COPY package.json /action/package.json

# Install npm packages locally (required for ES module resolution)
RUN cd /action && \
    npm install --omit=dev && \
    npm cache clean --force

# Set NODE_PATH so ES modules can find packages in /action/node_modules
ENV NODE_PATH=/action/node_modules

# Set working directory
WORKDIR /scorecard

# Copy utility scripts
COPY utils/ /scorecard/utils/

# Copy library files for checks
COPY lib/ /action/lib/

# Create /checks directory and symlink node_modules for ES module resolution
# This is necessary because ES modules don't respect NODE_PATH
RUN mkdir -p /checks && ln -s /action/node_modules /checks/node_modules

# Make all scripts executable
RUN chmod +x /scorecard/utils/*.sh

# Set the entrypoint to the check runner
ENTRYPOINT ["/scorecard/utils/run-checks.sh"]
