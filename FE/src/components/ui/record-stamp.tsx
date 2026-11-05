import { stampDateTime } from "@/lib/format";

type StampRef = { label: string } | null;

export const stampLabel = (ref: StampRef) => ref?.label ?? "Không rõ";
export const stampText = (ref: StampRef, at?: string | null) =>
  at ? `${stampLabel(ref)} · ${stampDateTime(at)}` : stampLabel(ref);

export function RecordStamp({
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
}: {
  createdBy?: StampRef;
  createdAt?: string | null;
  updatedBy?: StampRef;
  updatedAt?: string | null;
}) {
  return (
    <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-subtle [&_strong]:font-medium [&_strong]:text-fg">
      {createdBy !== undefined && (
        <span>
          Tạo bởi <strong>{stampLabel(createdBy)}</strong>
          {createdAt && ` · ${stampDateTime(createdAt)}`}
        </span>
      )}
      {updatedBy !== undefined && (
        <span>
          Cập nhật lần cuối bởi <strong>{stampLabel(updatedBy)}</strong>
          {updatedAt && ` · ${stampDateTime(updatedAt)}`}
        </span>
      )}
    </span>
  );
}
