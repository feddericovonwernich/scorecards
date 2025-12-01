#!/usr/bin/env python3
"""Check: LICENSE file existence and validity."""
from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Optional, List, Tuple

# Common license file names (case-insensitive)
LICENSE_NAMES: List[str] = [
    'LICENSE', 'LICENSE.txt', 'LICENSE.md',
    'COPYING', 'COPYING.txt'
]

MIN_LICENSE_LENGTH: int = 100


def find_license_file(repo_path: Path) -> Optional[Path]:
    """
    Find license file in repository (case-insensitive).

    Args:
        repo_path: Path to repository root

    Returns:
        Path to license file if found, None otherwise
    """
    for name in LICENSE_NAMES:
        for file in repo_path.glob('*'):
            if file.name.upper() == name.upper():
                return file
    return None


def read_license_content(license_path: Path) -> str:
    """
    Read license file content safely.

    Args:
        license_path: Path to license file

    Returns:
        File content as string
    """
    return license_path.read_text(errors='ignore')


def detect_license_type(content: str) -> str:
    """
    Detect license type from content.

    Args:
        content: License file content

    Returns:
        Detected license type name
    """
    content_upper = content.upper()

    if "MIT LICENSE" in content_upper:
        return "MIT"
    elif "APACHE LICENSE" in content_upper:
        return "Apache"
    elif "GNU GENERAL PUBLIC LICENSE" in content_upper:
        if "VERSION 3" in content_upper:
            return "GPL-3.0"
        elif "VERSION 2" in content_upper:
            return "GPL-2.0"
        else:
            return "GPL"
    elif "BSD LICENSE" in content_upper:
        return "BSD"

    return "Unknown"


def check_license(repo_path: Path) -> Tuple[bool, str]:
    """
    Run license check on repository.

    Args:
        repo_path: Path to repository root

    Returns:
        Tuple of (passed, message)
    """
    license_file = find_license_file(repo_path)

    if license_file is None:
        return False, "No LICENSE file found"

    content = read_license_content(license_file)
    char_count = len(content.strip())

    if char_count < MIN_LICENSE_LENGTH:
        return False, f"LICENSE file found but too short ({char_count} chars, need at least {MIN_LICENSE_LENGTH})"

    license_type = detect_license_type(content)
    return True, f"LICENSE file found: {license_file.name} ({char_count} chars, detected: {license_type})"


def main() -> None:
    """Main entry point."""
    repo_path = Path(os.environ.get('SCORECARD_REPO_PATH', '.'))
    passed, message = check_license(repo_path)

    if passed:
        print(message)
        sys.exit(0)
    else:
        print(message, file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
