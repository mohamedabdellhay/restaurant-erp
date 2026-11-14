import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./KotReceipt.css";

function idealTime(value) {
  const text = String(value || "").trim();
  if (!text) return "—";
  if (/^\d+(?:\.\d+)?$/.test(text)) return `${Number(text)}:00`;
  return text;
}

const KotReceipt = ({ ticket, onClose }) => {
  const { t, i18n } = useTranslation();
  const [done, setDone] = useState({});
  if (!ticket) return null;
  const when = new Date(ticket.createdAt);
  const valid = !Number.isNaN(when.getTime());
  const date = valid
    ? when.toLocaleDateString(i18n.language, { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  const time = valid
    ? when.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" })
    : "—";

  return (
    <div className="kot-receipt-overlay" role="presentation" onClick={onClose}>
      <div
        className="kot-receipt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kot-receipt-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <strong id="kot-receipt-title">{t("nav.kot_receipt")}</strong>
          <button type="button" onClick={onClose} aria-label={t("common.close")}>
            <X size={16} />
          </button>
        </header>
        <article>
          <h2>{t("nav.kot_receipt")}</h2>
          <div className="kot-receipt-meta">
            <span>
              {t("nav.kot_number")}: {ticket.id}
            </span>
            <span>
              {t("nav.kot_table")}: {ticket.table || "—"}
            </span>
            <span>{ticket.channel}</span>
            <span>
              {t("nav.receipt_date")}: {date}
            </span>
            <span />
            <span>
              {t("nav.receipt_time")}: {time}
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>{t("nav.kot_items")}</th>
                <th>{t("nav.kot_ideal")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ticket.lines.map((line, index) => (
                <tr key={`${line.name}-${index}`}>
                  <td>
                    <strong>
                      {line.qty} X {line.name}
                    </strong>
                    {line.detail && <em>{line.detail}</em>}
                    {line.note && (
                      <em>
                        {t("nav.kot_note")}: {line.note}
                      </em>
                    )}
                  </td>
                  <td>{idealTime(line.ideal)}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(done[index])}
                      onChange={() => setDone((current) => ({ ...current, [index]: !current[index] }))}
                      aria-label={line.name}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </div>
  );
};

export default KotReceipt;
