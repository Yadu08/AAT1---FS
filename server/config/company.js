// Company profile shown on PDFs and invoice pages.
// Read at call time (not import time) so values from .env are always picked up.
export function getCompany() {
  return {
    name: process.env.COMPANY_NAME || "Y Labs",
    tagline: process.env.COMPANY_TAGLINE || "Software & Security Solutions",
    owner: process.env.COMPANY_OWNER || "Yadunandan S",
    address: process.env.COMPANY_ADDRESS || "Bengaluru, Karnataka, India",
    gstin: process.env.COMPANY_GSTIN || "",
    email: process.env.COMPANY_EMAIL || "",
    phone: process.env.COMPANY_PHONE || "",
  };
}
