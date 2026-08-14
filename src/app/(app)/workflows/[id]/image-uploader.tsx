"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadAssessmentImagesAction, deleteAssessmentImageAction } from "../actions";

type ImageRecord = { id: string; url: string; caption: string | null };

export function ImageUploader({
  workflowId,
  assessmentId,
  images,
}: {
  workflowId: string;
  assessmentId: string;
  images: ImageRecord[];
}) {
  const boundUpload = uploadAssessmentImagesAction.bind(null, assessmentId, workflowId);
  const [state, formAction, pending] = useActionState(boundUpload, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [, startDelete] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-md border border-line">
              <Image
                src={img.url}
                alt={img.caption ?? "Assessment photo"}
                fill
                sizes="200px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => startDelete(() => deleteAssessmentImageAction(img.id, workflowId))}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        ref={formRef}
        action={(formData) => {
          formAction(formData);
          formRef.current?.reset();
          setPreviewCount(0);
        }}
        className="flex flex-col gap-2"
      >
        <label className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line bg-surface-muted/50 px-4 py-6 text-center text-sm text-ink-soft transition hover:border-teal">
          <span className="font-medium text-foreground">
            {previewCount > 0 ? `${previewCount} photo(s) selected` : "Click to add site photos"}
          </span>
          <span className="text-xs">JPG, PNG or WEBP, up to 8MB each</span>
          <input
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={(e) => setPreviewCount(e.currentTarget.files?.length ?? 0)}
          />
        </label>

        {state?.error && (
          <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending || previewCount === 0}
          className="self-end rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Upload photos"}
        </button>
      </form>
    </div>
  );
}
