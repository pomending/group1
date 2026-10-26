export function normalizeConnections(value) {
  const customer = value && value.customer;
  if (!customer || typeof customer !== "object" || typeof customer.name !== "string") return {};
  return { customer: {
    key: typeof customer.key === "string" ? customer.key : "",
    id: customer.id == null ? "" : String(customer.id),
    name: customer.name,
    contact: typeof customer.contact === "string" ? customer.contact : "",
    phone: typeof customer.phone === "string" ? customer.phone : "",
    email: typeof customer.email === "string" ? customer.email : "",
    address: typeof customer.address === "string" ? customer.address : "",
    summary: typeof customer.summary === "string" ? customer.summary : "",
  } };
}
