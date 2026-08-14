import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export class UploadError extends Error {}

function extFor(file: File) {
  const fromName = path.extname(file.name).replace(".", "").toLowerCase();
  if (fromName) return fromName;
  const fromType = file.type.split("/")[1];
  return fromType || "jpg";
}

async function saveUpload(subdir: string, file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError(`${file.name || "file"} is not a supported image type.`);
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError(`${file.name || "file"} is larger than 8MB.`);
  }

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomUUID()}.${extFor(file)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return { url: `/uploads/${subdir}/${filename}` };
}

export async function saveAssessmentImage(assessmentId: string, file: File) {
  return saveUpload(assessmentId, file);
}

export async function saveWorkflowDocument(workflowId: string, file: File) {
  return saveUpload(workflowId, file);
}
