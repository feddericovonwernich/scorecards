#!/bin/bash
# Install testing dependencies
set -euo pipefail

echo "Installing testing dependencies..."

# Install Bats (Bash Automated Testing System)
if ! command -v bats >/dev/null 2>&1; then
    echo "Installing Bats..."
    if command -v apt-get >/dev/null 2>&1; then
        # Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y bats
    elif command -v brew >/dev/null 2>&1; then
        # macOS
        brew install bats-core
    else
        # Manual installation
        git clone https://github.com/bats-core/bats-core.git /tmp/bats
        cd /tmp/bats
        sudo ./install.sh /usr/local
        cd -
        rm -rf /tmp/bats
    fi
    echo "Bats installed successfully"
else
    echo "Bats already installed"
fi

# Install shellcheck for linting
if ! command -v shellcheck >/dev/null 2>&1; then
    echo "Installing shellcheck..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get install -y shellcheck
    elif command -v brew >/dev/null 2>&1; then
        brew install shellcheck
    fi
    echo "shellcheck installed successfully"
else
    echo "shellcheck already installed"
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
pip install -r requirements-dev.txt

echo "All testing dependencies installed successfully!"
