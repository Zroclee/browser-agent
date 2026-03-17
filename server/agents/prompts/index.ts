import fs from 'node:fs';
import path from 'node:path';

const promptsDirectory = path.resolve(__dirname, 'mds');

const loadMarkdownPrompts = (): Record<string, string> => {
  if (!fs.existsSync(promptsDirectory)) {
    return {};
  }

  const promptFiles = fs
    .readdirSync(promptsDirectory)
    .filter((fileName) => fileName.toLowerCase().endsWith('.md'));

  return promptFiles.reduce<Record<string, string>>((acc, fileName) => {
    const promptName = path.basename(fileName, '.md').toUpperCase();
    const promptPath = path.resolve(promptsDirectory, fileName);
    acc[promptName] = fs.readFileSync(promptPath, 'utf-8').trim();
    return acc;
  }, {});
};

export const PROMPTS = loadMarkdownPrompts();
export const PLAYWRIGHT_PROMPT = PROMPTS.PLAYWRIGHT_PROMPT ?? '';
