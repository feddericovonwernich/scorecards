"""Tests for the license check."""

import pytest
from pathlib import Path
import os
import sys

def test_license_file_names():
    """Test that license file names are correctly defined."""
    # This is a simple example test
    license_names = ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'COPYING', 'COPYING.txt']
    assert len(license_names) == 5
    assert 'LICENSE' in license_names
    assert 'LICENSE.md' in license_names

def test_temp_repo_fixture(temp_repo):
    """Test that temp_repo fixture creates a directory."""
    assert temp_repo.exists()
    assert temp_repo.is_dir()

def test_sample_license_fixture(sample_license):
    """Test that sample_license fixture creates a file."""
    assert sample_license.exists()
    assert sample_license.is_file()
    content = sample_license.read_text()
    assert "MIT License" in content
