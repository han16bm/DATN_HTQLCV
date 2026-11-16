"use client";

import type { FeatureDto } from "../types/permissions.types";

export type FeatureNode = { feature: FeatureDto; depth: number };

export function featureTree(features: FeatureDto[]): FeatureNode[] {
  const sorted = features.toSorted((a, b) => a.sortOrder - b.sortOrder);
  const walk = (parent: string | null, depth: number): FeatureNode[] =>
    sorted
      .filter((f) => f.parentCode === parent)
      .flatMap((feature) => [
        { feature, depth },
        ...walk(feature.code, depth + 1),
      ]);
  return walk(null, 0);
}

function leaves(features: FeatureDto[], code: string): string[] {
  return features
    .filter((f) => f.parentCode === code)
    .flatMap((f) => (f.isGroup ? leaves(features, f.code) : [f.code]));
}

export function FeatureName({ feature }: { feature: FeatureDto }) {
  return (
    <span
      className={
        feature.isActive
          ? "inline-flex flex-wrap items-center gap-1.5"
          : "inline-flex flex-wrap items-center gap-1.5 text-fg-subtle"
      }
    >
      {feature.isGroup ? <strong>{feature.name}</strong> : feature.name}
      {!feature.isGroup && (
        <span className="text-xs text-fg-subtle"> · {feature.code}</span>
      )}
      {!feature.isActive && (
        <span className="inline-flex items-center rounded-sm px-1.5 py-px text-xs leading-4 font-semibold whitespace-nowrap bg-sunken text-fg-subtle">
          Đang tắt
        </span>
      )}
    </span>
  );
}

export function FeatureChecklist({
  features,
  value,
  onChange,
  disabled = false,
}: {
  features: FeatureDto[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <ul
      className="m-0 grid max-h-[50dvh] list-none gap-1 overflow-y-auto rounded-lg border border-line p-3"
      role="group"
      aria-label="Quyền"
    >
      {featureTree(features).map(({ feature, depth }) => {
        const codes = feature.isGroup
          ? leaves(features, feature.code)
          : [feature.code];
        const selected = codes.filter((code) => value.includes(code));
        const checked = codes.length > 0 && selected.length === codes.length;
        return (
          <li key={feature.code} style={{ paddingLeft: depth * 24 }}>
            <label className="flex items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                className="size-4 accent-(--color-action)"
                disabled={disabled || !codes.length}
                checked={checked}
                ref={(input) => {
                  if (input)
                    input.indeterminate = selected.length > 0 && !checked;
                }}
                onChange={() =>
                  onChange(
                    checked
                      ? value.filter((code) => !codes.includes(code))
                      : [...new Set([...value, ...codes])],
                  )
                }
              />
              <FeatureName feature={feature} />
            </label>
          </li>
        );
      })}
    </ul>
  );
}
