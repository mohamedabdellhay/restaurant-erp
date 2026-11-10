import "./PageHeader.css";

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  eyebrow,
  children,
}) {
  return (
    <header className="page-header">
      <div className="header-content">
        {eyebrow ? <p className="page-header-eyebrow">{eyebrow}</p> : null}
        <h1>
          {Icon ? <Icon size={28} aria-hidden="true" /> : null}
          {title}
        </h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children ? <div className="header-actions">{children}</div> : null}
    </header>
  );
}
