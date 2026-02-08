import type { NextApiRequest, NextApiResponse } from "next";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  dueDate: string;
  issuedDate: string;
  description: string;
}

let invoices: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2024-001",
    customerId: "cust-001",
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
    customerId: "cust-002",
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
    customerId: "cust-003",
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
    customerId: "cust-001",
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
    customerId: "cust-004",
    customerName: "Solaris Energy",
    amount: 6750.0,
    status: "paid",
    dueDate: "2024-02-01",
    issuedDate: "2024-01-01",
    description: "Infrastructure audit report",
  },
];

export { invoices };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json(invoices);
  }

  if (req.method === "POST") {
    const { customerId, customerName, amount, dueDate, description } = req.body;

    if (!customerId || !customerName || !amount || !dueDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newInvoice: Invoice = {
      id: `inv-${String(invoices.length + 1).padStart(3, "0")}`,
      invoiceNumber: `INV-2024-${String(invoices.length + 1).padStart(3, "0")}`,
      customerId,
      customerName,
      amount: parseFloat(amount),
      status: "pending",
      dueDate,
      issuedDate: new Date().toISOString().split("T")[0],
      description: description || "",
    };

    invoices.push(newInvoice);
    return res.status(201).json(newInvoice);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
