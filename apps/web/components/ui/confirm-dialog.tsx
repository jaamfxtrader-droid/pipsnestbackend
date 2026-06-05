"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onClose
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={loading ? () => undefined : onClose}>
      <div className="grid gap-5">
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <p className="text-sm leading-6">{description}</p>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
