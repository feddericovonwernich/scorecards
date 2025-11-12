#!/usr/bin/env python3
"""Check: LICENSE file existence"""
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
