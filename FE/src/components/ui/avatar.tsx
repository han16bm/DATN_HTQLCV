"use client";
import Image from "next/image";
import { useState, type ReactNode } from "react";

export function Avatar({
  name,
  src,
  large = false,
  fallback,
}: {
  name: string;
  src?: string | null;
  large?: boolean;
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <span
      className={`avatar${large ? " avatar-large" : ""}`}
      aria-hidden="true"
    >
      {src && failed !== src ? (
        <Image
          src={src}
          alt=""
          width={large ? 64 : 38}
          height={large ? 64 : 38}
          unoptimized
          onError={() => setFailed(src)}
        />
      ) : (
        (fallback ??
        name
          .trim()
          .split(/\s+/)
          .slice(-2)
          .map((word) => word[0])
          .join(""))
      )}
    </span>
  );
}
