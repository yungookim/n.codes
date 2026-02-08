import Layout from "../components/Layout";

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  totalInvoices: number;
  totalSpent: number;
  joinedDate: string;
}

const customers: Customer[] = [
  {
    id: "cust-001",
    name: "Elena Torres",
    email: "elena@meridianlabs.io",
    company: "Meridian Labs",
    totalInvoices: 2,
    totalSpent: 7450.0,
    joinedDate: "2023-06-10",
  },
  {
    id: "cust-002",
    name: "Marcus Chen",
    email: "marcus@apexdynamics.com",
    company: "Apex Dynamics",
    totalInvoices: 1,
    totalSpent: 1800.0,
    joinedDate: "2023-09-22",
  },
  {
    id: "cust-003",
    name: "Ingrid Holm",
    email: "ingrid@northwindtraders.eu",
    company: "Northwind Traders",
    totalInvoices: 1,
    totalSpent: 12500.0,
    joinedDate: "2023-03-15",
  },
  {
    id: "cust-004",
    name: "David Park",
    email: "david@solarisenergy.co",
    company: "Solaris Energy",
    totalInvoices: 1,
    totalSpent: 6750.0,
    joinedDate: "2024-01-05",
  },
];

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function CustomersPage() {
  return (
    <Layout>
      <div className="page-header">
        <h2>Customers</h2>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {customers.length} total customers
        </span>
      </div>

      <div className="customers-grid">
        {customers.map((customer) => (
          <div key={customer.id} className="customer-card">
            <div className="customer-avatar">{getInitials(customer.name)}</div>
            <div className="customer-info">
              <div className="customer-name">{customer.name}</div>
              <div className="customer-email">{customer.email}</div>
              <div className="customer-meta">
                <span>
                  Company: <strong>{customer.company}</strong>
                </span>
                <span>
                  Invoices: <strong>{customer.totalInvoices}</strong>
                </span>
                <span>
                  Spent: <strong>{formatCurrency(customer.totalSpent)}</strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
