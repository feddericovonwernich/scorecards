#!/usr/bin/env python3
"""
Phase 05: Decision Logic for Coverage Improvement Loop
Evaluates stopping conditions and decides whether to continue iterating.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path


def load_history(history_file: str) -> dict:
    """Load iteration history from JSON file."""
    if os.path.exists(history_file):
        try:
            with open(history_file, 'r') as f:
                existing = json.load(f)

            # Convert old format to new format if needed
            if 'workflow_runs' not in existing:
                # Old format: single run with iterations
                # Convert to new format: list of runs
                print(f"Converting old history format to new format")
                return {'workflow_runs': [existing]}

            return existing
        except json.JSONDecodeError as e:
            print(f"WARNING: Malformed history file {history_file}: {e}")
            print("Creating new history structure")

    # Initialize new history structure
    return {'workflow_runs': []}


def get_or_create_run(history: dict, run_id: str) -> dict:
    """Find or create current run entry in history."""
    for run in history['workflow_runs']:
        if run['run_id'] == run_id:
            return run

    # Create new run entry
    new_run = {
        'run_id': run_id,
        'start_time': datetime.now().isoformat(),
        'component': os.environ.get('COMPONENTS', 'backend'),
        'iterations': []
    }
    history['workflow_runs'].append(new_run)
    return new_run


def str_to_bool(value: str | bool) -> bool:
    """Convert string or bool to bool."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes')
    return False


def record_iteration(current_run: dict) -> None:
    """Record this iteration's metrics in history."""
    # Determine TESTS_ADDED from the generation phase
    tests_generated = int(os.environ.get('TESTS_GENERATED', 0))
    tests_added = tests_generated  # All generated tests that passed validation

    # Determine FILES_IMPROVED from priority files
    files_improved = int(os.environ.get('PRIORITY_COUNT', 0))

    iteration_data = {
        'iteration': int(os.environ['LOOP_INDEX']),
        'timestamp': datetime.now().isoformat(),
        'coverage_before': float(os.environ.get('CURRENT_COVERAGE', os.environ.get('BASELINE_COVERAGE', 0))),
        'coverage_after': float(os.environ['NEW_COVERAGE']),
        'coverage_gained': float(os.environ['COVERAGE_IMPROVEMENT']),
        'tests_added': tests_added,
        'files_improved': files_improved,
        'roi': float(os.environ['ROI']),
        'tests_passed': str_to_bool(os.environ['TESTS_PASSED']),
        'no_regression': str_to_bool(os.environ['NO_REGRESSION']),
        'validation_passed': str_to_bool(os.environ.get('VALIDATION_PASSED', 'true')),
        'validated_tests_count': int(os.environ.get('VALIDATED_TESTS_COUNT', 0))
    }

    current_run['iterations'].append(iteration_data)
    print(f"✓ Recorded iteration {iteration_data['iteration']} metrics")


def check_stopping_conditions(current_run: dict) -> tuple[bool, str, str]:
    """
    Check all stopping conditions and return decision.

    Returns:
        (continue_loop, reason, stop_reason_code)
    """
    iterations = current_run['iterations']
    current_iter = iterations[-1]
    loop_index = int(os.environ['LOOP_INDEX'])
    max_iterations = int(os.environ.get('MAX_ITERATIONS', 20))
    min_roi = float(os.environ.get('MIN_ROI', 0.5))
    min_gain = float(os.environ.get('MIN_ITERATION_GAIN', 1.0))

    # Condition 1: Regression detected (BLOCKING - highest priority)
    if not str_to_bool(os.environ.get('NO_REGRESSION', 'true')):
        return (False,
                "Regression detected in existing tests - manual review needed",
                "regression")

    # Condition 2: Max iterations reached
    if loop_index >= max_iterations:
        return (False,
                f"Maximum iterations reached ({max_iterations})",
                "max_iterations")

    # Condition 3: All targets met
    if str_to_bool(os.environ.get('TARGETS_NOW_MET', 'false')):
        final_coverage = float(os.environ['NEW_COVERAGE'])
        return (False,
                f"All coverage targets achieved (final: {final_coverage}%)",
                "targets_achieved")

    # Condition 4: No high-value gaps remaining
    priority_count = int(os.environ.get('PRIORITY_COUNT', 0))
    if priority_count == 0:
        return (False,
                "No more high-value coverage gaps identified",
                "no_gaps_remaining")

    # Condition 5: Diminishing returns (requires 3+ iterations)
    if len(iterations) >= 3:
        recent_iterations = iterations[-3:]
        recent_rois = [it['roi'] for it in recent_iterations]
        avg_recent_roi = sum(recent_rois) / len(recent_rois)

        # Check if ROI is consistently decreasing AND below threshold
        roi_decreasing = all(recent_rois[i] >= recent_rois[i+1]
                            for i in range(len(recent_rois)-1))
        roi_below_threshold = avg_recent_roi < min_roi

        if roi_decreasing and roi_below_threshold:
            return (False,
                    f"Diminishing returns detected (avg ROI: {avg_recent_roi:.3f}% < threshold: {min_roi}%)",
                    "diminishing_returns")

    # Condition 6: Coverage gains too small (requires 3+ iterations)
    if len(iterations) >= 3:
        recent_iterations = iterations[-3:]
        recent_gains = [it['coverage_gained'] for it in recent_iterations]
        avg_recent_gain = sum(recent_gains) / len(recent_gains)

        if avg_recent_gain < min_gain:
            return (False,
                    f"Coverage gains too small (avg: {avg_recent_gain:.1f}% < threshold: {min_gain}%)",
                    "minimal_gains")

    # Condition 7: Test validation warnings (NON-BLOCKING)
    if not str_to_bool(os.environ.get('VALIDATION_PASSED', 'true')):
        validated_count = os.environ.get('VALIDATED_TESTS_COUNT', 'unknown')
        print(f"⚠️  WARNING: Some generated tests still failing after Phase 02.5 fixes")
        print(f"    Validated tests: {validated_count}")
        print(f"    Workflow continues - coverage reflects working tests only")
        # Do NOT exit - this is just a warning

    # Default: Continue
    current_coverage = float(os.environ['NEW_COVERAGE'])
    current_roi = float(os.environ['ROI'])
    coverage_gained = float(os.environ['COVERAGE_IMPROVEMENT'])

    # Build reason based on what targets remain
    target_coverage = float(os.environ.get('TARGET_COVERAGE', 85))
    critical_target = float(os.environ.get('CRITICAL_TIER_TARGET', 90))
    high_risk_target = float(os.environ.get('HIGH_RISK_TIER_TARGET', 80))

    current_critical = float(os.environ.get('NEW_CRITICAL', 0))
    current_high_risk = float(os.environ.get('NEW_HIGH_RISK', 0))

    gaps = []
    if current_coverage < target_coverage:
        gap = target_coverage - current_coverage
        gaps.append(f"Overall {current_coverage:.1f}% < {target_coverage}%")

    if current_critical < critical_target:
        gap = critical_target - current_critical
        gaps.append(f"Critical {current_critical:.1f}% < {critical_target}%")

    if current_high_risk < high_risk_target:
        gap = high_risk_target - current_high_risk
        gaps.append(f"High-risk {current_high_risk:.1f}% < {high_risk_target}%")

    gaps_str = ", ".join(gaps) if gaps else "minor gaps remaining"

    reason = (f"Targets not met: {gaps_str}. "
             f"Good progress (+{coverage_gained:.1f}% this iteration). "
             f"Continue to iteration {loop_index + 1}.")

    return (True, reason, "")


def finalize_run(current_run: dict, stop_reason: str) -> None:
    """Finalize run metadata when exiting loop."""
    iterations = current_run['iterations']
    current_run['end_time'] = datetime.now().isoformat()
    current_run['status'] = 'completed'
    current_run['stopped_reason'] = stop_reason
    current_run['final_coverage'] = float(os.environ['NEW_COVERAGE'])
    current_run['total_iterations'] = int(os.environ['LOOP_INDEX'])
    current_run['total_tests_added'] = sum(it.get('tests_added', 0) for it in iterations)
    current_run['total_coverage_gained'] = sum(it.get('coverage_gained', 0) for it in iterations)
    print(f"✓ Finalized run metadata (status: {stop_reason})")


def save_history(history: dict, history_file: str) -> None:
    """Save history to JSON file."""
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(history_file) or '.', exist_ok=True)

        with open(history_file, 'w') as f:
            json.dump(history, f, indent=2)

        print(f"✓ History updated: {history_file}")
    except Exception as e:
        print(f"⚠️  WARNING: Failed to save history: {e}")
        print("    Continuing workflow (decision parameters still exported)")


def log_decision(continue_loop: bool, reason: str, current_run: dict) -> None:
    """Print decision summary."""
    iteration = current_run['iterations'][-1]

    print("\n" + "=" * 60)
    print(f"ITERATION {os.environ['LOOP_INDEX']} DECISION")
    print("=" * 60)
    print(f"Coverage: {iteration['coverage_after']:.1f}% (gained: +{iteration['coverage_gained']:.1f}%)")
    print(f"ROI: {iteration['roi']:.3f}% per test")
    print(f"Tests passed: {iteration['tests_passed']}")
    print(f"No regression: {iteration['no_regression']}")
    print(f"Validation passed: {iteration.get('validation_passed', True)}")
    print("")
    print(f"Decision: {'CONTINUE' if continue_loop else 'EXIT LOOP'}")
    print(f"Reason: {reason}")
    print("=" * 60)


def main():
    """Execute decision logic."""
    print("Phase 05: Decision Logic")
    print("=" * 60)

    # Step 1: Load history
    history_file = os.environ.get('HISTORY_FILE', '.claude/coverage-improvement-history.json')
    history = load_history(history_file)
    print(f"✓ Loaded history from {history_file}")

    # Step 2: Get or create current run
    run_id = os.environ.get('WORKFLOW_RUN_ID', datetime.now().strftime('%Y%m%d-%H%M%S'))
    current_run = get_or_create_run(history, run_id)
    print(f"✓ Found/created run entry: {run_id}")

    # Step 3: Record this iteration's metrics
    record_iteration(current_run)

    # Step 4: Check stopping conditions
    print("\nEvaluating stopping conditions...")
    continue_loop, reason, stop_reason = check_stopping_conditions(current_run)

    # Step 5: Finalize run if exiting
    if not continue_loop:
        finalize_run(current_run, stop_reason)

    # Step 6: Save history
    save_history(history, history_file)

    # Step 7: Log decision
    log_decision(continue_loop, reason, current_run)

    # Step 8: Export decision parameters
    print("\n" + "=" * 60)
    print("DECISION PARAMETERS")
    print("=" * 60)
    print(f"LOOP_CONTINUE: {str(continue_loop).lower()}")
    print(f'LOOP_REASON: "{reason}"')
    if stop_reason:
        print(f'STOP_REASON: "{stop_reason}"')
    print("=" * 60)

    # Write to output file for easy parsing
    output_file = os.path.join(os.environ.get('RUN_DIR', '.'), 'phase-05-decision-output.txt')
    with open(output_file, 'w') as f:
        f.write(f"LOOP_CONTINUE={str(continue_loop).lower()}\n")
        f.write(f"LOOP_REASON={reason}\n")
        if stop_reason:
            f.write(f"STOP_REASON={stop_reason}\n")

    print(f"\n✓ Decision parameters written to {output_file}")

    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
