import { NextResponse } from "next/server";

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  contactId: string;
  contactName: string;
  probability: number;
  expectedClose: string;
  createdAt: string;
}

const deals: Deal[] = [
  { id: "d1", title: "Enterprise License", company: "Acme Corp", value: 48000, stage: "negotiation", contactId: "c1", contactName: "Alice Johnson", probability: 75, expectedClose: "2024-02-28", createdAt: "2023-11-01" },
  { id: "d2", title: "Platform Migration", company: "Globex Inc", value: 125000, stage: "proposal", contactId: "c2", contactName: "Bob Martinez", probability: 50, expectedClose: "2024-03-15", createdAt: "2023-12-10" },
  { id: "d3", title: "API Integration", company: "Initech", value: 32000, stage: "discovery", contactId: "c3", contactName: "Carol Chen", probability: 25, expectedClose: "2024-04-01", createdAt: "2024-01-05" },
  { id: "d4", title: "Security Audit", company: "Wayne Enterprises", value: 67000, stage: "won", contactId: "c4", contactName: "David Kim", probability: 100, expectedClose: "2024-01-20", createdAt: "2023-10-15" },
  { id: "d5", title: "Cloud Infrastructure", company: "Stark Industries", value: 210000, stage: "proposal", contactId: "c5", contactName: "Eva Rossi", probability: 40, expectedClose: "2024-05-01", createdAt: "2023-12-20" },
  { id: "d6", title: "Data Analytics Suite", company: "Oscorp", value: 55000, stage: "negotiation", contactId: "c7", contactName: "Grace Okafor", probability: 65, expectedClose: "2024-02-15", createdAt: "2023-11-28" },
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

  const deal = deals.find((d) => d.id === params.id);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({ data: deal });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const index = deals.findIndex((d) => d.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const body = await request.json();

  // Validate stage transition if stage is being updated
  const validStages = ["discovery", "proposal", "negotiation", "won", "lost"];
  if (body.stage && !validStages.includes(body.stage)) {
    return NextResponse.json(
      { error: "Invalid stage. Must be one of: " + validStages.join(", ") },
      { status: 400 }
    );
  }

  const updated = { ...deals[index], ...body, id: deals[index].id };

  // Auto-adjust probability when stage changes to won or lost
  if (body.stage === "won") {
    updated.probability = 100;
  } else if (body.stage === "lost") {
    updated.probability = 0;
  }

  deals[index] = updated;

  return NextResponse.json({ data: updated });
}
