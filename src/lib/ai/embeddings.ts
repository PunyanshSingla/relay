import { google } from "@ai-sdk/google";
import { embed } from "ai";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const model = google.embedding("text-embedding-004");

    const { embedding } = await embed({
      model,
      value: text,
    });

    return embedding;
  } catch (error) {
    console.error("[embeddings] Failed to generate embedding:", error);
    return null;
  }
}

export async function storeEmailEmbedding(
  emailId: string,
  text: string,
): Promise<void> {
  const embedding = await generateEmbedding(text);
  if (!embedding) return;

  const id = crypto.randomUUID();
  const vectorStr = `[${embedding.join(",")}]`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO email_embeddings (id, "emailId", embedding) VALUES ($1, $2, $3::vector) ON CONFLICT ("emailId") DO UPDATE SET embedding = $3::vector`,
    id,
    emailId,
    vectorStr,
  );
}

export async function generateAndStoreForEmail(
  emailId: string,
  body: string,
  subject: string,
): Promise<void> {
  const text = `${subject}\n\n${body.slice(0, 2000)}`;
  await storeEmailEmbedding(emailId, text);
}
