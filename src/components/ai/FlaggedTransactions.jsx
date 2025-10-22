import React, { useState, useMemo } from "react";

const formatCurrency = (v = 0) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(v);

export default function FlaggedTransactions({
  insights = {},
  transactions = [],
}) {
  const flagged = insights?.flagged || insights?.flags || [];

  // local dismissed set (client-side only)
  const [dismissed, setDismissed] = useState(() => new Set());

  const mapped = useMemo(() => {
    const mapByIndex = new Map();
    flagged.forEach((f) => {
      if (f.index != null) mapByIndex.set(Number(f.index), f);
      else if (f.id != null) mapByIndex.set(Number(f.id), f);
    });
    const result = [];
    transactions.forEach((t, i) => {
      const key = i;
      const flag =
        mapByIndex.get(key) ||
        flagged.find(
          (f) =>
            // fallback fuzzy match: same date+amount+short desc
            f.date &&
            t.date &&
            f.date === t.date?.toString().slice(0, 10) &&
            Math.abs((Number(f.amount) || 0) - (Number(t.amount) || 0)) <
              0.01 &&
            String(f.description || "")
              .slice(0, 40)
              .toLowerCase() ===
              String(t.description || "")
                .slice(0, 40)
                .toLowerCase()
        );
      if (flag) result.push({ txIndex: i, tx: t, flag });
    });
    return result;
  }, [flagged, transactions]);

  if (!mapped.length) return null;

  return (
    <div className="rounded-lg border bg-white shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Flagged transactions</h3>
        <span className="text-sm text-gray-500">{mapped.length} flagged</span>
      </div>

      <ul className="space-y-3">
        {mapped.map(({ txIndex, tx, flag }) => {
          if (dismissed.has(txIndex)) return null;
          return (
            <li
              key={txIndex}
              className="p-3 border rounded flex justify-between items-start"
            >
              <div>
                <div className="flex items-baseline space-x-3">
                  <span className="text-sm text-gray-600">
                    {new Date(
                      flag.date || tx.date || tx.date_raw
                    ).toLocaleDateString("en-PH")}
                  </span>
                  <strong className="text-sm">
                    {tx.description || flag.description}
                  </strong>
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  {formatCurrency(tx.amount ?? flag.amount)}
                  <span className="ml-3 text-xs inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                    {flag.severity || "medium"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Reasons:{" "}
                  {(flag.reasons || [flag.reason]).filter(Boolean).join(", ")}
                </div>
                {flag.baseline && (
                  <div className="mt-2 text-xs text-gray-500">
                    baseline median:{" "}
                    {formatCurrency(
                      flag.baseline.median ?? flag.baseline.median
                    )}{" "}
                    • mad:{" "}
                    {Number(flag.baseline.mad ?? flag.baseline.mad).toFixed(2)}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end space-y-2">
                <button
                  className="text-sm text-indigo-600 hover:underline"
                  onClick={() => {
                    // simple dismiss (client-side)
                    setDismissed((s) => new Set([...s, txIndex]));
                  }}
                >
                  Dismiss
                </button>

                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => {
                    // Hide transaction from UI: emit a custom event so parent can remove or mark hidden
                    const ev = new CustomEvent("hideTransaction", {
                      detail: { index: txIndex },
                    });
                    window.dispatchEvent(ev);
                    setDismissed((s) => new Set([...s, txIndex]));
                  }}
                >
                  Hide from list
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
