# Release, Nov 6, 2026: Versions 160 and 161 plus Phase 1, live

One combined release. The live link (`/kaur`, which opens `/wdpfxqlsvp/`) loads `wdpfxqlsvp/app.html`. After this release, that file is the Phase 1 learner build of the Version 161 staging page.

## How the live page is built

```
python3 ai/tools/v160-investor-demo.py <v155 app.html> v160.html
python3 ai/tools/v161-round2.py v160.html v161.html                      # no --honest: Phase 1 makes the honest copy
python3 ai/build-staging.py /abs/v161.html wdpfxqlsvp/staging/index.html https://warmup-ai.robertrgambhir.workers.dev
python3 ai/build-phase1.py wdpfxqlsvp/staging/index.html ai/assets/issues-source.html wdpfxqlsvp/p1          # learner build
python3 ai/build-phase1.py wdpfxqlsvp/staging/index.html ai/assets/issues-source.html wdpfxqlsvp/dev --dev  # test clock
cp wdpfxqlsvp/p1/index.html wdpfxqlsvp/app.html
cp wdpfxqlsvp/p1/issues/index.html wdpfxqlsvp/issues/index.html
```

`ai/assets/issues-source.html` is the issue lessons page as it was before Phase 1, so the builder never runs on its own output. The v155 input is `git show rollback-v155:wdpfxqlsvp/app.html`.

## What each address serves

| Address | Page |
|---|---|
| `/kaur`, `/wdpfxqlsvp/` | the live app (`app.html`): Versions 160 and 161, the practice AI and Phase 1 |
| `/wdpfxqlsvp/p1/` | the same build, for the iPhone check |
| `/wdpfxqlsvp/dev/` | the same build with the test clock (`?day=+1`), for Robert only |
| `/wdpfxqlsvp/staging/` | Version 161 staging, without Phase 1 |
| `?tour` on any of them | the investor preview; it never saves or sends anything |

## Rollback

The tag `rollback-v155` is main as it was before this release (784661e, live Version 155). To roll back, revert the release's merge commit and push to main:

```
git revert -m 1 <release merge commit> && git push origin main
```

That restores the pages and the AI server together. GitHub Pages and Cloudflare redeploy in a few minutes.
