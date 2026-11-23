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
- **After an outside review (11:00 AM PT):** Hank was repainted at 71, Kayla with both earbuds in a hand (no third one), Marisol with a blank badge, Ben's scene in his own sweater, and every two-person scene painted from a storefront reference with the sign cropped off and the table's words painted out, so a frame never cuts a word in half.
- **Files in `sig-pictures/`:** `cast.py` (the style line and every person's description), `gen.py` (calls the lab, retries,
  rejects cut-off pictures), `all-jobs.json` (every prompt, size, seed and reference), `picks.json` (which
  candidate became which picture), `faces.py` and `faces-final.json` (face boxes: OpenCV for portraits, by hand for the
  two-person scenes) and `process.py` (crops, the close-up strips, the small squares and `img/manifest.json`).
- **On the page:** `engine1.js` reads the manifest (DATA.img). `place()` frames each picture so the face sits near the
  top third and never past an edge. `window.__faces()` tells the screen checker where each face is, so captions never cover
  one. A person who is talking gets a pulsing mark beside their name, since a painting can't move its lips.

## Version 8 (Nov 20, 2026): clean cutouts, the walk-up and where to stand

From Robert's notes on lesson 2 (Nov 20, 3:51 PM; playbook rules 37c, 67 and 67b). `sig-pictures/r8_build.py <lab dir> <img dir>` runs after `q_build.py` and adds, in `wdpfxqlsvp/sig/img/`:

- **Cutouts with only the person** (`p-*.webp` and their close-ups and avatars). The first cutouts kept a wedge of the store's orange crates by some people's heads, which rode along when they moved. Each portrait was repainted on plain green with FLUX.2 [dev] through the AI server's lab (`/lab/form`), and whatever the old cutout kept that the repaint shows as background was trimmed (`r8/greenmask.py`).
- **The walk-up** (rule 37c). `walkway.webp` is the sidewalk from the canvasser's spot, with its manifest entry saying where the far end and a near walker's feet sit. `w-<who>.webp` is each walker, full length and facing you, cut out with `r8/walkcut.py`. `aerial-<who>.webp` is the view from about 30 feet up: the canvasser from above and behind at the table, and the passerby on the sidewalk, with `at` in the manifest marking the canvasser's spot for the zoom. Walkers: Ben, Soo-jin, Kayla, Luis, Tanya with her cart, Dwayne, Hank, Marisol and Ines with her stroller. Anyone else is already stopped when their scene starts.
- **Where to stand** (rule 67). `spot-sit`, `spot-stand`, `spot-doorway` and `spot-side` are two pairs drawn from one picture each, so only the canvasser moves (`r8/spots.py`). The seated canvasser sits behind the table, on her phone.
- **Prompts and seeds** are in `r8/jobs-*.json` (the repaints, walkers, aerial views and the sidewalk) and `r8/walk-info.json`. The lab key never goes in the repo: `gen.py` reads it from a `key` file beside it, so run it from a copy in the sandbox's lab folder.
- **On the page.** `engine1.js` has `walkable()`, `sceneWalk()` and `walkAt()`, which scale a walker by distance down the sidewalk. `engine2.js` runs the stages (`data-stage` on the panel: `air`, then `pov`, then `face`) while the coach talks, so the passerby reaches you as you can start talking.


## Version 9 (Nov 21, 2026): the walkers step

From Robert's note (Nov 21, 12:11 PM; playbook rule 69a): the passerby slid down the sidewalk "as if he were frozen on a moving walkway." `sig-pictures/r8_gait.py <img dir>` runs after `r8_build.py` (which rewrites the manifest) and adds `w-<who>-b.webp` for each walker but the stroller: the whole picture with the other step's legs, the same legs reflected about their own center line, below the hands (below the apron or the cart's basket), with a short blend so no seam shows. Its manifest entry says where the legs start. On the page, `gait()` in `engine1.js` shows one step's picture or the other, with the first picture's top laid over both so the body never blinks, and `walkAt()` counts the steps by the ground covered and sets the bob (`data-step` on the walk-up).

## Version 10 (Nov 21, 2026): whole faces, one difference, real words

From Robert's notes (Nov 21, 12:56 PM; playbook rules 67 and 67a). The scripts are in `sig-pictures/r10/`; run them from a folder of their own (they read and write `wdpfxqlsvp/sig/img/`).

- **Noses** (`r10/nose.py soojin,marisol`). Soo-jin ("I don't know why she doesn't have a nose") and Marisol, the other face drawn without one, get a thin, warm line down the side of the nose and a small hook at its tip, as Anika's and Pat's are drawn, in a darker shade of their own skin, between the blink and mouth patches so neither covers it. Their close-ups and round faces are cut again the way `q_build.py` cuts them. Their walking pictures already had a nose. Every other face was checked: all have one (Lena's, Tanya's and Theo's are dark lines on deep skin, faint at small sizes; a lighter edge for them is the next step if Robert asks).
- **Where to stand** (`r10/jobs-sit.json` through the lab's `gen.py`, then `r10/situp.py`, then `r10/clothsign.py`). The seated canvasser was redrawn by the image model from a crop of her old picture: phone away, sitting up, watching the passersby, hands on the table. Only her upper body is new (cut out with rembg and laid in where the old one was); her legs, the stool and the table are the old picture's. The standing picture gets the same stool behind the table (two legs and the rung copied, the third leg mirrored). Both, and the door pair, carry "LIBRARIES FOR ALL" in white on the cloth's front, in Figtree.
- **Table signs from above** (`r10/signs.py aerial-ben,aerial-soojin,aerial-kayla,aerial-luis`). The painter's made-up letters on the table's card are painted over with a clean card reading "LIBRARIES FOR ALL" in the drive's purple, laid into the card's own slant and reading left to right. The other aerials have no card (Tanya's has a petition sheet, a document, left as drawn).

## Version 11 (Nov 22, 2026): the walkers walk like people

From Robert's note (Nov 22, 4:10 PM; playbook rule 69b): "the walking is very phony ... Their feet are mostly just kind of sliding, and then their feet are moving." The two reflected steps (version 9's `r8_gait.py`, now retired) flipped twice a second while the whole picture slid about 12 meters down the walk in 3.6 seconds, three times walking speed, so the feet had to slide.

- **The legs are drawn as they walk** (`STRIDE` in `engine1.js`, on a canvas over the walkway). Everything is in body heights in the walkway's own perspective: the walk is driven by the ground covered, so a foot on the ground stays where it landed while the body moves over it and the other swings through with its knee bent; the hips ride as high as the planted feet allow, so the body rises and falls with each step; the back heel comes up before it leaves the ground; the last step brings the feet together. The walk-up now covers about 2.4 body heights (about 4 meters) in the same 3.6 seconds. The walker's own picture lies over the legs down to where the legs start, its last rows fading over the drawn hips, and leans a touch with each step.
- **`sig-pictures/r11_stride.py <img dir>`** runs after `r8_build.py` (which rewrites the manifest). For each walker it measures where the legs start (below the hands, the apron or the cart's basket), the middle of the hips there and how far the fade can reach without touching a hand, and writes them with that walker's legs (widths, trousers and their shade, a cuff or a crop with the ankle showing, shoes with a sole and a highlight), set by eye from each picture, as `"stride"` on `w-<who>` in the manifest. It removes the old `w-<who>-b.webp` steps. For the woman with the cart it writes `w-tanya-cart-front.webp`, the cart's lower legs and wheels with nothing behind them, which the page lays over her legs; she walks a step behind the picture's plane, so her feet stay behind the cart's wheels, and her body and the cart rise and fall less.
- **After the outside review:** the hips are filled in the trousers' color down to the crotch under the picture's fade, so the legs part where trousers do; each leg's shading starts below the crotch and a soft inner shadow rounds it; a raised heel tips the shoe on its toe, so the sole stays down; each planted foot has a contact shadow; the feet end apart; the grain moves and grows with the walker; and `walkable()` gives a walk-up only to a walker with a stride, so nobody slides.
- **Checks:** `node ai/tests/sig-stride.cjs` (no planted foot ever moves, one foot always down, a planted sole on the ground, a walking pace and rhythm, the feet apart at the end, the cart walker's feet behind its wheels, every walker drawn).
- **Not yet:** Ines with her stroller (lesson 1's whole stop) still comes in from the side with no legs showing. Her walk-up needs the stroller's frame laid over her drawn legs, as the cart's is.
