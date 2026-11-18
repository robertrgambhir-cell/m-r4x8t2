/* The stand-in for Claude and for the voice, shared by the UI tests' server (mock-server.mjs) and the preview server
   (preview-server.mjs). It answers the worker's calls to api.anthropic.com with canned lines, so the page and the real
   worker.js can be run together with no key, no network and no cost. It proves plumbing (turns, retries, errors, the coach
   card); it says nothing about how the real model plays a voter or coaches.
   Usage: const { fetch, AI } = standIn(stats); globalThis.fetch = fetch; pass AI in the worker's env. */
export function standIn(stats = { voter: 0, coach: 0 }) {
  const realFetch = globalThis.fetch;
  const said = (body) => body.messages[0].content;
  /* version 165: the streamed voter (/turn) asks for text as server-sent events; the same canned lines, streamed */
  const sse = (text) => { const enc = new TextEncoder(); return new ReadableStream({ async start(ctl) {
    ctl.enqueue(enc.encode(`event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { usage: { input_tokens: 1200 } } })}\n\n`));
    for (const p of text.match(/.{1,6}/gs)) { await new Promise((r) => setTimeout(r, 10)); ctl.enqueue(enc.encode(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: p } })}\n\n`)); }
    ctl.enqueue(enc.encode(`event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", usage: { output_tokens: 40 } })}\n\n`)); ctl.close(); } }); };
  const voterLine = (you) => {
    const n = you.length, last = (you[n - 1] || "").toLowerCase();
    const lines = ["Oh, hey. Yeah, I'm voting for her.", "Do you know what time the polls close Tuesday?", "Okay, no worries. Thanks.", "I've got to hop on a call. Thanks for coming by!"];
    return /bye|thanks|have a good/.test(last) && n > 1 ? { say: "You too, bye!", mood: "warm", end: true } : { say: lines[Math.min(n - 1, 3)], mood: n === 1 ? "warm" : "neutral", end: n >= 4 };
  };
  /* version 174: the issue practice's voters, Sarah and Linda, get canned lines of their own, so a test's screenshots read like
     their doors (still a stand-in: it says nothing about how the real model plays them). She keeps asking until she is asked
     for her vote (or six lines), so a conversation can run past lesson 1's four lines, as her voter sheet allows. */
  const ISSUE_LINES = {
    Sarah: { lines: ["Thanks. I just don't know how I'm supposed to pay for heat.", "Wait, renters can get that help too?", "That makes sense. So what would Maya do?", "And how is that different from Jack Dufner?", "Okay. What do you need from me?"], close: "Okay. I'll think about it. I have to get back inside where it's warm." },
    Linda: { lines: ["So my check doesn't just stop?", "He told me he'd never cut Social Security.", "Does ending the cap fix it for good?", "A big share, not all of it. All right.", "So what are you asking me to do?"], close: "All right. I'll think it over. I have to get back inside." },
  };
  const voterLineFor = (body, you) => {
    const m = JSON.stringify(body.system || "").match(/role-playing (Sarah|Linda)\b/), L = m && ISSUE_LINES[m[1]];
    if (!L) return voterLine(you);
    const n = you.length, last = (you[n - 1] || "").toLowerCase();
    if (/\b(bye|have a good|take care)\b/.test(last) && n > 1) return { say: "You too. Bye now!", mood: "warm", end: true };
    if (/count on your vote/.test(last) || n >= 6) return { say: L.close, mood: "warm", end: true };
    return { say: L.lines[Math.min(n - 1, L.lines.length - 1)], mood: n >= 3 ? "warm" : "neutral", end: false };
  };
  const fetch = async (url, init) => {
    if (!String(url).includes("api.anthropic.com")) return realFetch(url, init);
    const body0 = JSON.parse(init.body);
    if (body0.stream && /add punctuation/.test(JSON.stringify(body0.system))) { /* version 168: /tidy echoes the words with a period */
      return new Response(sse(String(said(body0)).replace(/[.?!]?$/, ".")), { status: 200 });
    }
    if (body0.stream) {
      const you0 = said(body0).split("\n").filter((l) => /^\d+\. Volunteer: /.test(l)).map((l) => l.replace(/^\d+\. Volunteer: /, ""));
      await new Promise((r) => setTimeout(r, 250));
      stats.voter += 1;
      const v = voterLineFor(body0, you0);
      return new Response(sse(`${v.mood}|${v.say}${v.end ? " <end>" : ""}`), { status: 200 });
    }
    const body = body0, tool = body.tools[0].name, text = said(body);
    const you = text.split("\n").filter((l) => /^\d+\. Volunteer: /.test(l)).map((l) => l.replace(/^\d+\. Volunteer: /, ""));
    await new Promise((r) => setTimeout(r, 250));
    let input;
    if (tool === "voter_turn") {
      stats.voter += 1;
      input = voterLineFor(body, you);
    } else {
      stats.coach += 1;
      const all = you.join(" "), first = you[0] || "";
      const q = (re) => { const m = all.match(re); return m ? m[0] : ""; };
      const ids = body.tools[0].input_schema.properties.items.items.properties.id.enum;
      const ev = { name: q(/I'?m [A-Z][a-z]+/), maya: q(/Maya Kaur/i), tuesday: q(/Tuesday/i), listen: you[1] ? you[1].split(" ").slice(0, 4).join(" ") : "", close: q(/(thanks|bye)[^.!?]*/i), gap: q(/200,000/), plan: q(/Medicaid expansion/i), opp: q(/work hours/i),
        /* version 174: the four parts of an issue door answer */ agree: q(/(That sounds really hard|You're right to worry|I'm sorry to hear that)/i), help: q(/heating help covers renters[^.]*/i), cause: q(/fewer workers pay in[^.,]*/i), choice: q(/Jack Dufner voted[^.]*\. Maya Kaur would[^.]*/i), ask: q(/Can Maya count on your vote[^.?]*/i) };
      input = {
        items: ids.map((id) => ({ id, status: id === "nominute" || id === "accurate" ? "met" : ev[id] ? "met" : "missed", evidence: ev[id] || "", note: ev[id] ? "" : "Not in what you said." })),
        invented: [], transcription: [],
        strength: first ? { text: "You opened with who you are.", quote: first.split(" ").slice(0, 3).join(" ") } : { text: "", quote: "" },
        improvement: { text: "Remind him Election Day is Tuesday in your first line.", try_saying: "Hi, I'm Sam, a neighbor with Maya Kaur. Election Day is Tuesday." },
        summary: "MOCK coach: a friendly start.",
      };
      /* version 174: on an issue door the stand-in says plainly that it is one, so a screenshot is never mistaken for the real coach */
      if (ids.includes("agree") && ids.includes("ask")) Object.assign(input, {
        strength: first ? { text: "Stand-in coach: the real coach names one thing you did well here.", quote: first.split(" ").slice(0, 3).join(" ") } : { text: "", quote: "" },
        improvement: { text: "Stand-in coach: the real coach gives one thing to try next here.", try_saying: "" },
        summary: "MOCK coach: the four parts of the door answer.",
      });
    }
    return new Response(JSON.stringify({ content: [{ type: "tool_use", name: tool, input }], usage: { input_tokens: 1000, output_tokens: 80 } }), { status: 200 });
  };
  /* the voice: 0.3 s of quiet PCM per sentence (or a tiny MP3 for /speak), so the page's audio path runs end to end */
  const AI = { run: async (model, o) => { stats.voice = (stats.voice || 0) + 1; await new Promise((r) => setTimeout(r, 80)); if (o.encoding === "linear16") return new ReadableStream({ start(c) { for (let k = 0; k < 3; k++) c.enqueue(new Uint8Array(4800)); c.close(); } }); return new Uint8Array(600).buffer; } };
  return { fetch, AI, stats };
}
