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

export async function GET(request: Request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage");
  const minValue = searchParams.get("minValue");

  let results = [...deals];

  if (stage) {
    results = results.filter((d) => d.stage === stage);
  }

  if (minValue) {
    const min = parseInt(minValue, 10);
    results = results.filter((d) => d.value >= min);
  }

  const totalValue = results.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = results.reduce(
    (sum, d) => sum + d.value * (d.probability / 100),
    0
  );

  return NextResponse.json({
    data: results,
    total: results.length,
    totalValue,
    weightedValue: Math.round(weightedValue),
  });
}

export async function POST(request: Request) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.title || !body.company || !body.value) {
    return NextResponse.json(
      { error: "Title, company, and value are required" },
      { status: 400 }
    );
  }

  const newDeal: Deal = {
    id: `d${Date.now()}`,
    title: body.title,
    company: body.company,
    value: body.value,
    stage: body.stage || "discovery",
    contactId: body.contactId || "",
    contactName: body.contactName || "",
    probability: body.probability || 10,
    expectedClose: body.expectedClose || "",
    createdAt: new Date().toISOString().split("T")[0],
  };

  deals.push(newDeal);

  return NextResponse.json({ data: newDeal }, { status: 201 });
}
