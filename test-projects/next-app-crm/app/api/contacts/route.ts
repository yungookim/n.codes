import { NextResponse } from "next/server";

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
  phone: string;
  role: string;
  createdAt: string;
}

const contacts: Contact[] = [
  { id: "c1", name: "Alice Johnson", email: "alice@acmecorp.com", company: "Acme Corp", status: "active", phone: "+1 555-0101", role: "VP of Engineering", createdAt: "2023-09-12" },
  { id: "c2", name: "Bob Martinez", email: "bob@globex.io", company: "Globex Inc", status: "active", phone: "+1 555-0102", role: "CTO", createdAt: "2023-10-05" },
  { id: "c3", name: "Carol Chen", email: "carol@initech.com", company: "Initech", status: "lead", phone: "+1 555-0103", role: "Director of Product", createdAt: "2023-11-20" },
  { id: "c4", name: "David Kim", email: "david@wayneent.com", company: "Wayne Enterprises", status: "active", phone: "+1 555-0104", role: "Head of Operations", createdAt: "2023-08-15" },
  { id: "c5", name: "Eva Rossi", email: "eva@stark.industries", company: "Stark Industries", status: "prospect", phone: "+1 555-0105", role: "Chief of Staff", createdAt: "2024-01-02" },
  { id: "c6", name: "Frank Nguyen", email: "frank@umbrella.co", company: "Umbrella Corp", status: "inactive", phone: "+1 555-0106", role: "IT Manager", createdAt: "2023-06-30" },
  { id: "c7", name: "Grace Okafor", email: "grace@oscorp.net", company: "Oscorp", status: "active", phone: "+1 555-0107", role: "VP of Sales", createdAt: "2023-12-01" },
  { id: "c8", name: "Henry Petrov", email: "henry@lexcorp.com", company: "LexCorp", status: "lead", phone: "+1 555-0108", role: "Procurement Lead", createdAt: "2024-01-08" },
];

// Simulated auth check
function getAuthUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  // In a real app, we'd validate a JWT. Here we accept anything or default to a hardcoded user.
  return { id: "u1", name: "Jane Doe", role: "sales_manager" };
}

export async function GET(request: Request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let results = [...contacts];

  if (status) {
    results = results.filter((c) => c.status === status);
  }

  if (search) {
    const term = search.toLowerCase();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.company.toLowerCase().includes(term)
    );
  }

  return NextResponse.json({
    data: results,
    total: results.length,
    user: user.name,
  });
}

export async function POST(request: Request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.name || !body.email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  const newContact: Contact = {
    id: `c${Date.now()}`,
    name: body.name,
    email: body.email,
    company: body.company || "",
    status: body.status || "lead",
    phone: body.phone || "",
    role: body.role || "",
    createdAt: new Date().toISOString().split("T")[0],
  };

  contacts.push(newContact);

  return NextResponse.json({ data: newContact }, { status: 201 });
}
