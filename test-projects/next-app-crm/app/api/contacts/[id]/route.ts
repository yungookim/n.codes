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

function getAuthUser(request: Request) {
  return { id: "u1", name: "Jane Doe", role: "sales_manager" };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contact = contacts.find((c) => c.id === params.id);
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ data: contact });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const index = contacts.findIndex((c) => c.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = { ...contacts[index], ...body, id: contacts[index].id };
  contacts[index] = updated;

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const index = contacts.findIndex((c) => c.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const deleted = contacts.splice(index, 1)[0];

  return NextResponse.json({ data: deleted, message: "Contact deleted" });
}
