"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { deleteAccountAction } from "@/app/actions/customers";

export function DeleteAccountButton({ accountId, name }: { accountId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      const result = await deleteAccountAction(accountId);
      setOpen(false);
      if (result.ok) {
        toast(`Deleted ${name}.`);
        router.refresh();
      } else {
        toast(result.error.message, "error");
      }
    });
  }

  return (
    <>
      <button type="button" className="rm" onClick={() => setOpen(true)}>
        Delete
      </button>
      {open && (
        <ConfirmDialog
          title="Delete this account?"
          message={
            <>
              This permanently removes <b>{name}</b> and its login(s). This can&rsquo;t be undone.
            </>
          }
          confirmLabel="Delete account"
          danger
          pending={pending}
          onConfirm={confirm}
          onCancel={() => !pending && setOpen(false)}
        />
      )}
    </>
  );
}
