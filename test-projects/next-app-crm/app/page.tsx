const contacts = [
  { id: "c1", name: "Alice Johnson", email: "alice@acmecorp.com", company: "Acme Corp", status: "active", lastContact: "2024-01-15" },
  { id: "c2", name: "Bob Martinez", email: "bob@globex.io", company: "Globex Inc", status: "active", lastContact: "2024-01-12" },
  { id: "c3", name: "Carol Chen", email: "carol@initech.com", company: "Initech", status: "lead", lastContact: "2024-01-10" },
  { id: "c4", name: "David Kim", email: "david@wayneent.com", company: "Wayne Enterprises", status: "active", lastContact: "2024-01-08" },
  { id: "c5", name: "Eva Rossi", email: "eva@stark.industries", company: "Stark Industries", status: "prospect", lastContact: "2024-01-06" },
];

const stats = [
  { label: "Total Contacts", value: "127", change: "+12 this month" },
  { label: "Active Deals", value: "23", change: "+3 this week", accent: true },
  { label: "Revenue (Q1)", value: "$284k", change: "+18% vs Q4" },
  { label: "Win Rate", value: "64%", change: "-2% vs last quarter", negative: true },
];

function getBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "badge badge-active";
    case "lead":
      return "badge badge-lead";
    case "prospect":
      return "badge badge-prospect";
    default:
      return "badge badge-inactive";
  }
}

export default function DashboardPage() {
  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your sales pipeline and contacts</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className={`stat-value${stat.accent ? " accent" : ""}`}>
              {stat.value}
            </div>
            <div className={`stat-change${stat.negative ? " negative" : ""}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Recent Contacts</h3>
          <button className="btn btn-primary" type="button">
            + Add Contact
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Status</th>
              <th>Last Contact</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>{contact.name}</td>
                <td>{contact.email}</td>
                <td>{contact.company}</td>
                <td>
                  <span className={getBadgeClass(contact.status)}>
                    {contact.status}
                  </span>
                </td>
                <td>{contact.lastContact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
