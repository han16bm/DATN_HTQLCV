"use client";

import { KeyValue, KeyValueList } from "@/components/patterns/key-value";
import { dateTime } from "@/lib/format";
import type { AnalysisDto } from "../types/analytics.types";

export function AnalysisTechnicalInfo({ value }: { value: AnalysisDto }) {
  const { snapshot } = value;
  const ai = value.explanation.lastSuccess;
  return (
    <details className="border-t border-line pt-2">
      <summary className="cursor-pointer py-0.5 text-sm font-medium text-selected-fg">
        Thông tin kỹ thuật
      </summary>
      <KeyValueList compact className="mt-2">
        <KeyValue label="Mã bản phân tích">
          <code className="text-xs break-all">{snapshot.analysisId}</code>
        </KeyValue>
        <KeyValue label="Số liệu cập nhật lúc">
          {dateTime(snapshot.dataAsOf)}
        </KeyValue>
        <KeyValue label="Bản phân tích lưu đến">
          {dateTime(snapshot.expiresAt)}
        </KeyValue>
        {ai && (
          <>
            <KeyValue label="Phiên bản prompt">
              {ai.promptVersion ?? "Không rõ"}
            </KeyValue>
            <KeyValue label="Diễn giải lúc">
              {dateTime(ai.generatedAt)}
            </KeyValue>
          </>
        )}
      </KeyValueList>
    </details>
  );
}
