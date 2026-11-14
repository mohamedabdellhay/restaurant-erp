import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "../../utils/money";
import "./SalesReceipt.css";

function amount(value, currency) {
  return value ? formatMoney(value, currency) : "—";
}

const SalesReceipt = ({ receipt, restaurant, currency, onClose }) => {
  const { t, i18n } = useTranslation();
  if (!receipt) return null;
  const when = new Date(receipt.createdAt);
  const valid = !Number.isNaN(when.getTime());
  const date = valid
    ? when.toLocaleDateString(i18n.language, { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  const time = valid
    ? when.toLocaleTimeString(i18n.language, { hour: "numeric", minute: "2-digit" })
    : "—";
  const identity = [
    restaurant?.vatNumber ? `${t("settings.vat_number")}: ${restaurant.vatNumber}` : "",
    restaurant?.crNumber ? `${t("settings.cr_number")}: ${restaurant.crNumber}` : "",
  ].filter(Boolean);

  return (
    <div className="sales-receipt-overlay" role="presentation" onClick={onClose}>
      <div
        className="sales-receipt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sales-receipt-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="sales-receipt-close" onClick={onClose} aria-label={t("common.close")}>
          <X size={16} />
        </button>
        <article>
          <h2 id="sales-receipt-title" className="sales-receipt-name">{restaurant?.name}</h2>
          {restaurant?.address && <p>{restaurant.address}</p>}
          {restaurant?.phone && (
            <p>
              {t("nav.receipt_mobile")}: {restaurant.phone}
            </p>
          )}
          {identity.length > 0 && <p>{identity.join(" | ")}</p>}
          <div className="sales-receipt-meta">
            <span>
              {t("nav.receipt_order")}: {receipt.id}
            </span>
            <span>
              {t("nav.receipt_date")}: {date}
            </span>
            <span>
              {t("nav.receipt_time")}: {time}
            </span>
          </div>
          <h3>{t("nav.orders_customer_bill")}</h3>
          <table>
            <thead>
              <tr>
                <th>{t("nav.receipt_item")}</th>
                <th>{t("nav.orders_quantity")}</th>
                <th>{t("nav.receipt_unit_price")}</th>
                <th>{t("nav.orders_subtotal")}</th>
              </tr>
            </thead>
            <tbody>
              {receipt.lines.map((line, index) => (
                <tr key={`${line.name}-${index}`}>
                  <td>{line.name}</td>
                  <td>{line.qty}</td>
                  <td>{formatMoney(line.price, currency)}</td>
                  <td>{formatMoney(line.total, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl>
            <div>
              <dt>{t("nav.orders_subtotal")}</dt>
              <dd>{formatMoney(receipt.figures.subtotal, currency)}</dd>
            </div>
            <div>
              <dt>{t("nav.orders_discount")}</dt>
              <dd>{amount(receipt.figures.discountValue, currency)}</dd>
            </div>
            <div>
              <dt>{t("nav.orders_vat")}</dt>
              <dd>{amount(receipt.figures.vatAmount, currency)}</dd>
            </div>
            <div>
              <dt>{t("nav.orders_sd")}</dt>
              <dd>{amount(receipt.figures.sdAmount, currency)}</dd>
            </div>
            <div>
              <dt>{t("nav.orders_service_charge")}</dt>
              <dd>{amount(receipt.figures.serviceAmount, currency)}</dd>
            </div>
            <div className="sales-receipt-total">
              <dt>{t("nav.orders_total_bill")}</dt>
              <dd>{formatMoney(receipt.figures.total, currency)}</dd>
            </div>
          </dl>
          <p className="sales-receipt-thanks">{t("nav.receipt_thanks")}</p>
        </article>
      </div>
    </div>
  );
};

export default SalesReceipt;
