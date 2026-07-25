import Link from "next/link";

export function DashboardHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="dashboard-heading">
      <div>
        <span className="dashboard-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <Link className="button button-primary" href={action.href}>
          {action.label} <span>→</span>
        </Link>
      )}
    </div>
  );
}

export function DemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="demo-notice">
      <span>i</span>
      <p>{children}</p>
    </div>
  );
}

export function StatGrid({
  items,
}: {
  items: { label: string; value: string | number; detail: string; symbol: string }[];
}) {
  return (
    <section className="stat-grid" aria-label="关键统计">
      {items.map((item) => (
        <article className="stat-card" key={item.label}>
          <span className="stat-symbol">{item.symbol}</span>
          <div>
            <small>{item.label}</small>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

export function DashboardPanel({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className="dashboard-panel" id={id}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="dashboard-progress">
      <div>
        <span>{label ?? "完成度"}</span>
        <b>{value}%</b>
      </div>
      <div>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span>◇</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
