import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_FALLBACK_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash-preview-09-2025",
  "gemini-2.5-flash-lite-preview-09-2025",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];
const ALLOWED_COUNTS = new Set([5, 10, 15]);
const ALLOWED_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const RETRYABLE_STATUS_PATTERN = /\[(429|500|503)\b/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isRetryableModelError(error) {
  const message = getErrorMessage(error);

  return (
    RETRYABLE_STATUS_PATTERN.test(message) ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("UNAVAILABLE") ||
    message.includes("INTERNAL")
  );
}

function parseModelList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getModelCandidates() {
  const configuredPrimary = process.env.GEMINI_MODEL?.trim();
  const configuredFallbacks = parseModelList(process.env.GEMINI_FALLBACK_MODELS);

  return [...new Set([configuredPrimary || DEFAULT_MODEL, ...configuredFallbacks, ...DEFAULT_FALLBACK_MODELS])];
}

function extractJson(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The model returned an invalid JSON payload.");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeConfig(config = {}) {
  const count = ALLOWED_COUNTS.has(config.count) ? config.count : 5;
  const difficulty = ALLOWED_DIFFICULTIES.has(config.difficulty) ? config.difficulty : "Medium";

  return { count, difficulty };
}

function normalizeQuestions(rawQuestions = []) {
  return rawQuestions
    .map((question) => ({
      text: typeof question.text === "string" ? question.text.trim() : "",
      options: {
        A: typeof question.options?.A === "string" ? question.options.A.trim() : "",
        B: typeof question.options?.B === "string" ? question.options.B.trim() : "",
        C: typeof question.options?.C === "string" ? question.options.C.trim() : "",
        D: typeof question.options?.D === "string" ? question.options.D.trim() : "",
      },
      correctAnswer: ["A", "B", "C", "D"].includes(question.correctAnswer) ? question.correctAnswer : "",
      explanation: typeof question.explanation === "string" ? question.explanation.trim() : "",
    }))
    .filter((question) => {
      return (
        question.text &&
        question.options.A &&
        question.options.B &&
        question.options.C &&
        question.options.D &&
        question.correctAnswer &&
        question.explanation
      );
    });
}

async function generateQuestionsWithModel(client, modelName, prompt, count) {
  const model = client.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const parsed = extractJson(result.response.text());

  return normalizeQuestions(parsed.questions).slice(0, count);
}

export async function POST(request) {
  try {
    const { chunkData, config: requestedConfig } = await request.json();

    if (!chunkData?.title || !chunkData?.content) {
      return NextResponse.json({ error: "Missing chunk data for question generation." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing. Add it to your Vercel project environment variables." },
        { status: 500 }
      );
    }

    const config = normalizeConfig(requestedConfig);
    const modelCandidates = getModelCandidates();

    const prompt = `
You are an expert Corporate Law II professor building a multiple-choice exam.
Using only the source material below, generate ${config.count} multiple-choice questions at ${config.difficulty} difficulty.

Rules:
- Use only the supplied syllabus material.
- Return JSON only. Do not include markdown fences.
- Each question must have exactly four options labeled A, B, C, and D.
- Exactly one option must be correct.
- Each explanation must state why the correct answer is right and why the others are wrong.

Required JSON shape:
{
  "questions": [
    {
      "text": "Question text",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "A",
      "explanation": "Detailed explanation"
    }
  ]
}

Topic: ${chunkData.title}
Major subject: ${chunkData.topic}
Cases: ${(chunkData.cases || []).join(" | ")}
Key principles: ${(chunkData.key_principles || []).join(" | ")}

Source material:
${chunkData.content}
`;

    const client = new GoogleGenerativeAI(apiKey);
    const failedModels = [];
    let questions = [];
    let lastError = null;

    for (const [index, modelName] of modelCandidates.entries()) {
      const maxAttempts = index === 0 ? 2 : 1;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          questions = await generateQuestionsWithModel(client, modelName, prompt, config.count);

          if (questions.length === 0) {
            throw new Error(`Model ${modelName} returned no usable questions.`);
          }

          return NextResponse.json({
            questions,
            model: modelName,
            fallbackUsed: modelName !== modelCandidates[0],
          });
        } catch (error) {
          lastError = error;

          if (!failedModels.includes(modelName)) {
            failedModels.push(modelName);
          }

          if (!isRetryableModelError(error) || attempt === maxAttempts - 1) {
            break;
          }

          await sleep(800 * (attempt + 1));
        }
      }
    }

    const attemptedModels = failedModels.join(", ");
    const lastMessage = getErrorMessage(lastError);

    throw new Error(
      attemptedModels
        ? `All configured Gemini models failed (${attemptedModels}). Last error: ${lastMessage}`
        : lastMessage
    );
  } catch (error) {
    console.error("MCQ generation failed:", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error) || "Unknown generation error.",
      },
      { status: 500 }
    );
  }
}
