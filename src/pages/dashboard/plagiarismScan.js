export const ACCEPTED_CHECK_FILE_TYPES =
  "image/png,image/jpeg,image/jpg,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv,application/json,.txt,.md,.csv,.json,.rtf,.pdf,.doc,.docx";

const readableExtensions = [
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".json",
  ".rtf",
  ".html",
  ".htm",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
];

const readableTypes = [
  "text/",
  "application/json",
  "application/xml",
  "application/x-ndjson",
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getExtension(fileName = "") {
  const cleanName = fileName.toLowerCase();
  const dotIndex = cleanName.lastIndexOf(".");

  return dotIndex >= 0 ? cleanName.slice(dotIndex) : "";
}

export function getFileKind(file) {
  if (!file) {
    return "File";
  }

  if (file.type?.startsWith("image/")) {
    return "Picture";
  }

  const extension = getExtension(file.name);

  if (extension === ".pdf") {
    return "PDF";
  }

  if (extension === ".doc" || extension === ".docx") {
    return "Document";
  }

  if (isReadableFile(file)) {
    return "Text file";
  }

  return "File";
}

export function formatFileSize(size = 0) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isReadableFile(file) {
  if (!file) {
    return false;
  }

  const extension = getExtension(file.name);

  return (
    readableExtensions.includes(extension) ||
    readableTypes.some((typePrefix) => file.type?.startsWith(typePrefix))
  );
}

export async function readTextFromFiles(files = []) {
  const readableFiles = [];
  const unreadableFiles = [];
  const textBlocks = [];

  for (const file of files) {
    if (!isReadableFile(file)) {
      unreadableFiles.push(file);
      continue;
    }

    const fileText = await file.text();

    readableFiles.push(file);
    textBlocks.push(`File: ${file.name}\n${fileText}`);
  }

  return {
    text: textBlocks.join("\n\n"),
    readableFiles,
    unreadableFiles,
  };
}

function getWords(text) {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

function getSentences(text) {
  return text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function countSourceSignals(text) {
  const patterns = [
    /https?:\/\//gi,
    /www\./gi,
    /\bdoi:/gi,
    /\bet al\./gi,
    /\[[0-9]+\]/g,
    /\([A-Z][A-Za-z-]+,\s*[12][0-9]{3}\)/g,
  ];

  return patterns.reduce((total, pattern) => {
    const matches = text.match(pattern);

    return total + (matches?.length ?? 0);
  }, 0);
}

function getRepeatedPhrases(words, phraseLength = 6) {
  const counts = new Map();

  if (words.length < phraseLength * 2) {
    return [];
  }

  for (let index = 0; index <= words.length - phraseLength; index += 1) {
    const phrase = words.slice(index, index + phraseLength).join(" ");

    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 5)
    .map(([phrase, count]) => ({
      phrase,
      count,
    }));
}

export function analyzePlagiarismInput({ text = "", files = [] } = {}) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  const words = getWords(cleanText);
  const sentences = getSentences(cleanText);
  const repeatedPhrases = getRepeatedPhrases(words);
  const sourceSignals = countSourceSignals(cleanText);
  const quoteMarks = (cleanText.match(/["']/g) ?? []).length;
  const longSentences = sentences.filter((sentence) => getWords(sentence).length > 36);
  const readableFileCount = files.filter(isReadableFile).length;
  const extractionNeeded = files.length > 0 && readableFileCount < files.length;

  if (!cleanText && files.length === 0) {
    return {
      score: 0,
      label: "Waiting",
      tone: "gray",
      wordCount: 0,
      sourceSignals: 0,
      repeatedPhraseCount: 0,
      extractionNeeded: false,
      summary: "Add a picture, file, or pasted text to begin a scan.",
      flags: ["No material added yet."],
      repeatedPhrases: [],
    };
  }

  if (!cleanText && extractionNeeded) {
    return {
      score: 0,
      label: "Needs OCR",
      tone: "amber",
      wordCount: 0,
      sourceSignals: 0,
      repeatedPhraseCount: 0,
      extractionNeeded: true,
      summary:
        "Files were accepted. Image, PDF, and Word text extraction needs the OCR/source-matching service before a full plagiarism score can be produced.",
      flags: [
        "Manual intake is ready.",
        "No readable text was extracted in the browser.",
        "Send this file to the OCR pipeline for source matching.",
      ],
      repeatedPhrases: [],
    };
  }

  const repetitionRisk =
    repeatedPhrases.reduce((total, item) => total + item.count * 5, 0);

  const lengthRisk =
    words.length > 220 && sourceSignals === 0 ? 18 : words.length > 90 && sourceSignals === 0 ? 10 : 0;

  const structureRisk =
    Math.min(longSentences.length * 5, 18);

  const citationCredit =
    Math.min(sourceSignals * 4 + quoteMarks * 2, 20);

  const extractionRisk =
    extractionNeeded ? 8 : 0;

  const score =
    words.length < 35
      ? clamp(18 + extractionRisk, 12, 42)
      : clamp(
          18 + repetitionRisk + lengthRisk + structureRisk + extractionRisk - citationCredit,
          6,
          96
        );

  const tone =
    score >= 70 ? "red" : score >= 42 ? "amber" : "emerald";

  const label =
    score >= 70 ? "High review" : score >= 42 ? "Medium review" : "Low review";

  const flags = [];

  if (repeatedPhrases.length > 0) {
    flags.push(`${repeatedPhrases.length} repeated phrase pattern${repeatedPhrases.length === 1 ? "" : "s"} found.`);
  }

  if (sourceSignals === 0 && words.length > 90) {
    flags.push("No citation or source markers found in a longer passage.");
  }

  if (longSentences.length > 0) {
    flags.push(`${longSentences.length} unusually long sentence${longSentences.length === 1 ? "" : "s"} flagged.`);
  }

  if (extractionNeeded) {
    flags.push("Some uploaded files still need OCR or document extraction.");
  }

  if (flags.length === 0) {
    flags.push("No strong local plagiarism signals found.");
  }

  return {
    score,
    label,
    tone,
    wordCount: words.length,
    sourceSignals,
    repeatedPhraseCount: repeatedPhrases.length,
    extractionNeeded,
    summary:
      "This browser scan checks pasted and readable file text for repeated phrases, missing source markers, and review signals.",
    flags,
    repeatedPhrases,
  };
}
