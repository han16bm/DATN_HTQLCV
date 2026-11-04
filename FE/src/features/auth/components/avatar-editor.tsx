"use client";

import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
import { UserRound } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { avatarSchema } from "../schemas/profile.schema";
import type { SessionDto } from "../types/auth.types";
import { AvatarCropDialog } from "./avatar-crop-dialog";

export function AvatarEditor({
  user,
  onSave,
  onConflictReload,
  onConflictAccept,
}: {
  user: SessionDto["user"];
  onSave: (file: File) => Promise<void>;
  onConflictReload: () => Promise<SessionDto["user"]>;
  onConflictAccept: () => void;
}) {
  const id = useId();
  const [source, setSource] = useState<{ name: string; url: string }>();
  const [error, setError] = useState<string>();
  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source.url);
    },
    [source],
  );
  return (
    <>
      <div className="grid justify-items-center gap-4 p-2 text-center">
        <Avatar
          name={user.displayName}
          src={user.avatarUrl}
          large
          fallback={<UserRound size={56} strokeWidth={1.5} />}
        />
        <label
          className={`${buttonClass()} relative h-10 cursor-pointer px-5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus`}
        >
          Chọn ảnh
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const result = avatarSchema.safeParse(file);
              setError(
                result.success ? undefined : result.error.issues[0].message,
              );
              if (result.success)
                setSource({ name: file.name, url: URL.createObjectURL(file) });
            }}
          />
        </label>
        <p className="m-0 text-xs text-fg-subtle" id={`${id}-hint`}>
          Ảnh JPG, PNG hoặc WebP, tối đa 2 MB.
        </p>
        {error && (
          <p className="text-sm text-danger-fg" role="alert" id={`${id}-error`}>
            {error}
          </p>
        )}
      </div>
      {source && (
        <AvatarCropDialog
          key={source.url}
          source={source}
          onCancel={() => setSource(undefined)}
          onConfirm={async (file) => {
            await onSave(file);
            setSource(undefined);
          }}
          onConflictReload={onConflictReload}
          onConflictAccept={onConflictAccept}
        />
      )}
    </>
  );
}
