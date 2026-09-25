import { defineHandler } from "nitro";
import { useRuntimeConfig } from "nitro/runtime-config";
import { createError, readBody } from "nitro/h3";

const instruction = "Generate 5 professional resume bullet points based on the user's achievement, industry, and experience level. Include metrics/numbers. Make them ATS-optimized and impactful.";

export default defineHandler(async (event) => {
  const body = await readBody<{
    achievement?: string;
    industry?: string;
    experience?: string;
  }>(event);

  if (!body?.achievement?.trim() || !body.industry?.trim() || !body.experience?.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Achievement, industry, and experience are required." });
  }

  const config = useRuntimeConfig();
  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 503, statusMessage: "Anthropic API key is not configured." });
  }

  const prompt = `${instruction}

User context:
- Achievement or responsibility: ${body.achievement.trim()}
- Industry: ${body.industry.trim()}
- Experience level: ${body.experience.trim()}

Return exactly 5 bullets, one per line, with no numbering, labels, or extra commentary.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 900,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw createError({ statusCode: 502, statusMessage: "Claude could not generate bullets right now." });
  }

  const result = await response.json() as { content?: Array<{ type?: string; text?: string }> };
  const text = result.content?.filter((item) => item.type === "text").map((item) => item.text ?? "").join("\n") ?? "";
  const bullets = text.split("\n").map((line) => line.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim()).filter(Boolean).slice(0, 5);

  if (bullets.length !== 5) {
    throw createError({ statusCode: 502, statusMessage: "Claude returned an incomplete bullet set." });
  }

  return { bullets };
});
