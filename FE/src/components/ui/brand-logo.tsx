import { useId } from "react";

// Logo Cổng công việc: ô gradient xanh – tím, lối vào hình vòm (cổng) bên trong
// có dấu tích hoàn thành. Cùng hình dùng cho thanh trên, đăng nhập và favicon.
export function BrandMark({ size = 28 }: { size?: number }) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={id}
          x1="2"
          y1="2"
          x2="30"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#2b87ff" />
          <stop offset="0.55" stopColor="#0c66e4" />
          <stop offset="1" stopColor="#6e5dc6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
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
    <span className={`brand-logo${large ? " brand-logo-large" : ""}`}>
      <BrandMark size={size} />
      <span className="brand-word">
        Cổng<span> công việc</span>
      </span>
    </span>
  );
}
