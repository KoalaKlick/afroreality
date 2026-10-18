// Standalone JuniPay sandbox/live collections test.
//
// Run from the repo root:
//   $env:JUNIPAY_CLIENT_ID="..." ; $env:JUNIPAY_PRIVATE_KEY="-----BEGIN..." ;
//   node scripts/junipay-test.mjs
//
// Or inline the values below (do NOT commit real keys).
//
// Prints the full `/payment` response so you can see the sandbox result.

import { importPKCS8, SignJWT } from "jose";

const CLIENT_ID = process.env.JUNIPAY_CLIENT_ID || "";
const PRIVATE_KEY = process.env.JUNIPAY_PRIVATE_KEY || "";
const BASE_URL = (process.env.JUNIPAY_BASE_URL || "https://api.junipayments.com").replace(/\/+$/, "");

// ── Tune these for the sandbox test ─────────────────────────────────────────
const PHONE = process.env.JUNIPAY_TEST_PHONE || "0244444444"; // sandbox number
const PROVIDER = process.env.JUNIPAY_TEST_PROVIDER || "vodafone"; // vodafone | airteltigo | mtn
const AMOUNT = Number(process.env.JUNIPAY_TEST_AMOUNT || 2); // GHS
const CALLBACK_URL = process.env.JUNIPAY_CALLBACK_URL || "https://example.com/webhooks/junipay";
// ─────────────────────────────────────────────────────────────────────────────

function derEncodeLength(len) {
  if (len < 0x80) return [len];
  const bytes = [];
  let r = len;
  while (r > 0) { bytes.unshift(r & 0xff); r >>>= 8; }
  return [0x80 | bytes.length, ...bytes];
}
function derEncode(tag, content) { return [tag, ...derEncodeLength(content.length), ...content]; }
function derSequence(children) { return derEncode(0x30, children.flat()); }
function derInteger(v) {
  const bytes = [];
  if (v === 0) bytes.push(0);
  else { let r = v; while (r > 0) { bytes.unshift(r & 0xff); r >>>= 8; } }
  if ((bytes[0] ?? 0) & 0x80) bytes.unshift(0);
  return derEncode(0x02, bytes);
}
const OID = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01];
function derOid(oid) { return derEncode(0x06, oid); }
function pkcs1ToPkcs8(pkcs1Der) {
  const algId = derSequence([derOid(OID), [0x05, 0x00]]);
  const octets = derEncode(0x04, Array.from(pkcs1Der));
  return new Uint8Array(derSequence([derInteger(0), algId, octets]));
}
function normalizePrivateKey(pem) {
  const t = pem.trim();
  if (!t.includes("BEGIN RSA PRIVATE KEY")) return t;
  const b64 = t.replace(/-----(BEGIN|END)[^-]+-----/g, "").replace(/[^A-Za-z0-9+/=]/g, "");
  const der = new Uint8Array(Buffer.from(b64, "base64"));
  const pkcs8 = pkcs1ToPkcs8(der);
  const out = Buffer.from(pkcs8).toString("base64");
  const lines = out.match(/.{1,64}/g).join("\n");
  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

if (!CLIENT_ID || !PRIVATE_KEY) {
  console.error("Missing JUNIPAY_CLIENT_ID or JUNIPAY_PRIVATE_KEY env vars.");
  process.exit(1);
}

const privateKey = await importPKCS8(normalizePrivateKey(PRIVATE_KEY), "RS256");
const token = await new SignJWT({ payload: CLIENT_ID })
  .setProtectedHeader({ alg: "RS256" })
  .setIssuedAt()
  .sign(privateKey);

const foreignID = `TEST_${Date.now()}`;
const body = {
  channel: "mobile_money",
  phoneNumber: PHONE,
  provider: PROVIDER,
  amount: AMOUNT,
  tot_amnt: AMOUNT,
  senderEmail: "sandbox@junipay.local",
  description: "Invoice 12345",
  foreignID,
  callbackUrl: CALLBACK_URL,
};

console.log("POST", `${BASE_URL}/payment`);
console.log("Body:", JSON.stringify(body, null, 2));

const response = await fetch(`${BASE_URL}/payment`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    clientid: CLIENT_ID,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const text = await response.text();
console.log("\nHTTP status:", response.status);
let data = {};
try { data = JSON.parse(text); } catch { data = { raw: text }; }
console.log("Response:", JSON.stringify(data, null, 2));
