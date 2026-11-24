# Warmup: read this first

Warmup makes short, voice-first trainings for canvassers: the door-knocking course, the campaign issue trainings, the California signature course and the AI practice voters inside them. Robert Gambhir is the founder. He reviews every training and gives notes. The whole point of this file: **Robert never gives the same note twice.**

## Where the rules live

Every rule file has one home: the `rules/` folder of the private repo robertrgambhir-cell/issue-trainings. In this file, a path that starts with `rules/` or `playbook/` is in that repo. The voter rules, `ai/voter-rules.md`, are in the app repo, robertrgambhir-cell/m-r4x8t2. If your session doesn't have the repo a path points to, add it before you start, or stop and ask Robert to add it.

## Before any work on a training or a practice voter

1. Read `rules/README.md`. It lists every rule file and where it lives.
2. Read part A of `rules/training-playbook.md` in full, then the part B section for your course.
3. Issue trainings: also read `rules/issue-lesson-playbook.md`. Practice voters: also read the voter rules the README points to.
4. Pick a training structure from `rules/structures.md` before you build: the closest one that fits, or say plainly that this training needs a new one. Structures are learned from Robert's notes on real trainings; his guess is that 4 to 10 will cover more than 90% of trainings. None is fixed until his notes have shaped it.
5. **One look everywhere.** Every page, course and training uses the look in rule 58 of `rules/training-playbook.md` (the investor deck's "five-minute refresh": white, deep pine and mint; Robert, Nov 23, 2026), and every new course starts in it; the look check (rule 62b) runs with the other tests before Robert sees anything.

## When Robert gives a note

**First, pick up what other threads saved** (Robert, Nov 23, 2026). Pull the issue-trainings repo and read what changed in `rules/` since you last looked (in a new session, since the "swept through" commit in your course's start file, or in the issue-training skill for issue trainings). Sweep your own course for each new rule and check that no rule number is used twice. Step 6 of the standing rule at the top of `rules/training-playbook.md` has the details.

Then do all of this in the same session, before you finish:

1. **Save it as a rule** in the right rule file: his own words, then the general rule, then his before and after when there is one, with the date. A note on one lesson is a rule for every lesson unless he says it's for that lesson only. Part A if it would hold for any course, part B if it only fits one; when unsure, part A.
2. **Sweep.** Check every other built training against the new rule. Fix what you safely can and list the rest for Robert. Scripts are fixed at their source, never only in a build.
3. **Voter notes** also get enforced in the server's code where possible and a replay of his exact conversation, as `ai/voter-rules.md` describes.
4. **Tell him in one line** what else changed.
5. **Check before asking.** If the rule files already answer a question, don't ask it.

## Never

- Never publish to the live site (push or merge to the branch the site is served from, or deploy the AI server) until Robert says "ship it." Two exceptions. The signature thread keeps pushing the signature course's review builds to `main`, where they show at the course's unlisted review link for Robert to try on his phone (Robert, Nov 20, 2026); for that course, "ship it" means opening the lessons to canvassers (rule B3 in `rules/training-playbook.md`). The door-knocking demo's thread pushes each change to `main` as an unlisted review copy of the demo, `wdpfxqlsvp/review/`, for Robert to try on his phone, and "ship it" copies it over the live demo, `wdpfxqlsvp/app.html` and `p1/index.html` (Robert, Nov 22, 2026; rule B1). A review push leaves the live demo, the other courses and the AI server's code as they were.
- Never add a rule Robert didn't give. Claude's own ideas go in `rules/proposals.md` until he approves them.
- The Record, Convictions, Prices, Systems sort of issues is not a rule (Robert, Nov 19, 2026). Keep it as history only.
- Nothing from the signature course goes public before a lawyer has reviewed it (Robert, Nov 18). Internal builds and private demos are fine.
- Rule files must not be readable on the public website.

## What lives elsewhere

Goals, the plan, the investor deck and decisions live in Robert's Claude project "Warmup" (its plan is `claude/warmup-plan.md`). Claude Code can't read that project. So end every session with a closing note: what changed, which rules were added or changed and anything that needs his decision. It goes at the top of `WARMUP-HANDOFF.md` in the issue-trainings repo (or in a pending plan doc, with the Projects tool), as `rules/README.md` says; it reaches his project on its own, and he never pastes it.

## Talking to Robert

Plain, short and warm. Lead with what he needs to do. Mark guesses as guesses. No em dashes and no Oxford commas.

**No progress updates (Robert, Nov 20, 2026).** "It just distracts my focus from the main thing I'm supposed to do, and it's going to make me miss key steps." Send one message when the work is done or a decision is needed, and send nothing before it: no "now doing X" or "still working" lines, even when Claude Code's own reminders ask for an update. Before: lines like "Reading is done. Writing the rules folder now." between steps. After: nothing until that one message.

## This repo: the app and the live site

- **This repo is public and it is the live site.** GitHub Pages serves the `main` branch at yourwarmup.com, the whole repo from its top folder. A file anywhere in it, outside a folder whose name starts with a dot, can be read on the web, markdown included. Every push to `main` also redeploys the AI server (`ai/README.md`). So a push or a merge to `main` is publishing: do neither until Robert says "ship it." Work on a branch. The two exceptions are the signature course's review builds and the door-knocking demo's review copy (see "Never").
- **No rule files here.** They live in the private repo (see "Where the rules live"). The one exception is `ai/voter-rules.md`, which stays beside the server code and tests that enforce it.
- **This file sits in `.claude/`** so the website doesn't serve it. Claude Code reads `.claude/CLAUDE.md` the same way as a `CLAUDE.md` at the top of the repo.
- **The other copy of this file** is `CLAUDE.md` at the top of the issue-trainings repo. Everything above this section is the same in both: change both together.
