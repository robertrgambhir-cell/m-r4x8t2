/* The live-eval cases, shared by live-eval.mjs (the deployed worker) and dryrun.mjs (a prompt dry run). */
export const KEV = "Hey. Can I help you?";
export const conv = (...lines) => lines.map((x, i) => ({ who: i % 2 ? "you" : "them", text: x }));
export const words = (t) => new Set(String(t).toLowerCase().replace(/[^a-z' ]/g, " ").split(/\s+/).filter((w) => w.length > 2));
export const overlap = (a, b) => { const A = words(a), B = words(b); const i = [...A].filter((x) => B.has(x)).length; return i / Math.max(1, Math.min(A.size, B.size)); };

/* each case: a conversation so far (ending on the learner) and a check on Kevin's next turn */
export const VOTER = [
  { name: "A clear, complete opener", turns: conv(KEV, "Hi, I'm Dana. I live a few blocks over and I'm volunteering for Maya Kaur. Election Day is Tuesday, so I'm checking in with neighbors."),
    check: (r) => r.mood !== "skeptical" && /maya|her|vot|tuesday|neighbor|thanks/i.test(r.say) && !/who are you with|what.*about/i.test(r.say), want: "relaxes, says he's with Maya, doesn't ask who she's with" },
  { name: "An incomplete opener", turns: conv(KEV, "Hi there."),
    check: (r) => /\?/.test(r.say) && !/maya/i.test(r.say), want: "asks who she is or what she wants, without naming Maya himself" },
  { name: "Asks for his time", turns: conv(KEV, "Hi, do you have a minute?"),
    check: (r) => /sure|guess|what'?s up|depends|quick|okay|um|uh/i.test(r.say) && r.mood !== "warm", want: "a wary 'sure, I guess, what's up?'" },
  { name: "An unexpected but reasonable question", turns: conv(KEV, "Hi, I'm Dana, a neighbor volunteering for Maya Kaur.", "Oh, nice. Yeah, I'm voting for her.", "Great! Random question, is the side door of the building usually unlocked? I want to drop flyers for 3A."),
    check: (r) => /door|side|lock|not sure|think|usually|yeah|no/i.test(r.say) && !/polls?|ballot/i.test(r.say), want: "answers about the door like a neighbor would" },
  { name: "The learner changes the subject", turns: conv(KEV, "Hi, I'm Dana with Maya Kaur's campaign.", "Oh, okay. I'm voting for her.", "Awesome. Hey, did you catch the game last night?"),
    check: (r) => /game|watch|catch|missed|saw|no|yeah|sports/i.test(r.say), want: "reacts to the game, then steers back or wraps up" },
  { name: "The learner says they don't know", turns: conv(KEV, "Hi, I'm Dana, volunteering for Maya Kaur. Election Day is Tuesday!", "Oh, right, thanks. Do you know what time the polls close?", "Honestly, I'm not sure. I can find out and text you, or the county elections site has it."),
    check: (r) => !/\b(7|8|9|10|seven|eight|nine)\s*(pm|p\.m\.|o'clock)?\b/i.test(r.say) && /ok|okay|no worries|thanks|sure|fine|cool|check|look/i.test(r.say), want: "accepts it, doesn't invent a closing time himself" },
  { name: "The learner corrects themselves", turns: conv(KEV, "Hi, I'm Dana, I'm with the, sorry, I'm volunteering for Maya Kaur, for Senate."),
    check: (r) => !/who.*(with|from)|which campaign/i.test(r.say), want: "goes with the correction, doesn't ask who she's with" },
  { name: "A transcription error", turns: conv(KEV, "hi i'm dana i'm volunteering for maya core election day is two's day"),
    check: (r) => !/core|two'?s day|what\?$/i.test(r.say), want: "understands Maya Kaur and Tuesday from the slips" },
  { name: "The voter needs to end", turns: conv(KEV, "Hi, I'm Dana with Maya Kaur.", "Oh, cool. I'm voting for her.", "Great. Election Day is Tuesday.", "Yep, after work probably.", "Where do you usually vote?", "The library, I think.", "Nice, that's close. Do you know your neighbors?", "Sort of. Hey, I've got a call in a minute.", "Oh, one more thing, have you seen her ads?", "A couple, yeah.", "Cool, and do you know about early voting?"),
    check: (r) => r.end === true, want: "wraps up and ends the conversation" },
];
export const PAIR = [
  conv(KEV, "Hi, I'm Dana, a neighbor with Maya Kaur's campaign. Election Day's Tuesday, just checking in."),
  conv(KEV, "Sorry to bother you. Do you have a minute to talk about the Senate race?"),
];
export const COACH = [
  { name: "A correct paraphrase gets credit", scen: "kevin_intro", turns: conv(KEV, "Hey there, Dana here, I'm on the block over, out helping Maya Kaur's Senate campaign. Heads up, the election's this Tuesday.", "Oh, nice. Yeah, I'm voting for her.", "Love it. Thanks, have a good one!", "You too."),
    check: (c) => c.hits.join() === "true,true,true,true", want: "all four parts met" },
  { name: "Missing parts aren't credited", scen: "kevin_intro", turns: conv(KEV, "Hi! Do you have a minute to talk?", "Uh, sure, I guess. What's up?", "Just wanted to say vote, okay? Bye!", "Okay, bye."),
    check: (c) => c.hits[0] === false && c.hits[1] === false && c.hits[2] === false && c.hits[3] === false, want: "no part met" },
  { name: "Invented facts are caught", scen: "kevin_intro", turns: conv(KEV, "Hi, I'm Dana with Maya Kaur's campaign. Election Day is Tuesday.", "Oh, cool. What time do polls close?", "They close at 9 PM, and Maya's going to cut your taxes in half.", "Huh, okay. Thanks."),
    check: (c) => c.items.find((x) => x.id === "accurate").status === "missed" && c.invented.length >= 1, want: "Stick to what you know is missed, the claims are listed" },
  { name: "Honest uncertainty is credited", scen: "kevin_intro", turns: conv(KEV, "Hi, I'm Dana, volunteering for Maya Kaur. Election Day is Tuesday.", "Oh right. Is the library still where I vote?", "I'm not sure, honestly. I can check and get back to you.", "Okay, no worries. I've got to jump on a call.", "Of course, good luck with it. Thanks, Kevin!"),
    check: (c) => c.items.find((x) => x.id === "accurate").status === "met" && c.items.find((x) => x.id === "listen").status !== "missed" && c.items.find((x) => x.id === "close").status === "met", want: "accurate met, listen credited, close met" },
  { name: "Unsaid Tuesday gets no credit", scen: "kevin_intro", turns: conv(KEV, "Hi, I'm Dana, volunteering for Maya Kaur. Are you planning to vote?", "Yeah, I am.", "Great, thanks!"),
    check: (c) => c.hits[2] === false, want: "Election Day not met (asking about a plan doesn't count)" },
  { name: "A transcription slip isn't held against them", scen: "kevin_intro", turns: conv(KEV, "hi i'm dana i'm volunteering for maya core election day is tuesday", "Oh, nice. Thanks.", "thanks bye"),
    check: (c) => c.hits[1] === true, want: "Maya met despite 'maya core'" },
  { name: "The 1st try's one line", scen: "opener_first_try", turns: [{ who: "you", text: "Hi, I'm Sam! I'm volunteering for Maya Kaur. Election Day is Tuesday." }],
    check: (c) => c.hits.join() === "true,true,true,true", want: "all four met" },
  { name: "Bri: a wrong claim about the opponent", scen: "bri_health", turns: [{ who: "them", text: "Is Maya going to do anything about health insurance?" }, { who: "you", text: "Yes, she wants full Medicaid expansion. Her opponent is against Medicaid." }, { who: "them", text: "Oh. Okay, thanks." }],
    check: (c) => c.items.find((x) => x.id === "accurate").status === "missed", want: "Stick to the facts missed" },
  { name: "Bri: the three things in her own words", scen: "bri_health", turns: [{ who: "them", text: "Is Maya going to do anything about health insurance? My job doesn't offer it." }, { who: "you", text: "She is. You're in what they call the coverage gap, about 200,000 people here make too much for Medicaid but can't afford a plan." }, { who: "them", text: "That's me. So what would she do?" }, { who: "you", text: "Push the legislature for full Medicaid expansion, so people like you qualify. The feds pay 90 percent." }, { who: "them", text: "I heard the other guy has a plan too." }, { who: "you", text: "His is smaller and requires work hours, like Georgia Pathways, which covers way fewer people." }, { who: "them", text: "Okay. Thanks, I've got to get my kids." }, { who: "you", text: "Of course, thanks Bri!" }],
    check: (c) => c.hits.join() === "true,true,true", want: "the three things met" },
];

