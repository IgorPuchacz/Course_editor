export interface BlanksPlaceholderDefinition {
  answerText: string;
  blankId: string;
  optionId: string;
}

const PLACEHOLDER_SOURCE = '\\{\\{(.*?)\\}\\}';

export const createPlaceholderRegex = () => new RegExp(PLACEHOLDER_SOURCE, 'g');

const slugify = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
};

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength);
};

const ensureBase = (value: string, index: number): string => {
  return value || `element-${index + 1}`;
};

export const createBlankId = (answerText: string, index: number): string => {
  const slug = truncate(slugify(answerText), 32);
  return `blank-${ensureBase(slug, index)}-${index + 1}`;
};

export const createAutoOptionId = (answerText: string, index: number): string => {
  const slug = truncate(slugify(answerText), 32);
  return `auto-${ensureBase(slug, index)}-${index + 1}`;
};

export const extractPlaceholdersFromTemplate = (template: string): BlanksPlaceholderDefinition[] => {
  const regex = createPlaceholderRegex();
  const placeholders: BlanksPlaceholderDefinition[] = [];
  let match: RegExpExecArray | null;
  let occurrenceIndex = 0;

  while ((match = regex.exec(template)) !== null) {
    const answerText = (match[1] ?? '').trim();
    if (!answerText) {
      continue;
    }

    const blankId = createBlankId(answerText, occurrenceIndex);
    const optionId = createAutoOptionId(answerText, occurrenceIndex);

    placeholders.push({
      answerText,
      blankId,
      optionId
    });

    occurrenceIndex += 1;
  }

  return placeholders;
};
