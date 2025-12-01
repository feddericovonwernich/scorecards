#!/usr/bin/env python3
"""Check: CODEOWNERS file existence and validity."""
from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Optional, List, Tuple

# Valid CODEOWNERS locations (GitHub standard)
CODEOWNERS_LOCATIONS: List[str] = [
    'CODEOWNERS',
    '.github/CODEOWNERS',
    'docs/CODEOWNERS'
]


def find_codeowners_file(repo_path: Path) -> Optional[Path]:
    """
    Find CODEOWNERS file in standard locations.

    Args:
        repo_path: Path to repository root

    Returns:
        Path to CODEOWNERS file if found, None otherwise
    """
    for location in CODEOWNERS_LOCATIONS:
        file_path = repo_path / location
        if file_path.exists() and file_path.is_file():
            return file_path
    return None


def count_ownership_rules(content: str) -> int:
    """
    Count non-empty, non-comment lines (actual ownership rules).

    Args:
        content: CODEOWNERS file content

    Returns:
        Number of ownership rules found
    """
    rule_count = 0
    for line in content.splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith('#'):
            rule_count += 1
    return rule_count


def check_codeowners(repo_path: Path) -> Tuple[bool, str]:
    """
    Run CODEOWNERS check on repository.

    Args:
        repo_path: Path to repository root

    Returns:
        Tuple of (passed, message)
    """
    codeowners_file = find_codeowners_file(repo_path)

    if codeowners_file is None:
        return False, "No CODEOWNERS file found\nExpected locations: CODEOWNERS, .github/CODEOWNERS, or docs/CODEOWNERS"

    content = codeowners_file.read_text(errors='ignore')
    rule_count = count_ownership_rules(content)

    if rule_count == 0:
        relative_path = codeowners_file.relative_to(repo_path)
        return False, f"CODEOWNERS file found at {relative_path} but contains no ownership rules\nAdd at least one ownership rule (e.g., '* @team-name')"

    relative_path = codeowners_file.relative_to(repo_path)
    plural = 's' if rule_count != 1 else ''
    return True, f"CODEOWNERS file found: {relative_path} ({rule_count} ownership rule{plural})"


def main() -> None:
    """Main entry point."""
    repo_path = Path(os.environ.get('SCORECARD_REPO_PATH', '.'))
    passed, message = check_codeowners(repo_path)

    if passed:
        print(message)
        sys.exit(0)
    else:
        print(message, file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
