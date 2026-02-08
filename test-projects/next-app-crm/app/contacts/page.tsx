const contacts = [
  { id: "c1", name: "Alice Johnson", email: "alice@acmecorp.com", company: "Acme Corp", status: "active", phone: "+1 555-0101", role: "VP of Engineering" },
  { id: "c2", name: "Bob Martinez", email: "bob@globex.io", company: "Globex Inc", status: "active", phone: "+1 555-0102", role: "CTO" },
  { id: "c3", name: "Carol Chen", email: "carol@initech.com", company: "Initech", status: "lead", phone: "+1 555-0103", role: "Director of Product" },
  { id: "c4", name: "David Kim", email: "david@wayneent.com", company: "Wayne Enterprises", status: "active", phone: "+1 555-0104", role: "Head of Operations" },
  { id: "c5", name: "Eva Rossi", email: "eva@stark.industries", company: "Stark Industries", status: "prospect", phone: "+1 555-0105", role: "Chief of Staff" },
  { id: "c6", name: "Frank Nguyen", email: "frank@umbrella.co", company: "Umbrella Corp", status: "inactive", phone: "+1 555-0106", role: "IT Manager" },
  { id: "c7", name: "Grace Okafor", email: "grace@oscorp.net", company: "Oscorp", status: "active", phone: "+1 555-0107", role: "VP of Sales" },
  { id: "c8", name: "Henry Petrov", email: "henry@lexcorp.com", company: "LexCorp", status: "lead", phone: "+1 555-0108", role: "Procurement Lead" },
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

export default function ContactsPage() {
  const activeCount = contacts.filter((c) => c.status === "active").length;
  const leadCount = contacts.filter((c) => c.status === "lead").length;

  return (
    <>
      <div className="page-header">
        <h2>Contacts</h2>
        <p>
          Manage your contacts and leads &mdash; {contacts.length} total,{" "}
          {activeCount} active, {leadCount} leads
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Contacts</div>
          <div className="stat-value">{contacts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value accent">{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Leads</div>
          <div className="stat-value">{leadCount}</div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>All Contacts</h3>
          <button className="btn btn-primary" type="button">
            + New Contact
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>{contact.name}</td>
                <td>{contact.role}</td>
                <td>{contact.company}</td>
                <td>{contact.email}</td>
                <td>{contact.phone}</td>
                <td>
                  <span className={getBadgeClass(contact.status)}>
                    {contact.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
