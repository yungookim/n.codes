const deals = [
  { id: "d1", title: "Enterprise License", company: "Acme Corp", value: 48000, stage: "negotiation", contact: "Alice Johnson" },
  { id: "d2", title: "Platform Migration", company: "Globex Inc", value: 125000, stage: "proposal", contact: "Bob Martinez" },
  { id: "d3", title: "API Integration", company: "Initech", value: 32000, stage: "discovery", contact: "Carol Chen" },
  { id: "d4", title: "Security Audit", company: "Wayne Enterprises", value: 67000, stage: "won", contact: "David Kim" },
  { id: "d5", title: "Cloud Infrastructure", company: "Stark Industries", value: 210000, stage: "proposal", contact: "Eva Rossi" },
  { id: "d6", title: "Data Analytics Suite", company: "Oscorp", value: 55000, stage: "negotiation", contact: "Grace Okafor" },
];

const stages = ["discovery", "proposal", "negotiation", "won"];

function getStageBadgeClass(stage: string): string {
  switch (stage) {
    case "discovery":
      return "badge badge-discovery";
    case "proposal":
      return "badge badge-proposal";
    case "negotiation":
      return "badge badge-negotiation";
    case "won":
      return "badge badge-won";
    case "lost":
      return "badge badge-lost";
    default:
      return "badge badge-inactive";
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function DealsPage() {
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const wonValue = deals.filter((d) => d.stage === "won").reduce((sum, d) => sum + d.value, 0);

  return (
    <>
      <div className="page-header">
        <h2>Deals</h2>
        <p>Track your sales pipeline and deal progression</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Pipeline</div>
          <div className="stat-value">{formatCurrency(totalValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Won Revenue</div>
          <div className="stat-value accent">{formatCurrency(wonValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Deals</div>
          <div className="stat-value">{deals.filter((d) => d.stage !== "won" && d.stage !== "lost").length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Deal Size</div>
          <div className="stat-value">{formatCurrency(Math.round(totalValue / deals.length))}</div>
        </div>
      </div>

      <div className="pipeline">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          return (
            <div key={stage} className="pipeline-column">
              <div className="pipeline-column-header">
                <span className="pipeline-column-title">{stage}</span>
                <span className="pipeline-column-count">{stageDeals.length}</span>
              </div>
              {stageDeals.length === 0 ? (
                <div className="empty-state">
                  <p>No deals</p>
                </div>
              ) : (
                stageDeals.map((deal) => (
                  <div key={deal.id} className="pipeline-card">
                    <div className="pipeline-card-title">{deal.title}</div>
                    <div className="pipeline-card-company">{deal.company}</div>
                    <div className="pipeline-card-value">{formatCurrency(deal.value)}</div>
                    <div className="pipeline-card-contact">{deal.contact}</div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
