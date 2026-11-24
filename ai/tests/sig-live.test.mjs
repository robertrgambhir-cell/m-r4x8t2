/* Unit tests for the signature course's live replies (POST /sig/reply; playbook rule 37f, Robert, Nov 21, 2026, 2:11 PM), with the
   model and the voice stubbed. The grader still decides what a passerby does (the keys); the server writes the words, checks them and
   sends back the scripted line's place ({fallback}) whenever the words would change the decision. Run: node tests/sig-live.test.mjs */
import worker from "../worker.js";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log("FAIL", m); } };
const ORIGIN = "https://yourwarmup.com";
let modelText = "", calls = [], voices = [];
const sse = (text) => { const enc = new TextEncoder(); return new ReadableStream({ start(ctl) {
  ctl.enqueue(enc.encode(`event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { usage: { input_tokens: 900 } } })}\n\n`));
  for (const p of text.match(/.{1,6}/gs) || []) ctl.enqueue(enc.encode(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: p } })}\n\n`));
  ctl.enqueue(enc.encode(`event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", usage: { output_tokens: 20 } })}\n\n`));
  ctl.close(); } }); };
globalThis.fetch = async (url, init) => {
  if (String(url).includes("elevenlabs")) { voices.push({ url: String(url), body: JSON.parse(init.body) }); return new Response(new Uint8Array([73, 68, 51, 4, 5, 6]), { status: 200, headers: { "content-type": "audio/mpeg" } }); }
  calls.push(JSON.parse(init.body)); return new Response(sse(modelText), { status: 200 });
};
const env = { ANTHROPIC_API_KEY: "k", ELEVENLABS_API_KEY: "e" };
const post = (body, origin = ORIGIN) => worker.fetch(new Request("https://w.example/sig/reply", { method: "POST", headers: { origin, "content-type": "application/json", "cf-connecting-ip": "4.4.4.4" }, body: JSON.stringify(body) }), env);
(async () => {
  /* Robert's own exchange (Nov 21, 12:56 PM): the grader says she stops and asks what he needs; the live words answer his question */
  const ROB = "Hi, how are you? Um, are you registered to vote in Los Angeles County, and are you a lover of libraries?";
  modelText = "Yes, I am, and I do love the library. What's this about?";
  let r = await post({ lesson: 2, who: "soojin", said: ROB, history: [], keys: ["stop", "lib"] }), j = await r.json();
  ok(r.status === 200 && j.text === modelText && typeof j.audio === "string" && j.audio.length > 0, "Robert's line gets a live answer with its voice: " + JSON.stringify(j).slice(0, 120));
  const sys = calls[calls.length - 1].system[0].text, user = calls[calls.length - 1].messages[0].content;
  ok(/Never agree to sign/.test(sys) && /pet names/.test(sys) && !/four parts|Says hello first|grade/i.test(sys + user), "the model gets the never-say list and never the lesson's parts");
  ok(/Schools and Health Care/.test(sys) && /schools and health care permanent/.test(sys) && !/librar/i.test(sys), "the model knows the drive from the course's own words (version 13: Prop 3), not the libraries");
  ok(user.includes(ROB) && /Yes, I am\. Oh, for the schools\? What do you need\?/.test(user) && /stopped/.test(user), "the model gets his exact words, the gist and the decision");
  ok(voices.length === 1 && voices[0].url.includes("5u41aNhyCU6hXOcjPPv0") && voices[0].body.voice_settings.speed === 0.9, "Soo-jin's own voice and speed");
  /* the words can't change the decision: no signing that wasn't decided, no flipping registered */
  modelText = "Yes, I am. Sure, I'll sign it.";
  j = await (await post({ lesson: 2, who: "soojin", said: ROB, keys: ["stop", "lib"] })).json();
  ok(j.fallback === "signs_unasked" && !j.audio, "agreeing to sign when the grader didn't is sent back to the script");
  modelText = "Yeah, I'm registered. What's the school thing?";
  j = await (await post({ lesson: 2, who: "kayla", said: "Hi! Are you registered to vote in LA County?", keys: ["not"] })).json();
  ok(!!j.fallback, "Kayla isn't registered: a live line that says she is goes back to the script");
  modelText = "Oh, I'm not registered, sorry.";
  j = await (await post({ lesson: 2, who: "kayla", said: "Hi! Are you registered to vote in LA County?", keys: ["not"] })).json();
  ok(j.text === "Oh, I'm not registered, sorry.", "her live line that keeps the facts is spoken");
  modelText = "Sure thing, dear. What do you need?";
  j = await (await post({ lesson: 2, who: "soojin", said: "Hi there! It's for school funding.", keys: ["lib"] })).json();
  ok(j.fallback === "pet_name", "no pet names");
  modelText = "As an AI in this practice, I'd say yes.";
  j = await (await post({ lesson: 2, who: "luis", said: "Are you registered to vote in LA County?", keys: ["stop", "other"] })).json();
  ok(!!j.fallback, "nothing out of character");
  modelText = "Yes, I am. Sure, I'll sign.";
  j = await (await post({ lesson: 2, who: "luis", said: "I'm collecting signatures for school funding. Are you registered to vote in LA County?", keys: ["stop", "sure"] })).json();
  ok(j.text === "Yes, I am. Sure, I'll sign.", "signing that was decided is spoken");
  /* only the course's passersby, only their own replies, only from the site */
  ok((await post({ lesson: 2, who: "lena", said: "Hi", keys: ["stop"] })).status === 400, "a canvasser isn't a passerby");
  ok((await post({ lesson: 2, who: "soojin", said: "Hi", keys: ["nope"] })).status === 400, "a reply the passerby doesn't have is refused");
  ok((await post({ lesson: 2, who: "soojin", said: "Hi", keys: ["stop"] }, "https://evil.example")).status === 403, "another site can't use it");
  modelText = "Hm, okay. What's the question?";
  j = await (await post({ lesson: 5, who: "hank", said: "Yes, it keeps today's tax on high incomes.", keys: ["straight"] })).json();
  ok(j.fallback === "sign_lost", "a decided signature can't be dropped (lesson 5's Hank)");
  modelText = "Huh. Okay, you told me straight. I'll sign it.";
  j = await (await post({ lesson: 5, who: "hank", said: "Yes, it keeps today's tax on high incomes. It's printed right here. Want to sign?", keys: ["straight"] })).json();
  ok(j.text === modelText, "every lesson's passersby can reply live (lesson 5's Hank)");
  modelText = "Okay, sure, I'll sign it.";
  j = await (await post({ lesson: 3, who: "tanya", said: "I'm paid to gather signatures. Here are the top funders. Would you sign?", keys: ["yes"] })).json();
  ok(j.text === modelText, "a passerby who takes the pen may say she'll sign (lesson 3's Tanya, \"Okay, sure.\")");
  /* rule 37g (Robert, Nov 23, 2026): a passerby who asks something isn't leaving as they ask it. Pat's "dodge" is a question; Hank's
     is a goodbye. The motion comes from each line's own act. */
  const said5 = "It's a good cause. Will you sign?";
  modelText = "That isn't what I asked. Is there a tax in it or not?";
  await post({ lesson: 5, who: "pat", said: said5, keys: ["dodge"] });
  ok(/stopped to talk/.test(calls[calls.length - 1].messages[0].content) && !/leaving/.test(calls[calls.length - 1].messages[0].content), "rule 37g: Pat's dodge is a question, so she isn't told she's leaving");
  modelText = "Says here it's a tax. I'll pass, thanks.";
  await post({ lesson: 5, who: "hank", said: said5, keys: ["dodge"] });
  ok(/leaving/.test(calls[calls.length - 1].messages[0].content), "Hank's dodge is his goodbye: he says it as he goes");
  modelText = "Oh, okay. What do you need?";
  await post({ lesson: 2, who: "ben", said: "Hi! It keeps funding health care.", keys: ["libAny"] });
  ok(/stopped to talk/.test(calls[calls.length - 1].messages[0].content) && /Oh, okay\. What do you need\?/.test(calls[calls.length - 1].messages[0].content), "version 14: the neutral \"What do you need?\" (nobody said schools) is a stop, with its own gist");
  console.log(`sig-live: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})();
