import React, { useState, useMemo } from "react";

const formatCurrency = (v = 0) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(v);

// contrast helper (reuse simple luminance check)
function getContrastColor(rgbStr) {
  try {
    const m = rgbStr.match(/rgb\s*\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/i);
    if (m) {
      const r = Number(m[1]),
        g = Number(m[2]),
        b = Number(m[3]);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return lum > 0.6 ? "#111" : "#fff";
    }
  } catch (e) {}
  return "#111";
}

export default function FlaggedTransactions({
  insights = {},
  transactions = [],
  hiddenTxIndices = new Set(),
}) {
  const flagged = insights?.flagged || insights?.flags || [];

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
    <div className="rounded-lg border bg-white shadow p-4 text-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Flagged transactions</h3>
        <span className="text-sm text-gray-500">{mapped.length} flagged</span>
      </div>

      <ul className="space-y-3">
        {mapped.map(({ txIndex, tx, flag }) => {
          if (dismissed.has(txIndex) || hiddenTxIndices.has(txIndex))
            return null;
          const severityBg =
            flag.severity === "high"
              ? "#ef4444"
              : flag.severity === "medium"
              ? "#f59e0b"
              : "#fde68a";
          const pillTextColor = getContrastColor(severityBg);
          return (
            <li
              key={txIndex}
              className="p-3 border rounded flex justify-between items-start bg-white"
            >
              <div>
                <div className="flex items-baseline space-x-3">
                  <span className="text-sm text-gray-600">
                    {new Date(
                      flag.date || tx.date || tx.date_raw
                    ).toLocaleDateString("en-PH")}
                  </span>
                  <strong className="text-sm text-gray-800">
                    {tx.description || flag.description}
                  </strong>
                </div>
                <div className="mt-1 text-sm text-gray-800">
                  {formatCurrency(tx.amount ?? flag.amount)}
                  <span
                    style={{ background: severityBg, color: pillTextColor }}
                    className="ml-3 text-xs inline-block px-2 py-0.5 rounded"
                  >
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
                    setDismissed((s) => new Set([...s, txIndex]));
                  }}
                >
                  Dismiss
                </button>

                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={() => {
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
