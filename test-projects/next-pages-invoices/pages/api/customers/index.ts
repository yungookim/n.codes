import type { NextApiRequest, NextApiResponse } from "next";

export interface Customer {
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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json(customers);
  }

  res.setHeader("Allow", "GET");
  return res.status(405).json({ error: "Method not allowed" });
}
