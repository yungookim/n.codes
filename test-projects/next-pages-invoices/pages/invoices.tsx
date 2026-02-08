import { useState } from "react";
import Layout from "../components/Layout";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  issuedDate: string;
  description: string;
}

const initialInvoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2024-001",
    customerName: "Meridian Labs",
    amount: 4250.0,
    status: "paid",
    dueDate: "2024-01-15",
    issuedDate: "2023-12-15",
    description: "Q4 consulting services",
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2024-002",
    customerName: "Apex Dynamics",
    amount: 1800.0,
    status: "pending",
    dueDate: "2024-02-28",
    issuedDate: "2024-01-28",
    description: "Website redesign phase 1",
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2024-003",
    customerName: "Northwind Traders",
    amount: 12500.0,
    status: "overdue",
    dueDate: "2024-01-01",
    issuedDate: "2023-11-30",
    description: "Annual software license",
  },
  {
    id: "inv-004",
    invoiceNumber: "INV-2024-004",
    customerName: "Meridian Labs",
    amount: 3200.0,
    status: "pending",
    dueDate: "2024-03-15",
    issuedDate: "2024-02-15",
    description: "Q1 consulting retainer",
  },
  {
    id: "inv-005",
    invoiceNumber: "INV-2024-005",
    customerName: "Solaris Energy",
    amount: 6750.0,
    status: "paid",
    dueDate: "2024-02-01",
    issuedDate: "2024-01-01",
    description: "Infrastructure audit report",
  },
];

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export default function InvoicesPage() {
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === filter);

  const filterCounts = {
    all: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").length,
    pending: invoices.filter((i) => i.status === "pending").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>Invoices</h2>
        <button className="btn btn-primary">+ New Invoice</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["all", "paid", "pending", "overdue"] as const).map((key) => (
          <button
            key={key}
            className={"btn " + (filter === key ? "btn-primary" : "btn-secondary")}
            onClick={() => setFilter(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} ({filterCounts[key]})
          </button>
        ))}
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Issued</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id}>
                <td style={{ fontWeight: 500 }}>{inv.invoiceNumber}</td>
                <td>{inv.customerName}</td>
                <td style={{ color: "var(--text-secondary)" }}>
                  {inv.description}
                </td>
                <td className="amount">{formatCurrency(inv.amount)}</td>
                <td style={{ color: "var(--text-secondary)" }}>
                  {inv.issuedDate}
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{inv.dueDate}</td>
                <td>
                  <span className={"badge badge-" + inv.status}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <p>No invoices match the current filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
