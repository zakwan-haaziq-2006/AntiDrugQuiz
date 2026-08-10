/**
 * Deterministic per-participant question and option shuffling utilities.
 */

/**
 * Converts a seed string into a 32-bit unsigned integer hash.
 */
export function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Returns a float between 0 (inclusive) and 1 (exclusive).
 */
export function createPRNG(seed: number) {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffles an array using Fisher-Yates algorithm and a seeded PRNG.
 */
export function seededShuffle<T>(array: T[], seedStr: string): T[] {
  const result = [...array];
  const prng = createPRNG(hashString(seedStr));
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface QuestionWithOptions {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  order?: number;
  setId?: number;
}

export interface OptionMapping {
  shuffledQuestion: QuestionWithOptions;
  displayedToOriginal: Record<OptionKey, OptionKey>;
  originalToDisplayed: Record<OptionKey, OptionKey>;
}

/**
 * Computes option shuffling and key translation maps for a specific question and attempt.
 */
export function getOptionMappings(
  attemptId: string,
  question: QuestionWithOptions
): OptionMapping {
  const origOptions: Array<{ key: OptionKey; text: string }> = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];

  const seed = `${attemptId}_options_${question.id}`;
  const shuffled = seededShuffle(origOptions, seed);

  const displayedKeys: OptionKey[] = ['A', 'B', 'C', 'D'];
  const displayedToOriginal = {} as Record<OptionKey, OptionKey>;
  const originalToDisplayed = {} as Record<OptionKey, OptionKey>;

  displayedKeys.forEach((dispKey, idx) => {
    const origKey = shuffled[idx].key;
    displayedToOriginal[dispKey] = origKey;
    originalToDisplayed[origKey] = dispKey;
  });

  const shuffledQuestion: QuestionWithOptions = {
    ...question,
    optionA: shuffled[0].text,
    optionB: shuffled[1].text,
    optionC: shuffled[2].text,
    optionD: shuffled[3].text,
  };

  return {
    shuffledQuestion,
    displayedToOriginal,
    originalToDisplayed,
  };
}

/**
 * Shuffles question order and option order for a complete list of questions for an attempt.
 */
export function getShuffledQuizForAttempt<T extends QuestionWithOptions>(
  attemptId: string,
  questions: T[]
) {
  // 1. Deterministically shuffle question order for this attempt
  const shuffledQuestions = seededShuffle(questions, `${attemptId}_questions`);

  // 2. Deterministically shuffle options for each question & build mappings
  const mappedQuestions = shuffledQuestions.map((q) => {
    const { shuffledQuestion, displayedToOriginal, originalToDisplayed } = getOptionMappings(
      attemptId,
      q
    );
    return {
      question: {
        ...q,
        optionA: shuffledQuestion.optionA,
        optionB: shuffledQuestion.optionB,
        optionC: shuffledQuestion.optionC,
        optionD: shuffledQuestion.optionD,
      },
      displayedToOriginal,
      originalToDisplayed,
    };
  });

  return mappedQuestions;
}
