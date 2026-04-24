"use client";

import type { ComponentProps } from "react";
import { CourseEnquiryForm } from "@/components/CourseEnquiryForm";
import { useCourseBatchSelection } from "@/contexts/CourseBatchContext";

type Props = Omit<
  ComponentProps<typeof CourseEnquiryForm>,
  "syncSelectedBatchId" | "onSyncSelectedBatchIdChange"
>;

export function CourseEnquiryFormSyncedToDetailBatch(props: Props) {
  const hasBatches = Boolean(props.batches?.length);
  const { batchId, setBatchId } = useCourseBatchSelection();
  return (
    <CourseEnquiryForm
      {...props}
      syncSelectedBatchId={hasBatches ? batchId : undefined}
      onSyncSelectedBatchIdChange={hasBatches ? setBatchId : undefined}
    />
  );
}
