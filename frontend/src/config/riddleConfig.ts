// Six General Logic Riddles for the CodeXcape Riddle System
// Completely standalone logic and reasoning problems with no story dependencies.
// IMPORTANT: Correct answers exist exclusively on the server and are never exposed here.

export interface MysteryRiddle {
  id: number;
  levelNumber: number; // The level whose completion unlocks this riddle
  romanNumeral: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Easy/Medium' | 'Medium' | 'Medium/Hard' | 'Hard' | 'Hardest';
  briefPrompt: string;
  riddleText: string;
}

export const SIX_MYSTERY_RIDDLES: MysteryRiddle[] = [
  {
    id: 1,
    levelNumber: 1,
    romanNumeral: 'RIDDLE I',
    title: 'THE SPRINTERS',
    category: 'ORDERING DEDUCTION',
    difficulty: 'Easy',
    briefPrompt: 'In which numbered place did Runner C finish? (0–9)',
    riddleText: `Five sprinters—A, B, C, D, and E—competed in a final sprint with no ties:

1. Runner D finished in 1st place.
2. Runner B finished ahead of Runner C.
3. Runner E finished behind Runner C.
4. Runner A finished behind Runner E.

In which place (1, 2, 3, 4, or 5) did Runner C finish?`,
  },
  {
    id: 2,
    levelNumber: 2,
    romanNumeral: 'RIDDLE II',
    title: 'THE MAGIC SQUARE',
    category: 'GRID CONSTRAINT',
    difficulty: 'Easy/Medium',
    briefPrompt: 'What single digit replaces the question mark? (0–9)',
    riddleText: `A 3×3 grid contains the digits 1 through 9, each used exactly once.
Every row, every column, and both main diagonals sum to the exact same total: 15.

Row 1:  [ 2 ]  [ 7 ]  [ 6 ]   (Sum = 15)
Row 2:  [ 9 ]  [ 5 ]  [ 1 ]   (Sum = 15)
Row 3:  [ 4 ]  [ 3 ]  [ ? ]   (Sum = 15)

Check Row 3: 4 + 3 + ? = 15
Check Column 3: 6 + 1 + ? = 15
Check Diagonal: 2 + 5 + ? = 15

What single digit replaces the question mark?`,
  },
  {
    id: 3,
    levelNumber: 3,
    romanNumeral: 'RIDDLE III',
    title: 'THE THREE INHABITANTS',
    category: 'TRUTH-VALUE LOGIC',
    difficulty: 'Medium',
    briefPrompt: 'How many Liars are among the three inhabitants? (0–9)',
    riddleText: `On an island, every inhabitant is either:
• A Truth-teller (who always tells the truth), or
• A Liar (who always lies).

Three inhabitants—X, Y, and Z—stand before you:

• Inhabitant X says: "All three of us are Liars."
• Inhabitant Y says: "Exactly one of us is a Truth-teller."
• Inhabitant Z remains silent.

Deduce the identity of each inhabitant.

How many LIARS are there among the three inhabitants (X, Y, and Z)?`,
  },
  {
    id: 4,
    levelNumber: 4,
    romanNumeral: 'RIDDLE IV',
    title: 'THE NUMBER LOCK',
    category: 'CONSTRAINT SATISFACTION',
    difficulty: 'Medium/Hard',
    briefPrompt: 'What is the middle digit of the 3-digit combination? (0–9)',
    riddleText: `A lock has a 3-digit combination code. Five clues are given:

• [ 6  8  2 ] — One digit is correct and well-placed.
• [ 6  1  4 ] — One digit is correct but wrongly placed.
• [ 2  0  6 ] — Two digits are correct but both are wrongly placed.
• [ 7  3  8 ] — Nothing is correct.
• [ 8  7  0 ] — One digit is correct but wrongly placed.

Deduce the unique 3-digit combination code.

What is the MIDDLE digit of this 3-digit combination code?`,
  },
  {
    id: 5,
    levelNumber: 5,
    romanNumeral: 'RIDDLE V',
    title: 'THE FOUR SUSPECTS',
    category: 'PERSPECTIVE DEDUCTION',
    difficulty: 'Hard',
    briefPrompt: 'How many true statements were made by the thief? (0–9)',
    riddleText: `Four suspects—A, B, C, and D—make statements about who stole a jewel.
Exactly ONE of the four suspects stole the jewel.

• A says: "B stole it."
• B says: "D stole it."
• C says: "I did not steal it."
• D says: "B is lying about me."

It is known that exactly THREE of the four statements are TRUE, and only ONE statement is FALSE.

Deduce who stole the jewel.

How many TRUE statements were made by the person who stole the jewel?`,
  },
  {
    id: 6,
    levelNumber: 6,
    romanNumeral: 'RIDDLE VI',
    title: 'THE CRYPTARITHM',
    category: 'ALPHAMETIC ARITHMETIC',
    difficulty: 'Hardest',
    briefPrompt: 'What single digit is represented by the letter S? (0–9)',
    riddleText: `In the classic alphametic puzzle, each distinct letter represents a unique single digit from 0 to 9, and no multi-digit number starts with 0:

    S E N D
  + M O R E
  ---------
  M O N E Y

Deduce the unique mathematical assignment for each letter.

What single digit (0–9) is represented by the letter S?`,
  },
];
