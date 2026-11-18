/* Voter sheets for the spoken practice after each issue training the app shows (the ids in ISSUE_IDS, ai/scenarios-issues.js).
   WRITTEN OUT by ai/tools/sync-issue-trainings.py from voters/scenarios.js in the issue-trainings repo, where each sheet is
   written with its training. Do not edit here: change the sheet there and run the tool again. Only the wired trainings'
   sheets are here; this repo is public and the other trainings' sheets stay in that one.
   A sheet holds the voter (persona, setting, what she knows and doesn't, how she reacts, her first line, when she ends it),
   the approved facts, the known wrong claims, what is outside the training and the rubric. The door answer has four parts,
   in order: agree with the voter, offer help she may qualify for (or explain the cause in one sentence), give the choice
   between the candidates, then ask for the vote. */
export const ISSUE_SCENARIOS_V2 = {
  "oil": {
    "title": "Heating oil",
    "lesson": "Maya's issues: heating oil (practice at the door)",
    "learnerGoal": "Sarah can't afford to fill her heating oil tank. Agree with her, tell her about the state's heating help, give her the choice between Maya Kaur and Jack Dufner on the war with Iran and heating help, then ask for her vote. Use only the approved facts.",
    "doorAnswer": [
      "Agree: \"That sounds really hard. Heating oil costs about 80% more than last fall.\"",
      "Help: \"The state's heating help covers renters too, and a family of four earning up to $73,213 a year can qualify. I can text you the link.\"",
      "Choice: \"Jack Dufner voted five times against ending the war with Iran before he voted to end it. Maya Kaur would end the war and put more money into LIHEAP, the federal heating help.\"",
      "Ask: \"Can Maya count on your vote on Tuesday?\""
    ],
    "voter": {
      "name": "Sarah",
      "persona": "Sarah, 41, works at a grocery store and heats her rented house in the state of Franklin with oil. Her monthly heating bill went from about $100 last fall to about $180. She is worried, not angry, and has not decided how to vote.",
      "setting": "Sarah's front door on a cold November evening, a few days before Election Day. A canvasser has knocked.",
      "knows": [
        "Her heating oil price jumped this year.",
        "She has heard there is a war with Iran but not how it connects to her bill."
      ],
      "unknown": [
        "Why heating oil rose, unless the canvasser explains it.",
        "That the state has heating help that covers renters.",
        "What either candidate has done, unless the canvasser says it."
      ],
      "reactions": [
        "Her first line is about her tank. If the canvasser goes straight to a pitch, she says she just wants to know how she is supposed to pay for heat.",
        "If the canvasser tells her about the heating help, she asks whether renters can get it.",
        "If the canvasser says Jack Dufner never voted to end the war, she says she read that he did.",
        "If the canvasser explains the cause plainly, she says that makes sense and asks what Maya would do."
      ],
      "opening": {
        "say": "I can't afford to fill my tank this winter.",
        "mood": "neutral"
      },
      "voice": "thalia",
      "voices": [
        "thalia",
        "luna",
        "andromeda"
      ],
      "endRule": "After four to six exchanges, or once her questions are answered, she thanks them and says she has to get back inside where it is warm.",
      "wrapAt": 5,
      "hardStop": 7
    },
    "approvedFacts": [
      "In fall 2026, heating oil costs $6.01 a gallon in the state, up from $3.33 in fall 2025: about 80% more.",
      "About half of the state's homes heat with oil.",
      "In late February 2026 the US and Israel went to war with Iran, and Iran barred cargo ships from the Strait of Hormuz. Less oil and fuel reached the world, and fuel prices rose around the world, including heating oil.",
      "Jack Dufner voted five times against ending the war with Iran before he voted to end the war.",
      "Jack Dufner pushed for the release of up to 315,000 barrels of heating oil from a federal reserve, an amount an analyst called \"a very, very small volume.\"",
      "Maya Kaur would end the war with Iran and send more money to LIHEAP, the federal program that helps families pay for heat.",
      "As state Senate President in 2023, Maya Kaur helped pass $40 million more for heating aid and $450 relief checks to more than 880,000 residents.",
      "The state's heating help covers renters, up to $73,213 a year in income for a family of four."
    ],
    "knownWrong": [
      "Saying Jack Dufner never voted to end the war.",
      "Promising Sarah's bill will drop by a set amount or date.",
      "Saying Sarah qualifies for help without knowing her income (\"may qualify\" is right)."
    ],
    "outOfScope": "Anything beyond the approved facts (when heating oil prices will come down, how much help Sarah would get, what her landlord has to do, how to apply beyond the link) is not in the training. The right move is to say you're not sure and offer to find out.",
    "rubric": [
      {
        "id": "agree",
        "card": true,
        "evidence": true,
        "label": "Agree with Sarah",
        "hit": "Agreed with Sarah",
        "miss": "Didn't agree with Sarah first",
        "def": "Acknowledges her situation before explaining anything."
      },
      {
        "id": "help",
        "card": true,
        "evidence": true,
        "label": "Offer the heating help",
        "hit": "Offered the heating help",
        "miss": "Didn't offer the heating help",
        "def": "Says the state heating help covers renters and offers to send the link."
      },
      {
        "id": "choice",
        "card": true,
        "evidence": true,
        "label": "Give the choice",
        "hit": "Gave the choice between the candidates",
        "miss": "Didn't give the choice between the candidates",
        "def": "States Jack Dufner's war votes with the concession and Maya Kaur's plan."
      },
      {
        "id": "ask",
        "card": true,
        "evidence": true,
        "label": "Ask for her vote",
        "hit": "Asked for her vote",
        "miss": "Didn't ask for her vote",
        "def": "Asks Sarah directly for her vote."
      },
      {
        "id": "accurate",
        "evidence": false,
        "label": "Stick to the facts",
        "hit": "Stuck to the facts",
        "miss": "Said something that isn't right",
        "def": "Every claim matches the approved facts. Missed if they said one of the known wrong claims or made up a number, date or promise. Met if no invented or wrong claims."
      }
    ]
  },
  "social": {
    "title": "Social Security",
    "lesson": "Maya's issues: Social Security (practice at the door)",
    "learnerGoal": "Linda lives on her Social Security check and has heard it will be cut. Agree with her, explain in one sentence why the trust fund is running short and what happens to her check, give her the choice between Maya Kaur and Jack Dufner, then ask for her vote. Never say checks will stop or that Jack Dufner voted to cut her check.",
    "doorAnswer": [
      "Agree: \"You're right to worry. Unless Congress acts, checks like yours get about 22% smaller at first when the trust fund runs out in late 2032.\"",
      "Cause: \"Fewer workers pay in for each person getting a check, so Social Security pays out more than it takes in. Checks don't stop; they get smaller.\"",
      "Choice: \"Jack Dufner voted for the 2025 federal law, which makes the trust fund run out sooner, though it gave people 65 and over a tax break. Maya Kaur would end the wage cap, so pay above $184,500 a year pays Social Security tax too.\"",
      "Ask: \"Can Maya count on your vote?\""
    ],
    "voter": {
      "name": "Linda",
      "persona": "Linda, 68, a retired grocery store manager in Franklin. Her Social Security check, about $2,080 a month, is nearly all she lives on. She has heard on the news that Social Security is going broke. She votes every time and likes straight answers.",
      "setting": "Linda's front step on a cool afternoon a few days before Election Day. Her mail is in her hand.",
      "knows": [
        "She has heard Social Security is \"going broke.\"",
        "She has heard Jack Dufner say he will never cut Social Security.",
        "She got a raise in her check this year."
      ],
      "unknown": [
        "When the trust fund runs out, unless the canvasser says it.",
        "That checks would drop to about 78%, not stop.",
        "What the wage cap is.",
        "How Jack Dufner voted on the 2025 law."
      ],
      "reactions": [
        "Her first line is about Social Security going broke.",
        "If the canvasser says her check will stop, she asks whether that is really true.",
        "If the canvasser says Jack Dufner voted to cut her check, she says he told her he never would.",
        "If the canvasser explains the 2025 law and the tax break, she says she already pays no tax on her check, so the tax break did nothing for her.",
        "If the canvasser explains the wage cap, she asks whether that fixes it for good; she nods at \"a big share, not all of it.\""
      ],
      "opening": {
        "say": "Is my Social Security going to run out?",
        "mood": "neutral"
      },
      "voice": "vesta",
      "voices": [
        "vesta",
        "cordelia",
        "hera"
      ],
      "endRule": "After four to six exchanges, or once her questions are answered, she says she has to get back inside.",
      "wrapAt": 5,
      "hardStop": 7
    },
    "approvedFacts": [
      "About 2 of every 10 people in the state get a Social Security check (Social Security Administration, December 2025).",
      "The state's average retired-worker check was about $2,078 a month in December 2025.",
      "Workers pay 6.2% of their pay and employers pay 6.2%, on pay up to $184,500 a year in 2026 (the wage cap). Pay above the cap pays no Social Security tax.",
      "In years when more came in than went out, the extra was saved in the trust fund: savings lent to the federal government, which has always paid them back with interest.",
      "Social Security now pays out more than it takes in because fewer workers pay in for each person getting a check: about 5 in 1960 and about 2.6 in 2025.",
      "The trustees expect the retirement trust fund to run out in late 2032. From then on the money coming in pays about 78% of each check at first, less in later years, unless Congress acts. Checks do not stop. For Linda that is about $460 a month less, in today's dollars.",
      "Jack Dufner voted for the 2025 federal law. Social Security's chief actuary said the law makes the trust funds run out sooner, mainly because less income tax on Social Security checks flows into them, partly through its tax break for people 65 and over. The chief actuary's Aug 2025 letter estimated that the law moves the date for the two trust funds together from the third quarter of 2034 to the first quarter of 2034, about six months sooner (the retirement trust fund that pays her check runs out in late 2032).",
      "The tax break is an extra $6,000 deduction for people 65 and over, 2025 through 2028, smaller above $75,000 of income. It does not end tax on Social Security; about two thirds of people collecting already paid no tax on their checks.",
      "Jack Dufner said: \"I have not voted for cuts to Social Security benefits, and I will not support cuts to Social Security benefits.\" No vote of his cut a check. His plan is a panel from both parties whose answer Congress would vote on, yes or no. He voted in 2024 for a law that raised checks for some people with public pensions.",
      "Jack Dufner was reported in 2024 as not supporting raising the retirement age; in October 2026, asked about it, he said only that it is \"a very different conversation\" for a 20-year-old than for someone at retirement age.",
      "Maya Kaur would end the wage cap so pay above $184,500 a year pays Social Security tax too, and she is not in favor of raising the retirement age. Social Security's actuaries estimated in 2021 that ending the cap would push the trust fund run-out about 20 years later, and it would close about half or more of the 75-year gap, not all of it.",
      "People without legal status cannot collect Social Security checks, though many pay Social Security tax from their pay.",
      "If Linda says Maya Kaur also wants no tax on Social Security: Maya Kaur did say at the Oct 7, 2026 debate that she supports no tax on Social Security; she would also end the wage cap to bring more money into the trust fund."
    ],
    "knownWrong": [
      "Saying checks will stop or Social Security will go broke.",
      "Saying Jack Dufner voted to cut her check or wants to raise the retirement age.",
      "Saying the 2025 law ended taxes on Social Security.",
      "Saying Congress stole or raided the trust fund.",
      "Blaming immigrants for the shortfall.",
      "Saying ending the wage cap fixes Social Security for good.",
      "Saying the 2025 law alone moved the date to 2032.",
      "Saying he voted to cut Social Security by $450 million (a 2024 committee bill that would have cut its office budget, not checks).",
      "Mixing up 2034 (both trust funds together) with late 2032 (the retirement trust fund that pays her check)."
    ],
    "outOfScope": "Anything beyond the approved facts (what Congress will do or when, Linda's exact check in a later year, Medicare, her own taxes beyond the facts above) is not in the training. The right move is to say you're not sure and offer to find out.",
    "rubric": [
      {
        "id": "agree",
        "card": true,
        "evidence": true,
        "label": "Agree with Linda",
        "hit": "Agreed with Linda",
        "miss": "Didn't agree with Linda first",
        "def": "Takes her worry seriously and says checks get smaller, not that they stop."
      },
      {
        "id": "cause",
        "card": true,
        "evidence": true,
        "label": "Explain the cause",
        "hit": "Explained the cause",
        "miss": "Didn't explain the cause",
        "def": "Says fewer workers pay in for each person getting a check, so the trust fund runs out in late 2032."
      },
      {
        "id": "choice",
        "card": true,
        "evidence": true,
        "label": "Give the choice",
        "hit": "Gave the choice between the candidates",
        "miss": "Didn't give the choice between the candidates",
        "def": "States Jack Dufner's vote on the 2025 law with the tax-break concession, and Maya Kaur's plan to end the wage cap."
      },
      {
        "id": "ask",
        "card": true,
        "evidence": true,
        "label": "Ask for her vote",
        "hit": "Asked for her vote",
        "miss": "Didn't ask for her vote",
        "def": "Asks Linda directly for her vote."
      },
      {
        "id": "accurate",
        "evidence": false,
        "label": "Stick to the facts",
        "hit": "Stuck to the facts",
        "miss": "Said something that isn't right",
        "def": "Every claim matches the approved facts. Missed if they said one of the known wrong claims or made up a number, date or promise. Met if no invented or wrong claims."
      }
    ]
  }
};
