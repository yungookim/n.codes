import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: "\u25A6" },
  { href: "/invoices", label: "Invoices", icon: "\u2630" },
  { href: "/customers", label: "Customers", icon: "\u2616" },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>InvoiceTrack</h1>
          <span>Business billing</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? router.pathname === "/"
                : router.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "active" : ""}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-avatar">JD</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Jane Doe</div>
            <div className="sidebar-user-email">jane@acme.co</div>
          </div>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
