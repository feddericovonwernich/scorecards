#!/usr/bin/env python3
"""
Check 02: LICENSE File Existence and Quality

This module implements the LICENSE file quality check for Scorecards.
It validates that a LICENSE file exists in the repository root and contains
meaningful content, ensuring projects have proper legal documentation.

Pass criteria:
    - LICENSE file exists in repository root (case-insensitive)
    - Accepted filenames: LICENSE, LICENSE.txt, LICENSE.md, COPYING, COPYING.txt
    - LICENSE contains at least 100 characters of content
    - License type is detected if possible (MIT, Apache, GPL, BSD, etc.)

Environment Variables:
    SCORECARD_REPO_PATH: Path to repository being checked (default: current dir)

Exit Codes:
    0: Check passed (LICENSE exists with sufficient content)
    1: Check failed (LICENSE missing or too short)

Outputs:
    Success message to stdout with detected license type
    Error messages to stderr

Example:
    $ SCORECARD_REPO_PATH=/path/to/repo python3 check.py
    LICENSE file found: LICENSE (1090 chars, detected: MIT)

Detected License Types:
    - MIT
    - Apache
    - GPL-2.0, GPL-3.0, GPL (unversioned)
    - BSD
    - Unknown (if no pattern match)
"""
import os
import sys
from pathlib import Path

repo_path = Path(os.environ.get('SCORECARD_REPO_PATH', '.'))

# Common license file names (case-insensitive)
license_names = ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'COPYING', 'COPYING.txt']

license_file = None
for name in license_names:
    # Check case-insensitive
    for file in repo_path.glob('*'):
        if file.name.upper() == name.upper():
            license_file = file
            break
    if license_file:
        break

if not license_file:
    print("No LICENSE file found", file=sys.stderr)
    sys.exit(1)

# Check that license has content (at least 100 characters)
content = license_file.read_text(errors='ignore')
char_count = len(content.strip())

if char_count < 100:
    print(f"LICENSE file found but too short ({char_count} chars, need at least 100)", file=sys.stderr)
    sys.exit(1)

# Try to detect common licenses
license_type = "Unknown"
content_upper = content.upper()
if "MIT LICENSE" in content_upper:
    license_type = "MIT"
elif "APACHE LICENSE" in content_upper:
    license_type = "Apache"
elif "GNU GENERAL PUBLIC LICENSE" in content_upper:
    if "VERSION 3" in content_upper:
        license_type = "GPL-3.0"
    elif "VERSION 2" in content_upper:
        license_type = "GPL-2.0"
    else:
        license_type = "GPL"
elif "BSD LICENSE" in content_upper:
    license_type = "BSD"

print(f"LICENSE file found: {license_file.name} ({char_count} chars, detected: {license_type})")
sys.exit(0)
