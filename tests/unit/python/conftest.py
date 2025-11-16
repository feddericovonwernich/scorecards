"""Pytest configuration and fixtures."""

import pytest
from pathlib import Path
import tempfile
import shutil

@pytest.fixture
def temp_repo():
    """Create a temporary repository directory for testing."""
    temp_dir = tempfile.mkdtemp()
    yield Path(temp_dir)
    shutil.rmtree(temp_dir)

@pytest.fixture
def sample_readme(temp_repo):
    """Create a sample README.md file."""
    readme = temp_repo / "README.md"
    readme.write_text("# Test Repository\\n\\nThis is a test.")
    return readme

@pytest.fixture
def sample_license(temp_repo):
    """Create a sample LICENSE file."""
    license_file = temp_repo / "LICENSE"
    license_file.write_text("MIT License\\n\\nCopyright (c) 2025")
    return license_file
