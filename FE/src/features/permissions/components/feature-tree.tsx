"use client";

import type { FeatureDto } from "../types/permissions.types";

export type FeatureNode = { feature: FeatureDto; depth: number };

// BE trả danh mục phẳng; dựng cây theo parentCode, cùng cấp sắp theo sortOrder.
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

// Mã quyền (node lá) nằm dưới một node nhóm, kể cả các cấp sâu hơn.
function leaves(features: FeatureDto[], code: string): string[] {
  return features
    .filter((f) => f.parentCode === code)
    .flatMap((f) => (f.isGroup ? leaves(features, f.code) : [f.code]));
}

export function FeatureName({ feature }: { feature: FeatureDto }) {
  return (
    <span className={feature.isActive ? undefined : "muted"}>
      {feature.isGroup ? <strong>{feature.name}</strong> : feature.name}
      {!feature.isGroup && (
        <span className="small muted"> · {feature.code}</span>
      )}
      {!feature.isActive && <span className="badge inactive">Đang tắt</span>}
    </span>
  );
}

// Cây checkbox: tick node nhóm chọn/bỏ toàn bộ mã con, chọn một phần thì nửa chọn.
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
    <ul className="feature-tree" role="group" aria-label="Quyền">
      {featureTree(features).map(({ feature, depth }) => {
        const codes = feature.isGroup
          ? leaves(features, feature.code)
          : [feature.code];
        const selected = codes.filter((code) => value.includes(code));
        const checked = codes.length > 0 && selected.length === codes.length;
        return (
          <li key={feature.code} style={{ paddingLeft: depth * 24 }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
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
