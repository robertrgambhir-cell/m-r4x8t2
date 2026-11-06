/* The two rebuilt issue trainings (Nov 6, 2026): Maya Kaur's electric bill and school voucher lessons.
   Maya Kaur and the state of Woodbridge are a sample campaign. Each training is built from a real Democrat who won a
   competitive U.S. Senate race on Nov 3, 2026 (AP called all four Senate races these lessons come from), and the
   learner hears that once, at the end. The figures are that state's real ones; the page's sources sheet links each.
   One file holds what the server needs (the voter, the facts the coach checks, the narration it may speak) so the
   page's captions and the server's voice can never drift apart: ai/tools/build-train.py reads it for the page.
   Content structure for later campaigns: narration lines, approved facts, known wrong claims, a voter and a rubric;
   a campaign's own materials would fill the same fields. */

export const NARRATOR = "orpheus"; /* Deepgram Aura-2 speaker for the narration: a field-team voice, never presented as Maya */

export const ISSUE_SCENARIOS = {
  oh_bills: {
    title: "Your electric bill",
    lesson: "Maya's issues: your electric bill (practice at the door)",
    learnerGoal: "A voter on a fixed income asks what Maya will do about her electric bill. Connect it to her bill, say why bills went up, explain Maya's plan and how her opponent's bill differs, using only the approved facts, and answer her questions honestly.",
    credit: { name: "Sherrod Brown", race: "U.S. Senate in Ohio", state: "Ohio" },
    narration: [
      "Here's Maya's fight on electric bills, in under a minute.",
      "Start with the bill. In 2019, the average home here paid about eighty-nine dollars a month.",
      "This January, about a hundred and forty-five. That's up more than half.",
      "The biggest new reason? Data centers. Giant buildings full of computers that run the internet and AI, all day and all night.",
      "The grid's independent watchdog found data centers drove forty-five percent of the costs in the grid's last three power auctions. And that lands on everyone's bill.",
      "Maya's answer fits in one line. In her words: I'll require the data centers to pay the full cost of their own electricity, not you.",
      "She's also fighting to cap how much utility companies can raise your rates.",
      "Her opponent has a bill too. But it only asks each state to consider making data centers pay. No state has to. And it stalled in the Senate.",
      "So at the door: their bill, the reason, then Maya's fix. Quick check, then you'll talk it through with a real voter.",
    ],
    voter: {
      name: "Barb",
      persona: "Barb, 67, a retired school bus driver who lives alone on a fixed income in the state of Woodbridge. Her electric bill has jumped to about $145 a month and she has been keeping the heat low to save money. She likes Maya Kaur but is tired of politicians promising things. Friendly, blunt, a little worn down.",
      setting: "Barb's front porch on a chilly evening a few days before Election Day. A volunteer has knocked and she has opened the door.",
      knows: [
        "Her electric bill went from under $90 a month a few years ago to about $145 now.",
        "She has seen big data centers going up outside town and heard they bring some jobs.",
        "She heard Maya's opponent 'has a bill on this too' but doesn't know what it does.",
      ],
      unknown: [
        "Why bills went up, unless the volunteer explains it.",
        "What either candidate's plan does, unless the volunteer explains it.",
        "Any number, date or fact the volunteer hasn't said.",
      ],
      reactions: [
        "Her first question is the one on her mind: is Maya going to do anything about these electric bills? Ask it as soon as the volunteer says they're with Maya, in your own words.",
        "If the volunteer says data centers are driving costs, she asks a fair follow-up in her own words, like whether those places don't bring jobs, or whether Maya wants to get rid of them.",
        "At some point, if it fits, she asks what the difference is with the other candidate, since she heard he has a bill too.",
        "If the volunteer promises her bill will drop by a set amount or by a date, she's skeptical and asks how they can know that.",
        "If the volunteer ties it to her own bill and explains it plainly, she warms up ('Well, that sounds fair').",
        "If the volunteer says they don't know a detail, she's fine with it and may ask where she could find out.",
        "If the volunteer gets tangled, she says she's lost and asks them to put it simply.",
      ],
      opening: { say: "Oh, hi. Are you with Maya Kaur? Because I've got a bone to pick about my electric bill.", mood: "neutral" },
      voice: "cordelia", voices: ["cordelia", "hera", "vesta"],
      endRule: "After about four to six exchanges, or once her questions are answered, she thanks them in her own words, says it's cold and goes back inside.",
      wrapAt: 5,
      hardStop: 7,
    },
    approvedFacts: [
      "The average home electric bill in the state was about $89 a month in 2019 and about $145 a month this January, up more than half.",
      "Data centers are buildings full of computers that run the internet and AI around the clock, and they use huge amounts of power.",
      "The power grid's independent watchdog found data centers drove about 45% of the costs in the grid's last three power auctions (about $21 billion of $47 billion). Those costs flow into everyone's bill.",
      "Maya's plan: require data centers to pay the full cost of their own electricity, so homes and small businesses don't pay for it. In her words: 'I'll require the data centers to pay the full cost of their own electricity, not you.'",
      "Maya is also fighting to cap how much utility companies can raise rates. She hasn't published the details.",
      "Maya hasn't proposed banning data centers. Her plan is that they pay their own way.",
      "Her Republican opponent's bill only asks each state to consider rules making data centers pay for grid upgrades. No state has to adopt them. It passed the House 417 to 3 and stalled in the Senate, with 57 votes when 60 were needed.",
      "A U.S. senator votes on federal rules for the power grid. The state sets local electric rates and tax breaks.",
      "An old power-company bailout law, passed with bribes, isn't why bills are up now: its charges were repealed or have ended.",
    ],
    knownWrong: [
      "Saying her opponent's bill requires or makes data centers pay is wrong: it only asks states to consider it.",
      "Saying Maya wants to ban or shut down data centers is wrong.",
      "Promising her bill will go down by a set amount or by a set date is wrong: no number or date has been promised.",
      "Saying the old bailout scandal is the main reason bills are up now is wrong.",
      "Saying Maya can set the state's electric rates herself is wrong.",
    ],
    outOfScope: "Anything beyond the approved facts (when bills would drop, by how much, help paying her bill today, how many jobs data centers bring) isn't in the lesson. The right move is to say you're not sure and offer to find out.",
    rubric: [
      { id: "bill", card: true, evidence: true, label: "Start with her bill", hit: "Started with her bill", miss: "Didn't start with her bill", def: "Acknowledges Barb's bill and says bills are up for everyone (more than half since 2019, or about $89 to $145 a month). Partial if they only sympathize without the fact." },
      { id: "why", card: true, evidence: true, label: "Say why bills went up", hit: "Said why bills went up", miss: "Didn't say why bills went up", def: "Says data centers' power demand is the biggest new reason bills went up. The watchdog's 45% is a plus, not required." },
      { id: "plan", card: true, evidence: true, label: "Maya's plan", hit: "Explained Maya's plan", miss: "Didn't explain Maya's plan", def: "Says Maya would require data centers to pay the full cost of their own electricity, not regular customers. Capping rate hikes is a plus." },
      { id: "opp", card: true, evidence: true, label: "How her opponent's bill differs", hit: "Said how his bill differs", miss: "Didn't say how his bill differs", def: "Says the opponent's bill only asks states to consider it, so it's voluntary and no state has to. Partial if they only say it's weaker without saying why." },
      { id: "accurate", card: true, evidence: false, label: "Stick to the facts", hit: "Stuck to the facts", miss: "Said something that isn't right", def: "Every claim matches the approved facts. Missed if they said anything in knownWrong or made up a number, date or promise. Met if no invented or wrong claims." },
      { id: "listen", evidence: true, label: "Answer her questions", hit: "Answered her questions", miss: "Talked past her questions", def: "Answers what Barb actually asks (about jobs, the other candidate's bill, when bills drop) instead of reciting the whole lesson." },
      { id: "close", evidence: true, label: "End it well", hit: "Ended it warmly", miss: "Didn't end it well", def: "Thanks her and lets her go when she's ready. Not_applicable if the conversation ended before anyone could say goodbye." },
    ],
  },

  tx_vouchers: {
    title: "School vouchers",
    lesson: "Maya's issues: school vouchers (practice at the door)",
    learnerGoal: "An undecided dad asks what Maya thinks about school vouchers and pushes back with his sister's good experience. Explain where the money goes, Maya's view and how her opponent differs, using only the approved facts, while respecting his sister's choice and never promising what a senator can't do.",
    credit: { name: "James Talarico", race: "U.S. Senate in Texas", state: "Texas" },
    narration: [
      "Here's Maya's fight on school vouchers, in under a minute.",
      "A voucher is tax money a family can spend on private school. This state started them this school year.",
      "It took a billion dollars to start, out of the same budget that pays for public schools.",
      "Here's what surprises people. Seven in ten vouchers went to kids who weren't in public school to begin with. They were already in private school, or homeschooled.",
      "And it's built to grow. The state comptroller has already asked to double it, to more than two billion dollars.",
      "Maya taught in a public school, and she led the fight against vouchers in the legislature. She calls them a program taking tax dollars out of our public schools.",
      "In the Senate, she'd reject what she calls the voucher scams, protect funding for special education and hire more teachers.",
      "Her opponent backs vouchers. As attorney general, he promised to vigorously defend the law.",
      "One thing to get right: a senator can't cancel a state program, so never promise that. Quick check, then you'll talk it through with a real voter.",
    ],
    voter: {
      name: "Ray",
      persona: "Ray, 48, a ranch foreman and dad of two kids at the public school in his small town in the state of Woodbridge. There's no private school within an hour of town. His sister in the city got a voucher for her daughter, who is doing well at a small private school. He's undecided about vouchers: fair-minded, plain-spoken, proud of his kids' school and loyal to his sister.",
      setting: "Ray's driveway late on a weekday afternoon, a few days before Election Day. He's just gotten home and is standing by his truck when a volunteer walks up.",
      knows: [
        "His kids' school is the only school in town, and there's no private school within an hour.",
        "His sister got a voucher for her daughter and is happy with it.",
        "He's heard the other candidate is for vouchers.",
      ],
      unknown: [
        "Who got the vouchers, how much they cost or where the money comes from, unless the volunteer explains it.",
        "What Maya would do about vouchers, unless the volunteer explains it.",
        "Any number, date or fact the volunteer hasn't said.",
      ],
      reactions: [
        "Once he knows they're with Maya, he asks what Maya thinks about these school vouchers, in your own words.",
        "When the volunteer explains Maya's view, he pushes back fairly, in his own words: his sister's girl got one and she's doing great, so what's wrong with giving families a choice?",
        "If the volunteer respects his sister's choice and explains the trade-off plainly (where the money comes from, who got most of the vouchers), he takes it seriously and may say he didn't know that.",
        "If the volunteer runs down voucher families or his sister, he gets a little defensive.",
        "If it fits, he asks where the other candidate stands.",
        "If the volunteer promises Maya will end the state's voucher program, he's doubtful and asks whether a senator can even do that.",
        "If the volunteer says they don't know a detail, he's fine with it.",
      ],
      opening: { say: "Afternoon. You with one of the campaigns? I've been wondering where folks stand on these school vouchers.", mood: "neutral" },
      voice: "janus", voices: ["janus", "orion", "mars"],
      endRule: "After about four to six exchanges, or once he's heard enough, he thanks them in his own words, says he's going to think on it and heads inside for supper.",
      wrapAt: 5,
      hardStop: 7,
    },
    approvedFacts: [
      "A voucher is state tax money a family can spend on private school. The state started vouchers this school year.",
      "The state set aside $1 billion to start, from the same state budget that pays for public schools.",
      "About 110,000 students got one this fall, and more than 100,000 more families are on the waiting list.",
      "Seven in ten vouchers went to students who weren't in public school before: they were already in private school or homeschooled (state data, reported by parents).",
      "The state comptroller has asked lawmakers to double the program to more than $2 billion.",
      "Maya is a former public school teacher who led the fight against vouchers in the state legislature. She calls vouchers 'a program that is taking tax dollars out of our public schools.' In the Senate she'd 'reject the voucher scams,' protect federal oversight so special education students get their funding, and hire more teachers.",
      "Maya tried to put the voucher plan to a statewide vote; the state House rejected that, 86 to 62.",
      "Her Republican opponent backs vouchers. As attorney general, he promised to 'vigorously defend' the voucher law.",
      "A U.S. senator can't cancel a state's voucher program. The Senate votes on federal education funding and programs.",
    ],
    knownWrong: [
      "Saying Maya will cancel, end or repeal the state's voucher program is wrong: a senator can't cancel a state law.",
      "Saying most vouchers went to kids leaving public schools is wrong: 7 in 10 weren't in public school before.",
      "Calling voucher families greedy, or dismissing his sister's choice, is wrong.",
      "Saying her opponent wants to close public schools is wrong.",
    ],
    outOfScope: "Anything beyond the approved facts (how to apply, whether his family qualifies, exactly how much his school district loses) isn't in the lesson. The right move is to say you're not sure and offer to find out.",
    rubric: [
      { id: "money", card: true, evidence: true, label: "Where the money goes", hit: "Said where the money goes", miss: "Didn't say where the money goes", def: "Explains where voucher money goes: 7 in 10 went to kids already in private school or homeschooled, or it comes out of the same budget as public schools ($1 billion to start). Either point counts." },
      { id: "plan", card: true, evidence: true, label: "Maya's view", hit: "Explained Maya's view", miss: "Didn't explain Maya's view", def: "Says Maya opposes vouchers and wants to protect public school funding (fight vouchers in the Senate, special education funding, more teachers). Her being a former teacher is a plus." },
      { id: "respect", card: true, evidence: true, label: "Respect his sister's choice", hit: "Respected his sister's choice", miss: "Brushed off his sister's choice", def: "Acknowledges Ray's sister's experience as real and fair before explaining the trade-off, without running down voucher families. Missed if they dismiss or criticize her. Not_applicable if Ray never mentioned his sister." },
      { id: "opp", card: true, evidence: true, label: "How her opponent differs", hit: "Said how her opponent differs", miss: "Didn't say how her opponent differs", def: "Says the opponent backs vouchers (as attorney general he vowed to vigorously defend the law)." },
      { id: "accurate", card: true, evidence: false, label: "Stick to the facts", hit: "Stuck to the facts", miss: "Said something that isn't right", def: "Every claim matches the approved facts. Missed if they said anything in knownWrong, promised Maya would end the state program or made up a number, date or promise. Met if no invented or wrong claims." },
      { id: "close", evidence: true, label: "End it well", hit: "Ended it warmly", miss: "Didn't end it well", def: "Thanks him and lets him go when he's ready. Not_applicable if the conversation ended before anyone could say goodbye." },
    ],
  },
};
