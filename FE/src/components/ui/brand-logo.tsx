function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="var(--color-action)" />
      <path
        d="M8.5 24.5V15a7.5 7.5 0 0 1 15 0v9.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 24.5h18"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="m12.6 17.3 2.7 2.7 4.9-5.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.6" cy="7.4" r="2" fill="#f5cd47" />
    </svg>
  );
}

export function BrandLogo({
  size = 28,
  large = false,
}: {
  size?: number;
  large?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark size={size} />
      <span
        className={`font-semibold tracking-tight text-fg ${large ? "text-xl" : "text-base"}`}
      >
        Cổng<span className="font-normal text-fg-subtle"> công việc</span>
      </span>
    </span>
  );
}
