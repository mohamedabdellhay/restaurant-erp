import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import "./Alert.css";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function Alert({ type = "info", message, children }) {
  const text = message || children;
  if (!text) return null;
  const Icon = ICONS[type] || Info;

  return (
    <div
      className={`app-alert app-alert-${type}`}
      role={type === "error" ? "alert" : "status"}
    >
      <Icon size={20} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
