"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { uploadWorkflowDocumentAction, deleteWorkflowDocumentAction } from "../actions";
import type { StepKey } from "@/lib/workflow/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type DocumentRecord = { id: string; url: string; caption: string | null };

export function DocumentGallery({
  workflowId,
  stepKey,
  documents,
  dict,
}: {
  workflowId: string;
  stepKey: StepKey | null;
  documents: DocumentRecord[];
  dict: Dictionary["workflowDetail"];
}) {
  const boundUpload = uploadWorkflowDocumentAction.bind(null, workflowId, stepKey);
  const [state, formAction, pending] = useActionState(boundUpload, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [previewCount, setPreviewCount] = useState(0);
  const [, startDelete] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {documents.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="text-teal hover:underline"
              >
                {doc.caption ?? doc.url.split("/").pop()}
              </a>
              <button
                type="button"
                onClick={() => startDelete(() => deleteWorkflowDocumentAction(doc.id, workflowId))}
                className="text-xs text-ink-soft hover:text-danger"
              >
                {dict.remove}
              </button>
            </li>
          ))}
        </ul>
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
        <label className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line bg-surface-muted/50 px-4 py-4 text-center text-xs text-ink-soft transition hover:border-teal">
          <span className="font-medium text-foreground">
            {previewCount > 0 ? `${previewCount} ${dict.filesSelected}` : dict.clickToAddDocument}
          </span>
          <input
            type="file"
            name="documents"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={(e) => setPreviewCount(e.currentTarget.files?.length ?? 0)}
          />
        </label>

        {state?.error && (
          <p className="rounded-md bg-danger-soft px-3 py-2 text-xs text-danger">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending || previewCount === 0}
          className="self-end rounded-md border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-teal hover:text-teal disabled:opacity-50"
        >
          {pending ? dict.uploading : dict.upload}
        </button>
      </form>
    </div>
  );
}
