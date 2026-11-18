"""Version 173 (Nov 18, 2026): Maya's issue trainings are Heating oil and Social Security, and each ends in a spoken practice.

Robert's brief (Nov 18, overnight): put the Heating oil and Social Security issue trainings into the app, keep only those
two, remove the other issue trainings, leave the canvassing trainings exactly as they are, and wire both of a training's
buttons: "Practice the conversation" opens the app's spoken door practice with Sarah (oil) or Linda (social), and close
closes the training.

The trainings are pages of their own, built in robertrgambhir-cell/issue-trainings and copied here by
ai/tools/sync-issue-trainings.py: wdpfxqlsvp/trainings/oil.html and social.html. Their voters come from that repo's voter
sheets (ai/voters/scenarios.js, wired in ai/scenarios-issues.js).

App pages (live app.html, staging, dev and p1):
  - Course 2 on Learn lists two lessons, Heating oil (oil) and Social Security (social); every count follows (seven lessons,
    Briefed after two). The daily rule's issue list and the record's list of ids follow too.
  - A row opens its training in the same overlay as before. The training sends three messages:
      issues-done      its last screen is showing: the lesson is checked off on Learn (once, the first time)
      issues-practice  the door practice opens with the training's voter, shut, with a Knock button (a phone only lets a
                       voice start from a tap on the page itself, and this tap was inside the training's frame)
      issues-close     the overlay closes
    Only messages from the training's own frame count.
  - The practice is the app's AI door conversation (the one Bri's health insurance question used): the voter is the live AI,
    the coach scores the four parts of the door answer, Try this conversation again, Done for now (back to Learn). It
    opens only when the practice AI answers; when it doesn't, the page says so and the training stays open.
  - After a training is done, its conversation stays open on the Practice tab.
  - Open Maya's issues goes to Learn from Today, and on Learn opens the first training not done yet.
  - ?issues still opens the issue trainings; ?issues=social opens one. ?convo=oil and ?convo=social open a practice for review.
  - Words that follow: "about six minutes each" and "After both" on Learn, "Two short lessons on the issues" after lesson 5,
    and the investor tour's stop 7 (about six minutes; graded on the four parts of a good answer).
  - The voter drawing learns short curls and earrings (for Linda).
  - Gone from the pages: the four older issue lessons (tx, oh, me, mi), Bri's door and her link, ?convo=bri.

To undo: git revert the Version 173 commits. Usage: python3 ai/tools/v173-two-issue-trainings.py APP.html ... (edits in place)
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCEN = os.path.join(HERE, "..", "scenarios.js")
# the page's copy of each scenario's card (names, opening lines, rows), read from the server's own definitions
PUB = subprocess.run(["node", "--input-type=module", "-e",
                      "import { SCENARIOS, publicScenario } from " + json.dumps(SCEN) + ";"
                      "const o = {}; for (const k of Object.keys(SCENARIOS)) if (k !== 'bri_health') o[k] = publicScenario(k); console.log(JSON.stringify(o));"],
                     capture_output=True, text=True, check=True).stdout.strip()
assert PUB.startswith("{") and all(k in json.loads(PUB) for k in ("kevin_intro", "sofia_intro", "opener_first_try", "oil", "social")) and "bri_health" not in PUB and "oh_bills" not in PUB
assert "—" not in PUB and "</script" not in PUB.lower()

FLAME = '''['<path d="M12 22c4.4 0 7-2.9 7-6.8 0-3.6-2.4-5.6-3.6-8.6-.4 1.9-1.4 3-2.6 3.6.3-3.3-1.2-6.4-4-8.2.2 3.3-1.6 5.3-3.3 7.4C4.2 11.1 5 12.6 5 15.2 5 19.1 7.6 22 12 22z" fill="#fff"/><path d="M12 22c-1.9 0-3.1-1.3-3.1-3 0-2 1.6-3 2.4-4.6.9 1.2 3.8 2.2 3.8 4.6 0 1.7-1.2 3-3.1 3z" fill="COL"/>', "#f07c3c"]'''
MAILBOX = '''['<path d="M12 16v5.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M2.5 12.5a4.5 4.5 0 0 1 4.5-4.5h10a4.5 4.5 0 0 1 4.5 4.5V17h-19z" fill="#fff"/><path d="M11.5 17v-4.5A4.5 4.5 0 0 0 7 8" fill="none" stroke="COL" stroke-width="1.4"/><path d="M5 13.5h3.5" stroke="COL" stroke-width="1.5" stroke-linecap="round"/><path d="M16 12V3.5h4v3h-4" fill="#fff" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>', "#3b80b6"]'''

DOORS_NEW = '''  /* version 173 (Robert, Nov 18): the spoken practice after each issue training, as a live AI conversation. The voters are the
     trainings' own (ai/scenarios-issues.js, from the voter sheets written with the trainings); a door's key is its training's
     id. No scripted lines, so a door opens only when the practice AI is on. The first line is read from the server's card. */
  oil: {
    persona: "oil_sarah", scene: "door", name: "Sarah", sub: "example voter who heats with oil", street: "14", ai: "oil", topic: "heating oil", rate: 1,
    intro: "Sarah\\u2019s front door, on a cold November evening.",
    get first() { const o = WAI_PUB.oil.voter.opening; return { say: o.say, expr: o.mood }; },
    start(st) { st.stage = "door"; },
    suggest() { return ""; },
    reply() { return { say: "Sorry, I have to get back inside. Thanks for stopping by.", expr: "neutral", end: true }; },
  },
  social: {
    persona: "social_linda", scene: "door", name: "Linda", sub: "example voter who lives on Social Security", street: "208", ai: "social", topic: "Social Security", rate: 1,
    intro: "Linda\\u2019s front step, on a cool afternoon.",
    get first() { const o = WAI_PUB.social.voter.opening; return { say: o.say, expr: o.mood }; },
    start(st) { st.stage = "door"; },
    suggest() { return ""; },
    reply() { return { say: "Sorry, I have to get back inside. Thanks for stopping by.", expr: "neutral", end: true }; },
  },
'''

ISSUE_LINK = '''  function issueLink() { /* version 173: once an issue training is done, its conversation stays open on the Practice tab */
    if (state === "off") return ""; /* shown whenever the practice AI is set up, even if the check from when the page opened failed or hasn\u2019t answered: the tap asks the server again */
    const ids = (CAMPAIGN.gotv || {}).briefIds || [], bd = S.briefsDoneIds || {};
    return ids.filter((id) => bd[id] && DOORS[id] && DOORS[id].ai).map((id) => `<button class="link center" data-act="wai-issue" data-arg="${id}">Practice the ${DOORS[id].topic} conversation with ${DOORS[id].name}</button>`).join("");
  }'''

START_ISSUE = '''  /* version 173: a "not reachable" answer from when the page opened is asked again once, when a conversation is about to start */
  async function recheck() {
    if (!base) return;
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 4000);
    try { const j = await fetch(base + "/health", { cache: "no-store", signal: ac.signal }).then((r) => r.json()); if (j && j.ok) state = "on"; } catch (e) { /* still not reachable */ } finally { clearTimeout(t); }
  }
  /* version 173: any issue door (door is its training's id). o.knock leaves the door shut until the canvasser taps Knock;
     o.back is the screen Done for now goes to. Says so and returns false when the practice AI can't be reached. The
     server's answer can take 4 s: if the canvasser has moved on by then (another screen, or o.still says the training was
     closed), nothing opens and nothing is said. */
  async function startIssue(door, o = {}) {
    if (!DOORS[door] || !DOORS[door].ai) return false;
    const from = S.screen, still = () => S.screen === from && (!o.still || o.still());
    await ping;
    if (state === "down") await recheck();
    if (!still()) return false;
    if (!ready()) { toast(state === "down" ? FAIL.network : FAIL.off); return false; }
    if (!S.drill) S.drillBack = { lesson: lessonNo(), skipWatch: S.skipWatch };
    S.round = null;
    S.drill = { kind: "aiissue", door, step: 1, knock: !!o.knock, back: o.back || "coach" };
    S.lesson = 1; S.skipWatch = false; S.sayNow = null; S.mode = S.mode || "voice";
    go("door");
    if (!o.knock) autoKnock();
    return true;
  }'''

LISTEN_OLD = '''window.addEventListener("message", (e) => {
  const d = e && e.data;
  if (!d || d.warmup !== "brief-done" || !/^[a-z]{2}$/.test(d.lesson || "")) return;
  const camp = CAMPAIGN[S.track] || CAMPAIGN.gotv;
  if (!(camp.briefIds || []).includes(d.lesson)) return;
'''
LISTEN_NEW = '''/* version 173 (Robert, Nov 18): an issue training (wdpfxqlsvp/trainings/<id>.html, in the overlay's frame) tells the app two
   things here: issues-done, when its last screen shows, and issues-practice, when Practice the conversation is tapped
   there. Both check the lesson off (the first finish counts); practice also opens the door. Only the training this page
   opened is listened to. (Before 173 the older issue pages sent brief-done.) */
let issuePracticeBusy = false;
async function issuePractice(id) {
  if (issuePracticeBusy || !DOORS[id] || !DOORS[id].ai) return;
  issuePracticeBusy = true;
  const ov0 = document.getElementById("issues-ov"); /* the training this tap came from: the door only opens while it is still open */
  let opened = false;
  try { opened = await WAI.startIssue(id, { knock: true, back: "library", still: () => !!ov0 && document.getElementById("issues-ov") === ov0 }); } catch (e) { /* the page already said why */ } finally { issuePracticeBusy = false; }
  if (opened && ov0) ov0.remove(); /* when the door can't open, the training stays, so the canvasser can try again */
}
/* a tap that will lead to a voice later wakes the sound while the browser still counts it as a tap: the tap that opens a
   training, and taps inside its frame (Practice the conversation is one) */
window.__warmupWake = (light) => { try { if (light) { if (vidCtx && vidCtx.state !== "running") vidCtx.resume().catch(() => {}); } else videoAudio().catch(() => {}); } catch (e) { /* the sound stays as it was */ } };
window.__warmupIssues = () => { const c = CAMPAIGN[S.track] || CAMPAIGN.gotv, ids = (c.briefIds || []).slice(), bd = S.briefsDoneIds || {}; return { ids, done: ids.filter((id) => bd[id]), names: Object.fromEntries(ids.map((id, i) => [id, (c.briefs || [])[i] || id])) }; };
window.addEventListener("message", (e) => {
  const d = e && e.data;
  if (!d || (d.warmup !== "issues-done" && d.warmup !== "issues-practice") || !/^[a-z]{2,12}$/.test(d.lesson || "")) return;
  { const fr = document.querySelector("#issues-ov iframe"); if (!fr || e.source !== fr.contentWindow) return; }
  const camp = CAMPAIGN[S.track] || CAMPAIGN.gotv;
  if (!(camp.briefIds || []).includes(d.lesson)) return;
  if (d.warmup === "issues-practice") issuePractice(d.lesson);
'''

OUTER_NEW = '''/* version 173 (Robert, Nov 18): the issue trainings are pages of their own, built in the issue-trainings repo and copied to
   wdpfxqlsvp/trainings/ (ai/tools/sync-issue-trainings.py). A training opens over the app in a frame, so the app keeps its
   place. Its engine sends three messages: issues-done and issues-practice (handled above, where the lesson list lives) and
   issues-close (here). With no id, the first training not done yet opens. */
function issuesOpen(lesson) {
  if (document.getElementById("issues-ov")) return;
  var I = typeof window.__warmupIssues === "function" ? window.__warmupIssues() : { ids: [], done: [], names: {} };
  if (I.ids.indexOf(lesson) < 0) lesson = I.ids.filter(function (id) { return I.done.indexOf(id) < 0; })[0] || I.ids[0];
  if (!lesson) return;
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  if (window.__warmupWake) window.__warmupWake(); /* this tap wakes the sound for the practice that follows the training */
  var host = document.getElementById("device") || document.body, ov = document.createElement("div"), fr = document.createElement("iframe");
  ov.className = "issues-ov"; ov.id = "issues-ov";
  /* the trainings folder sits beside the live page; the test builds (p1, dev, staging) are one folder down */
  var at = location.pathname.indexOf("/wdpfxqlsvp/"), base = at >= 0 ? location.pathname.slice(0, at) + "/wdpfxqlsvp/trainings/" : "trainings/";
  fr.title = "Maya Kaur\\u2019s issue training: " + (I.names[lesson] || lesson);
  fr.src = base + lesson + ".html?app=1&v=173";
  fr.addEventListener("load", function () { try { fr.contentDocument.addEventListener("pointerdown", function () { if (window.__warmupWake) window.__warmupWake(true); }, true); } catch (e) { /* not this page's own frame: nothing to do */ } });
  ov.appendChild(fr); host.appendChild(ov);
}
window.addEventListener("message", function (e) { var ov = document.getElementById("issues-ov"), fr = ov && ov.querySelector("iframe"); if (e && e.data && e.data.warmup === "issues-close" && fr && e.source === fr.contentWindow) ov.remove(); });
/* version 134 (Robert, Nov 1): yourwarmup.com/wdpfxqlsvp/?issues opens straight to the issue lessons, over the Learn tab; version 173: ?issues=social opens that one */
if (/[?&]issues\\b/.test(location.search)) setTimeout(function () {
  var b = document.createElement("button"); b.dataset.act = "go"; b.dataset.arg = "library"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove();
  issuesOpen((location.search.match(/[?&]issues=([a-z]+)/) || [])[1] || "");
}, 250);
</script>'''


def patch(path):
    s = open(path, encoding="utf-8").read()

    def swap(old, new, n=1, optional=False):
        nonlocal s
        c = s.count(old)
        if optional and c == 0:
            return False
        assert c == n, (path, c, old[:90])
        s = s.replace(old, new)
        return True

    def resub(pat, new, n=1):
        nonlocal s
        s2, c = re.subn(pat, lambda m: new(m) if callable(new) else new, s, flags=re.S)
        assert c == n, (path, c, pat[:90])
        s = s2

    assert "version 173" not in s, (path, "already patched")

    # 1. the campaign's issue lessons
    swap('briefs: ["School vouchers", "Your electric bill", "Heating oil", "Tariffs and auto jobs"], briefIds: ["tx", "oh", "me", "mi"], briefShort: [["School", "vouchers"], ["Electric", "bill"], ["Heating", "oil"], ["Tariffs and", "auto jobs"]] } };',
         'briefs: ["Heating oil", "Social Security"], briefIds: ["oil", "social"], briefShort: [["Heating", "oil"], ["Social", "Security"]] } }; /* version 173 (Robert, Nov 18): the two issue trainings built in the issue-trainings repo, Heating oil and Social Security; the four lessons before them left the app */')
    resub(r'const ISSUE_ICONS = \[\n.*?\n\];\n', lambda m: "const ISSUE_ICONS = [ /* version 173: a flame for Heating oil, a mailbox for Social Security (its training's cover) */\n  " + FLAME + ",\n  " + MAILBOX + ",\n];\n")
    swap('five minutes each on what voters raise at the door', 'about six minutes each on what voters raise at the door')
    swap('stands on all ${NWORD(NB())} issues.`', 'stands on ${NB() === 2 ? "both" : "all " + NWORD(NB())} issues.`')
    swap('goal("brief", briefed, briefed ? "Earned" : "After all " + NWORD(briefs.length), "Briefed", "")',
         'goal("brief", briefed, briefed ? "Earned" : briefs.length === 2 ? "After both" : "After all " + NWORD(briefs.length), "Briefed", "")')
    swap('const lede = !nx ? "Five short lessons on the issues voters raise. The first opens tomorrow."',
         'const lede = !nx ? `${NWORD(NB()).replace(/^./, (c) => c.toUpperCase())} short lessons on the issues voters raise. The first opens tomorrow.` /* version 173: the count follows the list (two) */')

    # the investor tour's words for an issue lesson (stop 7) follow the new trainings: about six minutes, four graded parts
    swap('h: "Where the candidate stands, in five minutes.",', 'h: "Where the candidate stands, in about six minutes.",')
    swap('b: "Learn covers the problem, the candidate\u2019s plan and the opponent\u2019s plan, each sourced. Then the volunteer explains it out loud to a voter at the door and is graded on those three.",',
         'b: "A briefing in the candidate\u2019s voice covers what the issue costs a voter, why, the opponent\u2019s record and the candidate\u2019s plan, each sourced, then three check questions. Then the canvasser practices the conversation out loud with that voter and is graded on the four parts of a good answer.",')

    # 2. the voters at the door: Sarah and Linda, drawn the way their trainings draw them
    swap('''  brianna: { skin: "#F2D3BC", shade: "#D9B49A", style: "long",  hair: "#A8622E", shirt: "#5A7F55", shirtShade: "#476643" },\n''',
         '''  brianna: { skin: "#F2D3BC", shade: "#D9B49A", style: "long",  hair: "#A8622E", shirt: "#5A7F55", shirtShade: "#476643" },\n'''
         '''  oil_sarah: { skin: "#E3B48F", shade: "#C89671", style: "long", hair: "#5C4329", shirt: "#33435F", shirtShade: "#27344B" }, /* version 173: Sarah, as the Heating oil training draws her */\n'''
         '''  social_linda: { skin: "#B9825C", shade: "#9C6945", style: "curls", hair: "#D9D4CC", shirt: "#4F7A5A", shirtShade: "#3E6248", earrings: true }, /* version 173: Linda, as the Social Security training draws her (short silver curls, small gold earrings) */\n''')
    swap('linda: "f", gary: "m", pushback: "m", quiet: "f" };', 'linda: "f", gary: "m", pushback: "m", quiet: "f", oil_sarah: "f", social_linda: "f" };')
    swap('''  brianna: { kind: "apt", wall: "#DCE6E0", floor: "#BFCFC6", door: "#3E6E5E", frame: "#5E6E66", num: "2F", extra: "bike" },\n''',
         '''  brianna: { kind: "apt", wall: "#DCE6E0", floor: "#BFCFC6", door: "#3E6E5E", frame: "#5E6E66", num: "2F", extra: "bike" },\n'''
         '''  oil_sarah: { kind: "house", wall: "#E3DBCC", texture: "boards", line: "#D3C9B8", door: "#7A3B33", frame: "#FFFFFF", window: true, num: "14" }, /* version 173 */\n'''
         '''  social_linda: { kind: "house", wall: "#E6DDCF", door: "#6B4F7A", frame: "#FFFDF6", glass: true, window: true, num: "208", extra: "plant" },\n''')
    # the voter drawing learns one hair style (short curls) and earrings, for Linda; no other voter changes
    swap('''    puff: `<circle cx="147" cy="106" r="12" fill="${p.hair}"/><circle cx="173" cy="106" r="12" fill="${p.hair}"/><circle cx="160" cy="97" r="15" fill="${p.hair}"/>`,\n    short: "",\n''',
         '''    puff: `<circle cx="147" cy="106" r="12" fill="${p.hair}"/><circle cx="173" cy="106" r="12" fill="${p.hair}"/><circle cx="160" cy="97" r="15" fill="${p.hair}"/>`,\n'''
         '''    curls: `<g fill="${p.hair}">${[[137.5, 117, 8.8], [146, 108.2, 9.6], [158.3, 104.7, 9.6], [170.4, 105.6, 9.6], [180.8, 111.8, 8.8], [186, 124, 7.9], [133.2, 129.4, 7.9], [187, 134.7, 7], [132.4, 141.8, 6.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>`, /* version 173: short curls all round the head */\n'''
         '''    short: "",\n''')
    swap('''    puff: `<path d="M134 138 C133 116 146 108 160 108 C174 108 187 116 186 138 C181 126 171 121 160 121 C149 121 139 126 134 138 Z" fill="${p.hair}"/>`,\n''',
         '''    puff: `<path d="M134 138 C133 116 146 108 160 108 C174 108 187 116 186 138 C181 126 171 121 160 121 C149 121 139 126 134 138 Z" fill="${p.hair}"/>`,\n'''
         '''    curls: `<path d="M134.9 131.2 C135.7 115.3 149.6 110 160 110 C172.1 110 184.3 115.3 185.1 131.2 C180.8 122.4 172.1 118 160 119.7 C149.6 118 139.2 122.4 134.9 131.2 Z" fill="${p.hair}"/>`,\n''')
    swap('''<path d="M157 141.5 Q160 139.5 163 141.5 M143 141 L135 139 M177 141 L185 139"/></g>` : ""}\n''',
         '''<path d="M157 141.5 Q160 139.5 163 141.5 M143 141 L135 139 M177 141 L185 139"/></g>` : ""}\n'''
         '''    ${p.earrings ? `<circle cx="133.6" cy="151.5" r="2.4" fill="#F2B134"/><circle cx="186.4" cy="151.5" r="2.4" fill="#F2B134"/>` : ""}\n''')
    resub(r"  /\* version 156: Maya's health insurance question as a live AI conversation.*?\n  bri: \{\n.*?\n  \},\n(?=  kevin: \{)", lambda m: DOORS_NEW)

    # 3. the practice AI's client: the cards, the link on Practice, starting an issue door
    resub(r'const WAI_PUB = \{.*?\};\n', lambda m: "const WAI_PUB = " + PUB + ";\n")
    swap("/* which scenario this door plays: lesson 1's 2nd try (Kevin) and the issue practice (Bri) */",
         "/* which scenario this door plays: lesson 1's two doors (Sofia, then Kevin) and the issue practice (version 173: Sarah and Linda) */")
    resub(r'  function issueLink\(\) \{\n.*?\n  \}\n(?=  function autoKnock)', lambda m: ISSUE_LINK + "\n")
    resub(r'  async function startIssue\(\) \{\n.*?\n  \}\n(?=  /\* version 165 \(Robert, Nov 15\): the voter streams)', lambda m: START_ISSUE + "\n")

    # 4. the door screen: an issue door opened from a training waits for a knock, and goes back to Learn
    swap('''`, { back: "coach", stage: true, ft: true, footer: composer("send", "Type what you\\u2019d say") }); /* version 150: a Practice knock opens straight on the door; version 169: full screen */''',
         '''`, { back: S.drill.back || "coach", stage: true, ft: true, footer: S.drill.knock && !(S.convo && S.convo.knocked) ? `<button class="btn" data-act="knock">Knock</button>` : composer("send", "Type what you\\u2019d say") }); /* version 150: a Practice knock opens straight on the door; version 169: full screen; version 173: an issue door opened from its training waits for a knock */''')
    swap('case "door-again": go("door"); if (S.drill && S.drill.kind === "aiissue") WAI.autoKnock(); break;',
         'case "door-again": if (S.drill && S.drill.kind === "aiissue") S.drill.knock = false; go("door"); if (S.drill && S.drill.kind === "aiissue") WAI.autoKnock(); break; /* version 173: this tap is the knock */')
    swap('case "wai-issue": S.hist = []; WAI.startIssue(); break;', 'case "wai-issue": S.hist = []; WAI.startIssue(arg); break; /* version 173: arg is the training\\u2019s id */')
    swap('case "coach-back": endDrillState(); go("coach"); break;', 'case "coach-back": { const to = (S.drill && S.drill.back) || "coach"; endDrillState(); go(VIEWS[to] ? to : "coach"); break; } /* version 173: an issue practice opened from its training goes back to Learn */')

    # 4b. an issue practice runs to its voter sheet's end (the server wraps up at five of the canvasser's lines and stops
    # at seven), not lesson 1's four lines; the presenter guide keeps it at the issues stop; and if the canvasser leaves
    # an issue door between the knock and the voter's first line, she stays quiet. Each is for issue doors only: the
    # canvassing doors run exactly as before.
    swap('const shortDoor = () => S.track === "gotv" && (S.lesson || 1) === 1;',
         'const shortDoor = () => S.track === "gotv" && (S.lesson || 1) === 1 && !(S.drill && S.drill.kind === "aiissue"); /* version 173: an issue practice is a whole conversation, not lesson 1\u2019s four lines */')
    swap('  if (S.drill && ["main", "door", "score", "warmtip"].includes(S.screen)) return 8;',
         '  if (S.drill && ["main", "door", "score", "warmtip"].includes(S.screen)) return S.drill.kind === "aiissue" ? 7 : 8; /* version 173: the practice after an issue training is part of the issues stop */')
    swap('async function knock() {\n  const d = DOORS[doorKey()];\n',
         'async function knock() {\n  const d = DOORS[doorKey()], issueDoor = !!(S.drill && S.drill.kind === "aiissue"); /* version 173 */\n')
    swap('    await wait(900);\n    await voterSays(d.first.say, d.first.expr, d);\n',
         '    await wait(900);\n    if (issueDoor && (S.screen !== "door" || !S.convo)) return; /* version 173: the canvasser left an issue door before she spoke */\n    await voterSays(d.first.say, d.first.expr, d);\n')

    # 5. opening the trainings and hearing from them
    resub(r'case "issues-open": (P1\.ev\("issue_open", \{\}\); )?issuesOpen\(\); break;',
          lambda m: 'case "issues-open": { ' + (m.group(1) or "") + '/* version 173: from Today, Learn (the two issue rows lead it); on Learn, the first training not done yet, through its row\\u2019s own checks */ if (S.screen !== "library") { go("library"); break; } const ids = (CAMPAIGN[S.track] || CAMPAIGN.gotv).briefIds || [], bd = S.briefsDoneIds || {}, b = document.createElement("button"); b.dataset.act = "brief-open"; b.dataset.lesson = ids.find((x) => !bd[x]) || ids[0] || ""; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); break; }')
    swap('/* version 152 (Robert, Nov 2): the briefing says when a brief reaches Lesson done; the chapter checks off on Learn and counts on Today and Progress */\n' + LISTEN_OLD, LISTEN_NEW)
    swap('''setTimeout(() => { if (cv === "bri") WAI.startIssue(); else go("door"); }, 0); } } /* version 156 */''',
         '''setTimeout(() => { if (DOORS[cv] && DOORS[cv].ai) WAI.startIssue(cv); else go("door"); }, 0); } } /* version 156; version 173: ?convo=oil and ?convo=social open the issue practice for review */''')

    # 6. the daily rule and the record (Phase 1 pages)
    swap('var DAY_START_HOUR = 5, ISSUES = ["tx", "oh", "me", "mi"]; /* version 164: Georgia hidden */',
         'var DAY_START_HOUR = 5, ISSUES = ["oil", "social"]; /* version 173: the two issue trainings in the app, Heating oil and Social Security */', optional=True)
    swap('   lessons 1 to 5 of How to canvass, then the five issue lessons in any order.', '   lessons 1 to 5 of How to canvass, then the issue lessons in any order.', optional=True)
    swap('progress: { lessons: { "1": { at } ... "5": { at } }, issues: { ga: at, ... } }', 'progress: { lessons: { "1": { at } ... "5": { at } }, issues: { oil: at, ... } }', optional=True)
    swap('const ISS = ["ga", "tx", "oh", "me", "mi"];', 'const ISS = ["ga", "tx", "oh", "me", "mi", "oil", "social"]; /* version 173: oil and social are the app\\u2019s issue trainings; the five older ids still read */', optional=True)

    # 7. the frame the trainings open in
    resub(r'/\* version 130: open and close the issue lessons over the app \*/\nfunction issuesOpen\(lesson\) \{\n.*?\n\}, 250\);\n</script>', lambda m: OUTER_NEW)

    assert "—" not in s, (path, "an em dash")
    for gone in ['"bri_health"', 'door: "bri"', 'cv === "bri"', '<iframe src="issues/?all', '<iframe src="../issues/?all', "/wdpfxqlsvp/train/", '"brief-done"', '"oh_bills"', '"tx_vouchers"', "Practice a health insurance question"]:
        assert gone not in s, (path, "still there:", gone)
    assert s.count("\nloadVoices();\nrender();\n})();\n</script>") == 1, (path, "the page's end marker moved")
    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)


for p in sys.argv[1:]:
    patch(p)
