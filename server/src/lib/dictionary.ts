import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function dictionaryPath(): string {
  // Use relative path from this file to the data directory
  return resolve(__dirname, "../../../data/words_alpha.txt");
}

export const themeDictionaries: Record<string, Set<string>> = {};

export function loadDictionary(): Set<string> {
  try {
    console.log(`[dictionary] loading from: ${dictionaryPath()}`);
    const raw = readFileSync(dictionaryPath(), "utf8");
    const words = raw
      .split(/\r?\n/)
      .map((word) => word.trim().toLowerCase())
      .filter(Boolean);

    const dictionary = new Set(words);
    console.log(`[dictionary] loaded ${dictionary.size.toLocaleString("en-US")} words.`);
    
    // Load themes
    const themes = ["animals", "colors", "countries", "food", "fruits"];
    for (const theme of themes) {
      const themePath = resolve(__dirname, `../../data/themes/${theme}.txt`);
      try {
        const themeRaw = readFileSync(themePath, "utf8");
        const themeWords = themeRaw
          .split(/\r?\n/)
          .map((word) => word.trim().toLowerCase())
          .filter(Boolean);
        themeDictionaries[theme] = new Set(themeWords);
        console.log(`[dictionary] loaded theme ${theme} with ${themeWords.length} words.`);
      } catch (e) {
        console.warn(`[dictionary] Could not load theme ${theme}: ${e}`);
        themeDictionaries[theme] = new Set();
      }
    }
    
    return dictionary;
  } catch (error) {
    console.error("[dictionary] failed to load word list:", error);
    return new Set();
  }
}
