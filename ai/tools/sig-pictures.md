# The signature course's painted pictures (Nov 19, 2026)

Robert's note on lesson 2 (Nov 19): the cartoon people were "way too cartoon-y"; people and scenes should look "far more
realistic" without "pretending these aren't AI/computer generated." He picked a realistic digital painting over a 3D render
and a drawn look (training playbook rule 67). Every person and every scene with people in the five lessons is now a painting
in `wdpfxqlsvp/sig/img/`. Documents (petition lines, sheets, tallies, the county-check cards) stay drawings.

## How they were made

- **Model:** Cloudflare Workers AI, FLUX.2 [dev] (`@cf/black-forest-labs/flux-2-dev`), called through the AI server's
  key-locked lab (`/lab/form`, version 165-17; Robert approved the lab on Nov 19). The lab key lives only in the build
  sandbox, never in this repo.
- **Same people everywhere:** a storefront painting, Lena's and Rico's reference paintings and each passerby's portrait are
  passed as reference images (input_image_0..2) to every scene they appear in, with a written description of each person.
- **Versions:** each portrait has a smiling version (warm), Kayla has one with an earbud out (turned), and the two scenes
  where the canvasser shows the top funders sheet have a sheet version. They are edits of the base painting.
- **Files in `sig-pictures/`:** `cast.py` (the style line and every person's description), `gen.py` (calls the lab, retries,
  rejects cut-off pictures), `all-jobs.json` and `variant-jobs.json` (every prompt, size and seed), `picks.json` (which
  candidate became which picture), `faces.py` and `faces-final.json` (face boxes: OpenCV for portraits, by hand for the
  two-person scenes) and `process.py` (crops, the close-up strips, the small squares and `img/manifest.json`).
- **On the page:** `engine1.js` reads the manifest (DATA.img). `place()` frames each picture so the face sits near the
  top third and never past an edge. `window.__faces()` tells the screen checker where each face is, so captions never cover
  one. A person who is talking gets a pulsing mark beside their name, since a painting can't move its lips.
