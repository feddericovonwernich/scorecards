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

# Copy package.json to install Node.js dependencies
COPY package.json /tmp/package.json

# Install global npm packages from package.json
RUN cd /tmp && \
    npm install -g $(node -e "const pkg = require('/tmp/package.json'); console.log(Object.keys(pkg.dependencies).map(dep => dep + '@' + pkg.dependencies[dep].replace('^', '')).join(' '))") && \
    npm cache clean --force && \
    rm /tmp/package.json

# Set NODE_PATH so Node can find globally installed modules
ENV NODE_PATH=/usr/lib/node_modules

# Set working directory
WORKDIR /scorecard

# Copy utility scripts
COPY utils/ /scorecard/utils/

# Copy library files for checks
COPY lib/ /action/lib/

# Make all scripts executable
RUN chmod +x /scorecard/utils/*.sh

# Set the entrypoint to the check runner
ENTRYPOINT ["/scorecard/utils/run-checks.sh"]
