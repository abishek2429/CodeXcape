// Six Persistent General Logic Riddles for the CodeXcape Meta Mystery System
// Completely independent of the storyline (no ARIA, Elena, Kai, Node 06, etc.)

export interface MysteryRiddle {
  id: number;
  levelNumber: number; // The level whose completion unlocks this riddle
  romanNumeral: string;
  title: string;
  category: string;
  clueRole: 'HOW' | 'WHAT' | 'WHEN' | 'WHICH' | 'WHY' | 'META SYNTHESIS';
  riddleText: string;
  briefPrompt: string;
}

export const SIX_MYSTERY_RIDDLES: MysteryRiddle[] = [
  {
    id: 1,
    levelNumber: 1,
    romanNumeral: 'RIDDLE I',
    title: 'THE THREE SWITCHES',
    category: 'STATE & HEAT REASONING',
    clueRole: 'HOW',
    briefPrompt: 'How can you determine which switch controls the bulb?',
    riddleText: `There are three switches outside a closed room.

Inside the room is one ordinary light bulb.

Exactly one switch controls the bulb.

You may manipulate the switches however you want.

You may enter the room ONLY ONCE.

Once inside, you may inspect the bulb but cannot return to the switches.

How can you determine which switch controls the bulb?`,
  },
  {
    id: 2,
    levelNumber: 2,
    romanNumeral: 'RIDDLE II',
    title: 'THE NUMBER LOCK',
    category: 'OBSERVATIONAL SEQUENCE',
    clueRole: 'WHAT',
    briefPrompt: 'What is the next number in the sequence?',
    riddleText: `Find the next number:

    1
    11
    21
    1211
    111221
    ?

The answer is determined by observing the relationship between consecutive lines.

Do not simply treat this as a normal arithmetic sequence.

The players must identify the transformation rule.`,
  },
  {
    id: 3,
    levelNumber: 3,
    romanNumeral: 'RIDDLE III',
    title: 'THE TWO ROPES',
    category: 'TEMPORAL MEASUREMENT',
    clueRole: 'WHEN',
    briefPrompt: 'How can you measure exactly 45 minutes?',
    riddleText: `You have two ropes.

Each rope takes exactly one hour to burn completely.

However:
• The ropes do NOT burn at a uniform rate.
• Half of a rope does NOT necessarily represent 30 minutes.
• Both ropes are otherwise identical.

You have a way to ignite either end of either rope.

Using only these two ropes and fire:

How can you measure exactly 45 minutes?`,
  },
  {
    id: 4,
    levelNumber: 4,
    romanNumeral: 'RIDDLE IV',
    title: 'THE THREE BOXES',
    category: 'TRUTH-VALUE DEDUCTION',
    clueRole: 'WHICH',
    briefPrompt: 'Which box contains the prize?',
    riddleText: `There are three boxes:

    BOX A
    BOX B
    BOX C

Exactly one box contains a prize.

Each box has one statement:

BOX A:
    "The prize is not in Box B."

BOX B:
    "The prize is in Box A."

BOX C:
    "The statement on Box A is false."

Exactly ONE of the three statements is true.

Which box contains the prize?`,
  },
  {
    id: 5,
    levelNumber: 5,
    romanNumeral: 'RIDDLE V',
    title: 'THE AGE PUZZLE',
    category: 'INVARIANCE & RELATIVITY',
    clueRole: 'WHY',
    briefPrompt: 'Determine the relationship between the father and child ages.',
    riddleText: `A father tells his child:

    "When I was your age, I was exactly 30 years older than you."

The child asks:

    "How old will you be when I am your current age?"

The father replies:

    "At that time, the difference between our ages will still be exactly the same."

Determine the relationship between the father's and child's ages.`,
  },
  {
    id: 6,
    levelNumber: 6,
    romanNumeral: 'RIDDLE VI',
    title: 'THE FINAL META RIDDLE',
    category: 'SYNTHESIS OF DISCOVERIES',
    clueRole: 'META SYNTHESIS',
    briefPrompt: 'What single idea connects all five discoveries?',
    riddleText: `I am not found by looking at one answer.

I appear only when the answers stand together.

The first may tell you HOW.
The second may tell you WHAT.
The third may tell you WHEN.
The fourth may tell you WHICH.
The fifth may tell you WHY.

But none of them is the conclusion.

Arrange what you discovered.

What single idea connects all five?`,
  },
];
