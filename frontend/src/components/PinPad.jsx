import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./PinPad.css";

const PIN_LENGTH = 5;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function PinPad({ onComplete }) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState("");

  const press = (value) => {
    setDigits((current) => {
      if (current.length >= PIN_LENGTH) return current;
      const next = `${current}${value}`;
      if (next.length === PIN_LENGTH) {
        window.setTimeout(() => onComplete(next), 160);
      }
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (/^\d$/.test(event.key)) {
        press(event.key);
      } else if (event.key === "Backspace") {
        setDigits((current) => current.slice(0, -1));
      } else if (event.key === "Escape") {
        setDigits("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onComplete]);

  return (
    <section className="pin-pad">
      <h1>{t("pos.enter_pin")}</h1>
      <div className="pin-dots" role="status" aria-label={t("pos.enter_pin")}>
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <span key={index} className={index < digits.length ? "filled" : ""} />
        ))}
      </div>
      <div className="pin-keys">
        {KEYS.map((key) => (
          <button key={key} type="button" className="pin-key" onClick={() => press(key)}>
            {key}
          </button>
        ))}
        <span className="pin-spacer" aria-hidden="true" />
        <button type="button" className="pin-key" onClick={() => press("0")}>
          0
        </button>
        <button type="button" className="pin-clear" onClick={() => setDigits("")}>
          {t("pos.clear_all")}
        </button>
      </div>
    </section>
  );
}
