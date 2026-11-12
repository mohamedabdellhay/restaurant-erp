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

const compact = (value) => String(value ?? "").replace(/[\s-]/g, "");

export const businessRule = (currency) =>
  RULES[String(currency || "").toUpperCase()] || RULES.DEFAULT;

export function validateBusiness(input = {}) {
  const rule = businessRule(input.currency);
  const issues = [];

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

  const vat = rule.digits ? compact(input.vatNumber) : String(input.vatNumber || "").trim();
  if (!rule.vat.test(vat)) issues.push({ field: "vatNumber", code: rule.vatCode });

  const cr = rule.digits ? compact(input.crNumber) : String(input.crNumber || "").trim();
  if (!rule.cr.test(cr)) issues.push({ field: "crNumber", code: rule.crCode });

  return { valid: issues.length === 0, issues };
}
