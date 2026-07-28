import { openai } from "../client";
import type OpenAI from "openai";

export { openai };

export async function generateImageBuffer(
  prompt: string,
  options?: { model?: string; size?: string },
): Promise<Buffer> {
  const response = await openai.images.generate({
    model: options?.model ?? "dall-e-3",
    prompt,
    n: 1,
    size: (options?.size as any) ?? "1024x1024",
  });
  const url = response.data[0]?.url;
  if (!url) throw new Error("No image URL returned");
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

export async function editImages(
  image: Buffer,
  mask: Buffer | null,
  prompt: string,
  options?: { model?: string; size?: string },
): Promise<Buffer> {
  const response = await openai.images.edit({
    model: options?.model ?? "dall-e-2",
    image: new File([image], "image.png", { type: "image/png" }),
    prompt,
    n: 1,
    size: (options?.size as any) ?? "1024x1024",
    ...(mask ? { mask: new File([mask], "mask.png", { type: "image/png" }) } : {}),
  } as any);
  const url = response.data[0]?.url;
  if (!url) throw new Error("No image URL returned");
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}
