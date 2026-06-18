import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed } from "ai";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const embeddingProvider = createGoogleGenerativeAI({
  apiKey: process.env.EMBEDDING_API_KEY || "",
});

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const { embedding } = await embed({
      model: embeddingProvider.embedding("gemini-embedding-2"),
      value: text,
      providerOptions: {
        google: { outputDimensionality: 1536 },
      },
    });

    return embedding;
  } catch (error) {
    console.error("[embeddings] Failed to generate embedding:", error);
    return null;
  }
}

async function storeEmailEmbedding(
  emailId: string,
  text: string,
): Promise<void> {
  const embedding = await generateEmbedding(text);
  if (!embedding) return;

  const id = crypto.randomUUID();

  await prisma.$executeRaw`
    INSERT INTO email_embeddings (id, "emailId", embedding)
    VALUES (${id}::uuid, ${emailId}, ${embedding}::vector)
    ON CONFLICT ("emailId")
    DO UPDATE SET embedding = ${embedding}::vector
  `;
}

export async function generateAndStoreForEmail(
  emailId: string,
  body: string,
  subject: string,
): Promise<void> {
  const text = `${subject}\n\n${body.slice(0, 2000)}`;
  await storeEmailEmbedding(emailId, text);
}
