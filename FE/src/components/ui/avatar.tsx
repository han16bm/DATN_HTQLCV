"use client";
import { cn } from "@/lib/cn";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { toneOf } from "./project-tile";

// Màu nhận diện ổn định theo tên; chữ đậm trên nền nhạt đạt tương phản AA.
const tones = [
  "bg-[#e9effc] text-[#2f49ae]",
  "bg-[#f1ecfb] text-[#5b3fa8]",
  "bg-[#e4f5ea] text-[#17623a]",
  "bg-[#fdefe0] text-[#944300]",
  "bg-[#fde9e7] text-[#a8271c]",
  "bg-[#e0f4f8] text-[#145a70]",
  "bg-[#fff3d1] text-[#7a4b00]",
  "bg-[#f6e9fa] text-[#7b2f9e]",
];

// sm: thanh trên và danh sách; md: thẻ người dùng ở sidebar; lg: đầu hồ sơ.
const sizes = {
  sm: { box: "size-7 text-xs", px: 28 },
  md: { box: "size-10 text-sm", px: 40 },
  lg: { box: "size-16 text-xl", px: 64 },
};

export function Avatar({
  name,
  src,
  size = "sm",
  fallback,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const { box, px } = sizes[size];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-medium",
        box,
        tones[toneOf(name)],
      )}
      aria-hidden="true"
    >
      {src && failed !== src ? (
        <Image
          src={src}
          alt=""
          width={px}
          height={px}
          unoptimized
          className="size-full rounded-full object-cover"
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
