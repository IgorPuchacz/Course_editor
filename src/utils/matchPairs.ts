import { MatchPairsTile } from '../types/lessonEditor';

export const MATCH_PAIRS_PLACEHOLDER_REGEX = /__+/g;

const generateBlankId = () => `blank-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const countBlanksInPrompt = (prompt: string): number => {
  if (!prompt) {
    return 0;
  }

  const matches = prompt.match(MATCH_PAIRS_PLACEHOLDER_REGEX);
  return matches ? matches.length : 0;
};

export const synchronizeBlanksWithPrompt = (
  prompt: string,
  existingBlanks: MatchPairsTile['content']['blanks']
): MatchPairsTile['content']['blanks'] => {
  const blankCount = countBlanksInPrompt(prompt);
  const synchronized: MatchPairsTile['content']['blanks'] = [];

  for (let index = 0; index < blankCount; index += 1) {
    const existing = existingBlanks[index];
    synchronized.push({
      id: existing?.id ?? generateBlankId(),
      correctOptionId: existing?.correctOptionId ?? null
    });
  }

  return synchronized;
};

export const ensureValidBlankAssignments = (
  blanks: MatchPairsTile['content']['blanks'],
  options: MatchPairsTile['content']['options']
): MatchPairsTile['content']['blanks'] => {
  const optionIds = new Set(options.map((option) => option.id));

  return blanks.map((blank) => ({
    ...blank,
    correctOptionId: blank.correctOptionId && optionIds.has(blank.correctOptionId)
      ? blank.correctOptionId
      : null
  }));
};

export const promptToRichText = (prompt: string): string => {
  if (!prompt) {
    return '<p style="margin: 0;"><br /></p>';
  }

  const lines = prompt.split(/\n+/).map((line) => line.trim());

  return lines
    .map((line) => (
      line.length > 0
        ? `<p style="margin: 0;">${line}</p>`
        : '<p style="margin: 0;"><br /></p>'
    ))
    .join('');
};
