import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const ALLOWED_COUNTS = new Set([5, 10, 15]);
const ALLOWED_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);

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
    const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;

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
    const model = client.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const parsed = extractJson(result.response.text());
    const questions = normalizeQuestions(parsed.questions).slice(0, config.count);

    if (questions.length === 0) {
      throw new Error("No usable questions were returned by the model.");
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("MCQ generation failed:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown generation error.",
      },
      { status: 500 }
    );
  }
}
