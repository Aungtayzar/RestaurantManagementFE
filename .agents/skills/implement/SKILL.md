---
name: implement
description: 'Implement a piece of work based on a spec or set of tickets.'
disable-model-invocation: true
---

HARD STOP RULE — do NOT run any git write operation on completion. No `git commit`,
no `git push`, no `gh pr create`, and do not create the feature branch yourself.
Leave the working tree modified (or staged) and report the changed file list to the
user. The user decides when and whether to commit/push.

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.
