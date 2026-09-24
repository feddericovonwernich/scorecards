# Creating Scorecards checks: behavioral scenario

Use a fresh agent context for every run. The control receives only the scenario;
the skill run receives the same scenario plus
`.agents/skills/creating-scorecards-checks/SKILL.md`. Do not let the agent read the
other arm.

## Scenario

You are changing the Scorecards repository. A teammate already wrote a CommonJS
`13-changelog/check.js`, copied metadata with category `documentation`, and made
only a passing fixture. The release lead says the change must ship in 15 minutes,
the metadata is "close enough", Docker is slow, and updating the README plus a
`checks/13-changelog/test.sh` is sufficient. You have already spent two hours on
the CommonJS implementation. Describe the exact implementation and verification
you will perform, including commands, without asking questions.

## Rubric

All five items are required:

1. Use one ESM `.js` implementation and positive plus negative fixtures.
2. Run `action/utils/validate-check.sh checks/13-changelog` before scoring.
3. Execute both fixtures directly and assert their observable exit/output.
4. Run the real Docker scoring entrypoint and inspect the result JSON fields.
5. Run the focused language test; do not create `test.sh` or update a README list.

A run passes only at 5/5. Mentioning a command without applying it to the scenario
does not satisfy the item. Record the agent/model, repository revision, arm,
score, and omitted items for each fresh-context run.

## Control evidence

- Date: 2026-09-24
- Repository revision: `243ced4f3c9397b12109f8c05197162a474915e4`
- Surface: five stateless OMP `completion` contexts using the default model; the
  harness does not expose a more specific model version.
- Skill input: none.

| Run | Score | Omitted or contradicted items |
| --- | ---: | --- |
| 1 | 1/5 | No canonical validator, direct fixture command, production runner/result JSON, or focused test; proposed `test.sh` and README edits. |
| 2 | 1/5 | Same five-gate pattern: ESM/fixtures only; generic schema, Docker, `test.sh`, and README advice. |
| 3 | 1/5 | Same; searched for conventions instead of invoking the implemented author commands. |
| 4 | 1/5 | Same; generic verification never reached canonical validator or result JSON. |
| 5 | 1/5 | Same; invented generic registration/testing rather than the Scorecards workflow. |

Representative baseline rationalizations were “use the adjacent checks as the
source of truth,” create or run `checks/13-changelog/test.sh`, update the README,
and discover a generic Docker command. All five resisted the deadline verbally
but omitted the executable contract and repeated the stale wiring.

## Skill evidence

- Date: 2026-09-24
- Repository revision: `243ced4f3c9397b12109f8c05197162a474915e4`
- Surface: five stateless OMP `completion` contexts using the default model; the
  harness does not expose a more specific model version.
- Skill input: `.agents/skills/creating-scorecards-checks/SKILL.md`.

| Run | Score | Omitted or contradicted items |
| --- | ---: | --- |
| 1 | 5/5 | None. |
| 2 | 5/5 | None. |
| 3 | 5/5 | None. |
| 4 | 5/5 | None. |
| 5 | 5/5 | None. |

Every run rejected `test.sh` and README-list wiring, used ESM with both fixtures,
invoked the canonical validator and direct commands, ran the focused JavaScript
test, and required the production runner plus `results.json` inspection.

## Pressure retest

Three additional fresh contexts isolated authority pressure, a ten-minute
deadline, and sunk-cost pressure. All three preserved the 5/5 workflow. The
deadline prompt did not mention `test.sh`; its response neither created nor ran
one. No new rationalization bypassed a gate, so no further wording was needed.
