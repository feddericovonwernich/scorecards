#!/usr/bin/env python3
"""
Phase 04: Decision - Coverage Improvement Loop
Evaluate stopping conditions and decide whether to continue iterating.
"""

import json
import os
from datetime import datetime
from pathlib import Path

# Load parameters from environment
TARGETS_MET = os.environ.get('TARGETS_MET', 'false').lower() == 'true'
NEW_COVERAGE = float(os.environ.get('NEW_COVERAGE', os.environ.get('CURRENT_STANDARD', '0')))
COVERAGE_GAINED = float(os.environ.get('COVERAGE_GAINED', '0'))
ROI = float(os.environ.get('ROI', '0'))
PRIORITY_COUNT = int(os.environ.get('PRIORITY_COUNT', '0'))
TESTS_PASSED = os.environ.get('TESTS_PASSED', 'true').lower() == 'true'
NO_REGRESSION = os.environ.get('NO_REGRESSION', 'true').lower() == 'true'
LOOP_INDEX = int(os.environ.get('LOOP_INDEX', '1'))
MAX_ITERATIONS = int(os.environ.get('MAX_ITERATIONS', '20'))
MIN_ROI = float(os.environ.get('MIN_ROI', '0.5'))
MIN_ITERATION_GAIN = float(os.environ.get('MIN_ITERATION_GAIN', '1.0'))
HISTORY_FILE = os.environ.get('HISTORY_FILE', '.claude/coverage-improvement-history.json')
RUN_ID = os.environ.get('RUN_ID', datetime.now().strftime('run-%Y%m%d-%H%M%S'))
TIER = os.environ.get('TIER', 'standard')
TARGET_COVERAGE = float(os.environ.get('TARGET_COVERAGE', os.environ.get('STANDARD_TIER_TARGET', '85')))
TESTS_ADDED = int(os.environ.get('TESTS_ADDED', '0'))
FILES_IMPROVED = int(os.environ.get('FILES_IMPROVED', '0'))
CURRENT_COVERAGE = float(os.environ.get('CURRENT_COVERAGE', NEW_COVERAGE))

print("=" * 60)
print("PHASE 04: DECISION")
print("=" * 60)
print(f"Iteration: {LOOP_INDEX}")
print(f"Targets Met: {TARGETS_MET}")
print(f"New Coverage: {NEW_COVERAGE}%")
print(f"Target Coverage: {TARGET_COVERAGE}%")
print(f"Coverage Gained: {COVERAGE_GAINED}%")
print(f"ROI: {ROI}%")
print(f"Priority Files: {PRIORITY_COUNT}")
print(f"Tests Passed: {TESTS_PASSED}")
print(f"No Regression: {NO_REGRESSION}")
print(f"Tier: {TIER}")
print("=" * 60)
print()

# Step 1: Load iteration history
history_path = Path(HISTORY_FILE)
if history_path.exists():
    print(f"Loading history from {HISTORY_FILE}...")
    with open(history_path, 'r') as f:
        history = json.load(f)
else:
    print(f"Creating new history file: {HISTORY_FILE}")
    history = {
        'workflow_runs': []
    }

# Find or create current run entry
current_run = None
for run in history['workflow_runs']:
    if run['run_id'] == RUN_ID:
        current_run = run
        break

if current_run is None:
    print(f"Creating new run entry: {RUN_ID}")
    current_run = {
        'run_id': RUN_ID,
        'start_time': datetime.now().isoformat(),
        'tier': TIER,
        'tier_target': TARGET_COVERAGE,
        'iterations': []
    }
    history['workflow_runs'].append(current_run)
else:
    print(f"Found existing run: {RUN_ID}")

# Step 2: Record this iteration's metrics
print(f"\nRecording iteration {LOOP_INDEX} metrics...")
iteration_data = {
    'iteration': LOOP_INDEX,
    'timestamp': datetime.now().isoformat(),
    'coverage_before': CURRENT_COVERAGE,
    'coverage_after': NEW_COVERAGE,
    'coverage_gained': COVERAGE_GAINED,
    'overall_coverage': float(os.environ.get('OVERALL_COVERAGE', NEW_COVERAGE)),
    'tests_added': TESTS_ADDED,
    'files_improved': FILES_IMPROVED,
    'roi': ROI,
    'tests_passed': TESTS_PASSED,
    'no_regression': NO_REGRESSION,
    'priority_files_remaining': PRIORITY_COUNT,
    'tier_gap': max(0, TARGET_COVERAGE - NEW_COVERAGE)
}

current_run['iterations'].append(iteration_data)

# Step 3: Check stopping conditions
exit_loop = False
LOOP_CONTINUE = True
LOOP_REASON = ""
STOP_REASON = ""

print("\n" + "=" * 60)
print("CHECKING STOPPING CONDITIONS")
print("=" * 60)

# Condition 1: All Targets Met ✅
print("\n[1] Checking: All targets met...")
print(f"    TARGETS_MET = {TARGETS_MET}")
print(f"    Current Coverage: {NEW_COVERAGE}%")
print(f"    Target Coverage: {TARGET_COVERAGE}%")
if TARGETS_MET:
    print(f"    ✅ Standard tier ({NEW_COVERAGE}%) exceeds target ({TARGET_COVERAGE}%)")
    LOOP_CONTINUE = False
    LOOP_REASON = f"All coverage targets achieved ({TIER} tier: {NEW_COVERAGE}% >= {TARGET_COVERAGE}%)"
    STOP_REASON = "targets_achieved"
    exit_loop = True
else:
    print(f"    ⏭️  Targets not yet met - checking other conditions")

# Condition 2: Regression Detected ❌ (BLOCKING)
if not exit_loop:
    print("\n[2] Checking: Regression detected...")
    print(f"    NO_REGRESSION = {NO_REGRESSION}")
    if not NO_REGRESSION:
        print("    ❌ REGRESSION DETECTED - Existing tests broke!")
        LOOP_CONTINUE = False
        LOOP_REASON = "Regression detected in existing tests - manual review needed"
        STOP_REASON = "regression"
        exit_loop = True
    else:
        print("    ✅ No regression - existing tests still pass")

# Condition 3: Max Iterations Reached 🛑
if not exit_loop:
    print("\n[3] Checking: Max iterations reached...")
    print(f"    Current iteration: {LOOP_INDEX}")
    print(f"    Max iterations: {MAX_ITERATIONS}")
    if LOOP_INDEX >= MAX_ITERATIONS:
        print(f"    🛑 Max iterations reached!")
        LOOP_CONTINUE = False
        LOOP_REASON = f"Maximum iterations reached ({MAX_ITERATIONS})"
        STOP_REASON = "max_iterations"
        exit_loop = True
    else:
        print(f"    ⏭️  Still within limit ({LOOP_INDEX}/{MAX_ITERATIONS})")

# Condition 4: Diminishing Returns Detected ⚠️
if not exit_loop and len(current_run['iterations']) >= 3:
    print("\n[4] Checking: Diminishing returns...")
    recent_iterations = current_run['iterations'][-3:]
    recent_rois = [it['roi'] for it in recent_iterations]
    avg_recent_roi = sum(recent_rois) / len(recent_rois)

    print(f"    Recent ROIs: {[f'{r:.3f}' for r in recent_rois]}")
    print(f"    Average recent ROI: {avg_recent_roi:.3f}")
    print(f"    Minimum ROI threshold: {MIN_ROI}")

    roi_decreasing = all(recent_rois[i] >= recent_rois[i+1] for i in range(len(recent_rois)-1))
    roi_below_threshold = avg_recent_roi < MIN_ROI

    print(f"    ROI decreasing: {roi_decreasing}")
    print(f"    ROI below threshold: {roi_below_threshold}")

    if roi_decreasing and roi_below_threshold:
        print(f"    ⚠️  Diminishing returns detected!")
        LOOP_CONTINUE = False
        LOOP_REASON = f"Diminishing returns detected (avg ROI: {avg_recent_roi:.3f} < threshold: {MIN_ROI})"
        STOP_REASON = "diminishing_returns"
        exit_loop = True
    else:
        print("    ⏭️  ROI still healthy")
elif not exit_loop:
    print("\n[4] Checking: Diminishing returns...")
    print(f"    ⏭️  Need 3+ iterations to evaluate (current: {len(current_run['iterations'])})")

# Condition 5: Coverage Gain Too Small ⚠️
if not exit_loop and len(current_run['iterations']) >= 3:
    print("\n[5] Checking: Coverage gains too small...")
    recent_iterations = current_run['iterations'][-3:]
    recent_gains = [it['coverage_gained'] for it in recent_iterations]
    avg_recent_gain = sum(recent_gains) / len(recent_gains)

    print(f"    Recent gains: {[f'{g:.1f}' for g in recent_gains]}%")
    print(f"    Average recent gain: {avg_recent_gain:.1f}%")
    print(f"    Minimum gain threshold: {MIN_ITERATION_GAIN}%")

    if avg_recent_gain < MIN_ITERATION_GAIN:
        print(f"    ⚠️  Coverage gains too small!")
        LOOP_CONTINUE = False
        LOOP_REASON = f"Coverage gains too small (avg: {avg_recent_gain:.1f}% < threshold: {MIN_ITERATION_GAIN}%)"
        STOP_REASON = "minimal_gains"
        exit_loop = True
    else:
        print("    ⏭️  Coverage gains still meaningful")
elif not exit_loop:
    print("\n[5] Checking: Coverage gains too small...")
    print(f"    ⏭️  Need 3+ iterations to evaluate (current: {len(current_run['iterations'])})")

# Condition 6: No High-Value Gaps Remaining 📊
if not exit_loop:
    print("\n[6] Checking: High-value gaps remaining...")
    print(f"    Priority files identified: {PRIORITY_COUNT}")
    if PRIORITY_COUNT == 0:
        print("    📊 No more high-value coverage gaps!")
        LOOP_CONTINUE = False
        LOOP_REASON = "No more high-value coverage gaps identified"
        STOP_REASON = "no_gaps_remaining"
        exit_loop = True
    else:
        print(f"    ⏭️  Still {PRIORITY_COUNT} priority files to improve")

# Condition 7: Test Failures (WARNING ONLY)
if not exit_loop:
    print("\n[7] Checking: Test failures (WARNING ONLY)...")
    print(f"    TESTS_PASSED = {TESTS_PASSED}")
    if not TESTS_PASSED:
        print("    ⚠️  WARNING: Some tests failing (but workflow continues)")
        print("    Phase 02.5 should have handled fixable tests")
        print("    Coverage measurement reflects working tests only")
    else:
        print("    ✅ All tests passing")

# Step 4: Default Decision (Continue)
if not exit_loop:
    print("\n[DEFAULT] No stopping conditions met - continuing...")
    LOOP_CONTINUE = True
    LOOP_REASON = f"Targets not met ({NEW_COVERAGE}% < {TARGET_COVERAGE}%) and conditions healthy - continuing"
    STOP_REASON = ""

# Step 5: Update History with Decision
if not LOOP_CONTINUE:
    print("\n" + "=" * 60)
    print("FINALIZING RUN")
    print("=" * 60)
    current_run['end_time'] = datetime.now().isoformat()
    current_run['status'] = 'completed'
    current_run['stopped_reason'] = STOP_REASON
    current_run['final_coverage'] = float(os.environ.get('OVERALL_COVERAGE', NEW_COVERAGE))
    current_run['final_tier_coverage'] = NEW_COVERAGE
    current_run['total_iterations'] = LOOP_INDEX
    current_run['total_tests_added'] = sum(it.get('tests_added', 0) for it in current_run['iterations'])
    current_run['total_coverage_gained'] = sum(it.get('coverage_gained', 0) for it in current_run['iterations'])

    print(f"Run completed: {RUN_ID}")
    print(f"Total iterations: {current_run['total_iterations']}")
    print(f"Total tests added: {current_run['total_tests_added']}")
    print(f"Total coverage gained: {current_run['total_coverage_gained']:.1f}%")
    print(f"Final coverage ({TIER} tier): {NEW_COVERAGE}%")

# Step 6: Write Updated History to File
print(f"\n{'=' * 60}")
print("SAVING HISTORY")
print("=" * 60)
history_path.parent.mkdir(parents=True, exist_ok=True)
with open(history_path, 'w') as f:
    json.dump(history, f, indent=2)
print(f"History saved to: {HISTORY_FILE}")

# Step 7: Log Decision
print(f"\n{'=' * 60}")
print(f"ITERATION {LOOP_INDEX} DECISION")
print("=" * 60)
print(f"Coverage ({TIER} tier): {NEW_COVERAGE}% (target: {TARGET_COVERAGE}%)")
print(f"Coverage gained: {COVERAGE_GAINED}%")
print(f"ROI: {ROI}% per test")
print(f"Tests passed: {TESTS_PASSED}")
print(f"No regression: {NO_REGRESSION}")
print(f"Priority files remaining: {PRIORITY_COUNT}")
print()
print(f"Decision: {'CONTINUE' if LOOP_CONTINUE else 'EXIT LOOP'}")
print(f"Reason: {LOOP_REASON}")
if STOP_REASON:
    print(f"Stop reason: {STOP_REASON}")
print("=" * 60)

# Step 8: Export Decision Parameters
print(f"\n{'=' * 60}")
print("DISCOVERED PARAMETERS")
print("=" * 60)
print(f"LOOP_CONTINUE: {str(LOOP_CONTINUE).lower()}")
print(f"LOOP_REASON: {LOOP_REASON}")
print(f"STOP_REASON: {STOP_REASON}")
print("=" * 60)

# Write to a file for easy parsing
output_file = Path('.claude/workflows/coverage-improvement-loop/phase-04-output.txt')
output_file.parent.mkdir(parents=True, exist_ok=True)
with open(output_file, 'w') as f:
    f.write(f"LOOP_CONTINUE={str(LOOP_CONTINUE).lower()}\n")
    f.write(f"LOOP_REASON={LOOP_REASON}\n")
    f.write(f"STOP_REASON={STOP_REASON}\n")

print(f"\nOutput written to: {output_file}")
print("\n✅ Phase 04 completed successfully")
