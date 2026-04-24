"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CourseBatch } from "@/types/course";

type CourseBatchContextValue = {
  batchId: string;
  setBatchId: (id: string) => void;
};

const CourseBatchContext = createContext<CourseBatchContextValue | null>(null);

export function CourseDetailBatchProvider({
  batches,
  children,
}: {
  batches?: CourseBatch[] | undefined;
  children: React.ReactNode;
}) {
  const batchSig = useMemo(() => (batches ?? []).map((b) => b.id).join("|"), [batches]);
  const [batchId, setBatchIdState] = useState(() => batches?.[0]?.id ?? "");

  useEffect(() => {
    const list = batches ?? [];
    if (!list.length) {
      setBatchIdState("");
      return;
    }
    setBatchIdState((prev) => {
      if (prev && list.some((b) => b.id === prev)) return prev;
      return list[0]?.id ?? "";
    });
  }, [batchSig, batches]);

  const setBatchId = useCallback((id: string) => {
    setBatchIdState(id);
  }, []);

  const value = useMemo(() => ({ batchId, setBatchId }), [batchId, setBatchId]);

  return <CourseBatchContext.Provider value={value}>{children}</CourseBatchContext.Provider>;
}

export function useCourseBatchSelection(): CourseBatchContextValue {
  const v = useContext(CourseBatchContext);
  if (!v) {
    throw new Error("useCourseBatchSelection must be used within CourseDetailBatchProvider");
  }
  return v;
}
