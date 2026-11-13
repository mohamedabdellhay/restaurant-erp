const RULES = {
  EGP: {
    digits: true,
    vat: /^\d{9}$/,
    cr: /^\d{5,15}$/,
    vatCode: "vat_egp",
    crCode: "cr_egp",
  },
  SAR: {
    digits: true,
    vat: /^3\d{14}$/,
    cr: /^\d{10}$/,
    vatCode: "vat_sar",
    crCode: "cr_sar",
  },
  AED: {
    digits: true,
    vat: /^\d{15}$/,
    cr: /^\d{5,20}$/,
    vatCode: "vat_aed",
    crCode: "cr_aed",
  },
  DEFAULT: {
    digits: false,
    vat: /^[A-Za-z0-9][A-Za-z0-9-]{4,19}$/,
    cr: /^[A-Za-z0-9][A-Za-z0-9-]{4,19}$/,
    vatCode: "vat_default",
    crCode: "cr_default",
  },
};

export const BUSINESS_MESSAGES = {
  name: "Business name must be between 2 and 100 characters",
  address: "Business address is required",
  phone: "Enter a valid phone number",
  email: "Enter a valid business email",
  vat_egp: "Egyptian VAT number must be 9 digits",
  vat_sar: "Saudi VAT number must be 15 digits and start with 3",
  vat_aed: "UAE tax number must be 15 digits",
  vat_default: "Tax number must be 5 to 20 letters or digits",
  cr_egp: "Commercial registration must be 5 to 15 digits",
  cr_sar: "Commercial registration must be 10 digits",
  cr_aed: "Commercial registration must be 5 to 20 digits",
  cr_default: "Commercial registration must be 5 to 20 letters or digits",
};

const compact = (value) => String(value ?? "").replace(/[\s-]/g, "");

export const businessRule = (currency) =>
  RULES[String(currency || "").toUpperCase()] || RULES.DEFAULT;

const present = (value) => String(value ?? "").trim() !== "";

export function validateBusiness(input = {}, { requireIdentity = true } = {}) {
  const rule = businessRule(input.currency);
  const issues = [];

  if (requireIdentity) {
    const name = String(input.name || "").trim();
    if (name.length < 2 || name.length > 100) issues.push({ field: "name", code: "name" });

    const address = String(input.address || "").trim();
    if (address.length < 5 || address.length > 200) {
      issues.push({ field: "address", code: "address" });
    }

    const phoneDigits = String(input.phone || "").replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      issues.push({ field: "phone", code: "phone" });
    }

    const email = String(input.email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      issues.push({ field: "email", code: "email" });
    }
  }

  const vat = rule.digits ? compact(input.vatNumber) : String(input.vatNumber || "").trim();
  if ((requireIdentity || present(input.vatNumber)) && !rule.vat.test(vat)) {
    issues.push({ field: "vatNumber", code: rule.vatCode });
  }

  const cr = rule.digits ? compact(input.crNumber) : String(input.crNumber || "").trim();
  if ((requireIdentity || present(input.crNumber)) && !rule.cr.test(cr)) {
    issues.push({ field: "crNumber", code: rule.crCode });
  }

  return { valid: issues.length === 0, issues };
}

export function normalizeBusinessFields(data = {}) {
  const rule = businessRule(data.currency);
  const next = { ...data };
  if (next.name != null) next.name = String(next.name).trim();
  if (next.address != null) next.address = String(next.address).trim();
  if (next.phone != null) next.phone = String(next.phone).trim();
  if (next.email != null) next.email = String(next.email).trim();
  if (next.vatNumber != null) {
    next.vatNumber = rule.digits ? compact(next.vatNumber) : String(next.vatNumber).trim();
  }
  if (next.crNumber != null) {
    next.crNumber = rule.digits ? compact(next.crNumber) : String(next.crNumber).trim();
  }
  return next;
}
