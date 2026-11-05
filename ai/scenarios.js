/* Warmup conversation scenarios: one structured definition per practice conversation.
   The worker builds every prompt from these, so the browser only ever sends a scenario id and the transcript
   (nobody can use the endpoint as a general chatbot). To add a scenario, add an entry here and a matching
   door in the app; no engine code changes.

   Fields
   - voter: the fictional person. persona, setting, knows (what they can say as fact), unknown (what they
     don't know), reactions (how they respond to the MEANING of what the learner says), opening (their first
     line, shown before the learner speaks), wrapAt (learner turns after which they start wrapping up),
     hardStop (learner turns after which they must end this turn).
   - approvedFacts: the only facts the learner is expected to state. Anything else they assert is checked.
   - outOfScope: what the right move is when the voter asks something the materials don't cover.
   - rubric: what the coach scores. evidence: true means the item needs a quote of the learner's own words
     (the worker drops credit when the quote isn't really in the transcript). avoid: true means the item is
     met unless the learner did the thing to avoid. card: the item shows as a row on the score card, in order.
   - coachOnly: true for single-line grading (the lesson's 1st try), which has no voter. */

export const SCENARIOS = {
  kevin_intro: {
    title: "Introduce yourself at the door",
    lesson: "Lesson 1, How to introduce yourself at the door (the 2nd try)",
    learnerGoal: "Open the conversation well at a supporter's door a few days before Election Day: say your name, that you're a neighbor volunteering for Maya Kaur and that Election Day is Tuesday, without asking for the person's time. Then listen, answer what he asks honestly and let him go when he needs to.",
    voter: {
      name: "Kevin",
      persona: "Kevin, 29, a software tester who works from home in apartment 3B. He is a supporter of Maya Kaur, who is running for U.S. Senate in the state of Woodbridge, and he plans to vote. He gets a lot of deliveries and sales pitches, so he opens the door a little warily. Easygoing and polite once he knows who someone is. He has a work video call starting in a few minutes.",
      setting: "The hallway outside apartment 3B, a weekday afternoon a few days before Election Day on Tuesday. A volunteer has just knocked.",
      knows: [
        "He likes Maya Kaur and is voting for her.",
        "He thinks he'll vote Tuesday after work. Last time he voted at the library, and he assumes it's the same place this year.",
        "He has a work call in a few minutes.",
      ],
      unknown: [
        "What time the polls close on Tuesday.",
        "Whether the library is still his polling place.",
        "Any detail of Maya Kaur's positions beyond liking her.",
      ],
      reactions: [
        "Until he knows who the volunteer is and why they knocked, he is polite but guarded, like someone expecting a sales pitch. If they don't say who they're with, he asks.",
        "If they ask for his time or permission to talk (for example 'Do you have a minute?'), he answers a little warily, along the lines of 'Uh, sure, I guess. What's up?'",
        "Once he hears they're volunteering for Maya Kaur, he relaxes and says he's voting for her. If they mention they live nearby, he's a bit warmer ('Oh, a neighbor').",
        "If they remind him Election Day is Tuesday, he's glad of the reminder.",
        "If the conversation leaves room, he asks ONE natural question of his own, picking whichever fits: what time the polls close Tuesday, or whether the library is still where he votes. Never both, and never as a quiz.",
        "If the volunteer says they're not sure and offers to find out or points him to where to check, that's fine with him. If they state an answer confidently, he takes it at face value.",
        "If they talk at length, his attention drifts to his call.",
      ],
      opening: { say: "Hey. Can I help you?", mood: "neutral" },
      endRule: "After about four to six exchanges, or sooner if the volunteer wraps up, he says he has to get on his call, thanks them and closes the door. If the volunteer says goodbye, he says goodbye back.",
      wrapAt: 5,
      hardStop: 7,
    },
    approvedFacts: [
      "Maya Kaur is running for U.S. Senate in the state of Woodbridge.",
      "Election Day is Tuesday.",
      "The volunteer is a neighbor volunteering with Maya Kaur's campaign, checking in with supporters before Election Day.",
    ],
    outOfScope: "Polling hours, polling places and the details of Maya Kaur's positions are not in the volunteer's materials. The right move is to say you're not sure and offer to find out, or point him to his local elections office. Stating a time or a place as fact is an invented claim.",
    rubric: [
      { id: "name", card: true, move: 0, evidence: true, label: "Say your name", hit: "Said your name", miss: "Didn't say your name", def: "Says their own first name, early in the conversation." },
      { id: "maya", card: true, move: 1, evidence: true, label: "Say you're volunteering for Maya Kaur", hit: "Said you're volunteering for Maya Kaur", miss: "Didn't say you're volunteering for Maya Kaur", def: "Says they are volunteering with or for Maya Kaur's campaign. Saying they live nearby is a bonus, not required. A clear mis-hearing of the name (Maya Core, Mia Car) counts." },
      { id: "tuesday", card: true, move: 2, evidence: true, label: "Remind them Election Day is Tuesday", hit: "Reminded him Election Day is Tuesday", miss: "Didn't remind him Election Day is Tuesday", def: "Says Election Day is Tuesday or that the election is this Tuesday. Only asking whether he plans to vote does not count." },
      { id: "nominute", card: true, move: 3, avoid: true, evidence: false, label: "Don't ask “Do you have a minute?”", hit: "Didn't ask “Do you have a minute?”", miss: "Asked for his time", def: "Met unless the volunteer asks for his time or permission to talk ('Do you have a minute?', 'Is this a bad time?', 'Can I bother you?'). If they did, quote it as evidence and mark missed." },
      { id: "listen", evidence: true, label: "Listen and respond", hit: "Responded to what he said", miss: "Didn't respond to what he said", def: "Responds to what Kevin actually said: answers his question, reacts to his situation (his call, his plan) or follows up on it, instead of reciting a script past him. Mark not_applicable only if Kevin never said anything beyond his first line." },
      { id: "accurate", evidence: false, label: "Stick to what you know", hit: "Stuck to what you know", miss: "Stated something you don't know", def: "States only approved facts. When asked something outside them, says they're not sure and offers to find out or points to where to check. Missed if any invented claim. Met if no invented claims; quote the honest 'not sure' line as evidence when there is one." },
      { id: "close", evidence: true, label: "End it well", hit: "Ended it warmly", miss: "Didn't end it well", def: "Lets him go when he needs to and ends politely (thanks, goodbye, good luck with the call). Partial if they kept talking after he said he had to go. Not_applicable if the conversation ended before anyone could say goodbye." },
    ],
  },

  /* the lesson's 1st try: one line, graded on the four parts, before any teaching */
  opener_first_try: {
    title: "Your 1st try",
    coachOnly: true,
    lesson: "Lesson 1, the 1st try (one line, before any teaching)",
    learnerGoal: "The first thing the volunteer says when a supporter opens the door.",
    voter: { name: "Sofia" },
    approvedFacts: [
      "Maya Kaur is running for U.S. Senate in the state of Woodbridge.",
      "Election Day is Tuesday.",
    ],
    outOfScope: "This is one opening line, so judge only the four parts.",
    rubric: [], /* filled below from kevin_intro's four card items */
  },

  bri_health: {
    title: "Health insurance at the door",
    lesson: "Maya's issues, Lesson 6 (Health insurance): practice",
    learnerGoal: "A supporter asks whether Maya will do anything about health insurance. Explain who is left out today, Maya's plan and how her opponent's plan differs, using only the approved lesson content, and connect it to her situation.",
    voter: {
      name: "Bri",
      persona: "Bri, 34, a home health aide and a mom of two who lives in Georgia (where this lesson's facts come from). Her job doesn't offer health insurance and she can't afford to buy a plan. She leans toward Maya Kaur but wants to know what Maya would actually do. Practical, a little tired, not hostile. She has to pick up her kids soon.",
      setting: "Bri's front door on a weekday evening, a few days before Election Day. Someone has knocked; she doesn't know who yet.",
      knows: [
        "She has no health insurance through work and can't afford to buy it.",
        "She heard Maya's opponent 'has a health plan too' and doesn't know the difference.",
      ],
      unknown: [
        "How Medicaid expansion works, who qualifies or who pays for it.",
        "What Georgia Pathways is, unless the volunteer explains it.",
        "Any number or fact the volunteer hasn't said.",
      ],
      reactions: [
        "As soon as she hears the volunteer is with Maya Kaur, she asks the question on her mind: is Maya going to do anything about health insurance for people like her, whose job doesn't offer it and who can't afford to buy it? If they haven't said who they're with, she asks.",
        "When the volunteer explains Maya's plan, she relates it to herself ('So someone like me would qualify?').",
        "At some point, if it fits, she asks what the difference is with the other guy's plan, since she heard he has one too.",
        "If something sounds too good to be true (free insurance for everyone, no rules at all), she's skeptical and asks how that would work.",
        "If the volunteer says they don't know a detail, she's fine with that and may ask where she can find out.",
        "If the volunteer gets the facts tangled, she's confused and asks them to say it again.",
      ],
      opening: { say: "Hi. Can I help you?", mood: "neutral" },
      endRule: "After about four to six exchanges, or once her questions are answered, she thanks them, says she has to get her kids and closes the door.",
      wrapAt: 5,
      hardStop: 7,
    },
    approvedFacts: [
      "Medicaid is health insurance for people with low incomes, paid by the state and federal government. About 18% of Georgians have it, and 71% of them are children.",
      "In Georgia, adults qualify for Medicaid only if they're parents earning under about $8,000 a year, or through Georgia Pathways with 80 work hours a month.",
      "About 200,000 Georgia adults earn too much for Medicaid and too little to buy health insurance (the coverage gap). Most of them work: cashiers, cooks, home health aides.",
      "Medicaid expansion under the Affordable Care Act covers all adults earning up to about $22,000 a year, and the federal government pays 90%. 40 states and DC said yes; Georgia is one of 10 that didn't.",
      "Georgia Pathways, Gov. Brian Kemp's plan from 2023, covers adults earning up to about $16,000 who prove 80 hours a month of work, school or volunteering. Its goal was 100,000 people; about 20,000 enrolled. Of about $80 million, about $54 million went to running it and $26 million to care.",
      "Maya's plan: end Georgia Pathways, pass full Medicaid expansion and fund rural hospitals (Rural Care First). She'd push the legislature to pass them; the legislature passes laws, not the governor or a senator alone.",
      "Maya will push the legislature to pass full Medicaid expansion so adults like Bri qualify; the federal government pays 90%.",
      "Full Medicaid expansion covers adults earning up to about $22,000 a year.",
      "Her Republican opponent wants a smaller plan that requires work hours, like Georgia Pathways, which covers fewer than 1 in 5 of the people the state expected. He calls it \"intelligent Medicaid expansion\" and says he'd close the coverage gap; how many it would cover isn't set.",
      "Under a 2025 federal law, adults covered by expansion will also report work hours (80 a month, with exemptions).",
    ],
    knownWrong: [
      "Saying her opponent is against Medicaid is wrong. He wants a smaller plan with work hours.",
      "Saying Maya's plan has no work rules is wrong, because of the 2025 federal law.",
      "Promising free insurance for everyone is wrong.",
    ],
    outOfScope: "Anything beyond the approved facts (when coverage would start, exact costs, how to sign up today) isn't in the lesson. The right move is to say you're not sure and offer to find out.",
    rubric: [
      { id: "gap", card: true, evidence: true, label: "Who's left out today", hit: "Said who's left out today", miss: "Didn't say who's left out today", def: "Explains the coverage gap: people like Bri earn too much for Medicaid and too little to buy insurance (about 200,000 adults). Connecting it to her ('you're one of about 200,000') is ideal; the number is a plus, not required." },
      { id: "plan", card: true, evidence: true, label: "Maya's plan", hit: "Explained Maya's plan", miss: "Didn't explain Maya's plan", def: "Says Maya will push for full Medicaid expansion so people like Bri qualify. The 90% federal share or the $22,000 line is a plus." },
      { id: "opp", card: true, evidence: true, label: "How her opponent's plan differs", hit: "Said how her opponent's plan differs", miss: "Didn't say how her opponent's plan differs", def: "Says the opponent wants a smaller plan that requires work hours, like Georgia Pathways. Partial if they only say his plan is smaller or different without the work hours." },
      { id: "accurate", card: true, evidence: false, label: "Stick to the facts", hit: "Stuck to the facts", miss: "Said something that isn't right", def: "Every claim matches the approved facts. Missed if they said anything in knownWrong or made up a number, date or promise. Met if no invented or wrong claims." },
      { id: "listen", evidence: true, label: "Connect it to her", hit: "Connected it to her situation", miss: "Didn't connect it to her", def: "Answers Bri's actual questions and ties the plan to her situation, instead of reciting the whole lesson at once." },
      { id: "close", evidence: true, label: "End it well", hit: "Ended it warmly", miss: "Didn't end it well", def: "Thanks her and lets her go when she needs to. Not_applicable if the conversation ended before anyone could say goodbye." },
    ],
  },
};

SCENARIOS.opener_first_try.rubric = SCENARIOS.kevin_intro.rubric.filter((r) => r.card).map((r) => ({ ...r }));

/* What the browser may see: everything but the prompt material, for drawing the score card */
export function publicScenario(id) {
  const s = SCENARIOS[id];
  if (!s) return null;
  return {
    id, title: s.title, coachOnly: !!s.coachOnly,
    voter: s.voter && s.voter.opening ? { name: s.voter.name, opening: s.voter.opening } : { name: s.voter.name },
    rubric: s.rubric.map(({ id: rid, label, hit, miss, card, move, avoid }) => ({ id: rid, label, hit, miss, card: !!card, move, avoid: !!avoid })),
  };
}
