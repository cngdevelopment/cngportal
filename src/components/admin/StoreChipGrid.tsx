"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { removeStoreAction } from "@/app/actions/customers";
import { ROUTES } from "@/config/routes";

interface StoreChip {
  id: string;
  name: string;
  accountNumber: string;
}

export function StoreChipGrid({ accounts }: { accounts: StoreChip[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [removing, setRemoving] = useState<StoreChip | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmRemove() {
    if (!removing) return;
    const target = removing;
    startTransition(async () => {
      const result = await removeStoreAction(target.id);
      setRemoving(null);
      if (result.ok) {
        toast(
          result.data.deleted
            ? `Deleted ${result.data.name}.`
            : `${result.data.name} has order history, so it was deactivated instead.`
        );
        router.refresh();
      } else {
        toast(result.error.message, "error");
      }
    });
  }

  return (
    <>
      <div className="store-chip-grid">
        {accounts.map((account) => (
          <div key={account.id} className="store-chip-wrap">
            <Link href={ROUTES.admin.store(account.id)} className="store-chip">
              <span className="store-chip-name">{account.name}</span>
              <span className="store-chip-number">{account.accountNumber}</span>
            </Link>
            <button
              type="button"
              className="store-chip-remove"
              aria-label={`Remove ${account.name}`}
              title="Remove store"
              onClick={() => setRemoving(account)}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {removing && (
        <ConfirmDialog
          title="Remove this store?"
          message={
            <>
              <b>{removing.name}</b> will be removed. If it has no orders it&rsquo;s deleted
              permanently. If it has order history it&rsquo;s deactivated instead — its logins stop
              working but the orders are kept.
            </>
          }
          confirmLabel="Remove store"
          danger
          pending={pending}
          onConfirm={confirmRemove}
          onCancel={() => !pending && setRemoving(null)}
        />
      )}
    </>
  );
}
