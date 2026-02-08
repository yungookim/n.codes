import Layout from "../components/Layout";
import Link from "next/link";

const invoices = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2024-001",
    customerName: "Meridian Labs",
    amount: 4250.0,
    status: "paid" as const,
    dueDate: "2024-01-15",
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2024-002",
    customerName: "Apex Dynamics",
    amount: 1800.0,
    status: "pending" as const,
    dueDate: "2024-02-28",
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2024-003",
    customerName: "Northwind Traders",
    amount: 12500.0,
    status: "overdue" as const,
    dueDate: "2024-01-01",
  },
  {
    id: "inv-004",
    invoiceNumber: "INV-2024-004",
    customerName: "Meridian Labs",
    amount: 3200.0,
    status: "pending" as const,
    dueDate: "2024-03-15",
  },
  {
    id: "inv-005",
    invoiceNumber: "INV-2024-005",
    customerName: "Solaris Energy",
    amount: 6750.0,
    status: "paid" as const,
    dueDate: "2024-02-01",
  },
];

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export default function Dashboard() {
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidTotal = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingTotal = invoices
    .filter((inv) => inv.status === "pending")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;

  return (
    <Layout>
      <div className="page-header">
        <h2>Dashboard</h2>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Welcome back, Jane
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value accent">{formatCurrency(totalRevenue)}</div>
          <div className="stat-sub">{invoices.length} invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid</div>
          <div className="stat-value info">{formatCurrency(paidTotal)}</div>
          <div className="stat-sub">
            {invoices.filter((i) => i.status === "paid").length} invoices
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value warning">{formatCurrency(pendingTotal)}</div>
          <div className="stat-sub">
            {invoices.filter((i) => i.status === "pending").length} invoices
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value danger">{overdueCount}</div>
          <div className="stat-sub">Requires attention</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-card-header">
          <h3>Recent Invoices</h3>
          <Link href="/invoices" className="btn btn-secondary">
            View all
          </Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.slice(0, 5).map((inv) => (
              <tr key={inv.id}>
                <td style={{ fontWeight: 500 }}>{inv.invoiceNumber}</td>
                <td>{inv.customerName}</td>
                <td className="amount">{formatCurrency(inv.amount)}</td>
                <td style={{ color: "var(--text-secondary)" }}>{inv.dueDate}</td>
                <td>
                  <span className={"badge badge-" + inv.status}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
