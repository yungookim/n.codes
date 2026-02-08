import type { NextApiRequest, NextApiResponse } from "next";
import { invoices } from "./index";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const index = invoices.findIndex((inv) => inv.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json(invoices[index]);
  }

  if (req.method === "PUT") {
    const updates = req.body;
    invoices[index] = { ...invoices[index], ...updates };
    return res.status(200).json(invoices[index]);
  }

  if (req.method === "DELETE") {
    const deleted = invoices.splice(index, 1)[0];
    return res.status(200).json(deleted);
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
