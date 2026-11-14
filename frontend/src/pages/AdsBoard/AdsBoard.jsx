import { useEffect, useRef, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "@components/Alert";
import api from "@services/api";
import { getErrorMessage } from "@utils/errorMessage";
import "./AdsBoard.css";

const MAX_BYTES = 5 * 1024 * 1024;

function adKind(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  if (type === "video/mp4" || name.endsWith(".mp4")) return "video";
  if (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/gif" ||
    /\.(jpe?g|png|gif)$/.test(name)
  ) {
    return "image";
  }
  return "";
}

function blankRow() {
  return { id: crypto.randomUUID(), name: "", url: "", kind: "image", visible: false };
}

function savedRows(rows) {
  return rows.filter((row) => row.url);
}

const AdsBoard = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState(() => [blankRow()]);
  const [restaurantId, setRestaurantId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileRefs = useRef({});

  const load = async () => {
    const result = await api.get("/restaurant/settings");
    const restaurant = result.data?.data || {};
    setRestaurantId(restaurant._id || restaurant.id || "");
    const board = Array.isArray(restaurant.settings?.adsBoard) ? restaurant.settings.adsBoard : [];
    setRows(board.length ? board : [blankRow()]);
  };

  useEffect(() => {
    load().catch((error) => setMessage({ type: "error", text: getErrorMessage(error, t("nav.ads_save_failed")) }));
  }, [t]);

  useEffect(() => {
    if (!message.text) return undefined;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const persist = async (next) => {
    if (!restaurantId) return;
    await api.put(`/restaurant/${restaurantId}/ads`, { ads: savedRows(next) });
  };

  const chooseFile = async (row, file) => {
    if (!file) return;
    const kind = adKind(file);
    if (!kind) {
      setMessage({ type: "error", text: t("nav.ads_type") });
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage({ type: "error", text: t("nav.ads_too_large") });
      return;
    }
    const body = new FormData();
    body.append("file", file);
    try {
      const result = await api.post("/upload/ad", body, { headers: { "Content-Type": "multipart/form-data" } });
      const uploaded = result.data?.data || {};
      const next = rows.map((item) => (
        item.id === row.id
          ? { ...item, name: uploaded.name || file.name, url: uploaded.path || "", kind }
          : item
      ));
      setRows(next);
      await persist(next);
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, t("nav.ads_save_failed")) });
    }
  };

  const toggle = async (row) => {
    const next = rows.map((item) => (item.id === row.id ? { ...item, visible: !item.visible } : item));
    setRows(next);
    if (!row.url) return;
    try {
      await persist(next);
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, t("nav.ads_save_failed")) });
      load().catch(() => {});
    }
  };

  const remove = async (row) => {
    const remaining = rows.filter((item) => item.id !== row.id);
    const next = remaining.length ? remaining : [blankRow()];
    setRows(next);
    if (!row.url) return;
    try {
      await persist(next);
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, t("nav.ads_save_failed")) });
      load().catch(() => {});
    }
  };

  return (
    <div className="ads-board">
      <Alert type={message.type} message={message.text} />
      <h1>{t("nav.ads_board")}</h1>
      <section className="ads-card">
        {rows.map((row, index) => (
          <article key={row.id} className="ads-row">
            <div className="ads-copy">
              {index === 0 && (
                <>
                  <strong>{t("nav.ads_board")}</strong>
                  <p>{t("nav.ads_note")}</p>
                </>
              )}
            </div>
            <div className="ads-file">
              <div className="ads-file-line">
                <button type="button" onClick={() => fileRefs.current[row.id]?.click()} aria-label={t("nav.ads_add")}>
                  <Download size={16} />
                </button>
                <input readOnly value={row.name} aria-label={t("nav.ads_board")} />
                <input
                  ref={(node) => {
                    fileRefs.current[row.id] = node;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,video/mp4,.jpg,.jpeg,.png,.gif,.mp4"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    chooseFile(row, file);
                  }}
                />
              </div>
              {index === rows.length - 1 && (
                <button type="button" className="ads-add" onClick={() => setRows((current) => [...current, blankRow()])}>
                  <Plus size={14} />
                  {t("nav.ads_add")}
                </button>
              )}
            </div>
            <label className="ads-display">
              <button
                type="button"
                className={row.visible ? "ads-switch on" : "ads-switch"}
                role="switch"
                aria-checked={row.visible}
                onClick={() => toggle(row)}
              >
                <span />
              </button>
              {t("nav.ads_show")}
            </label>
            <button type="button" className="ads-delete" onClick={() => remove(row)} aria-label={t("common.delete")}>
              <Trash2 size={16} />
            </button>
          </article>
        ))}
      </section>
    </div>
  );
};

export default AdsBoard;
