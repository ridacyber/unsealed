// owner: m
/**
 * Made-up letters with prepared answers, for checking how the results view
 * handles states the three public samples don't show. They are not analyses
 * and are never sent anywhere. They're reached only by an unlisted preview
 * address (/results?fixture=<id>), which labels them as test fixtures, only
 * where `fixturesEnabled` allows, and they are deliberately kept out of
 * SAMPLE_LETTERS. Only the server reads this file.
 *
 * Offsets for passages the letter holds are found the way the service finds
 * them (lib/verify.ts), never typed in by hand. The few that are meant to be
 * wrong are built explicitly, and say so.
 */
import type { AnalysisResult, Citation, Field } from "@/lib/schema";
import { indexDocument, locate } from "@/lib/verify";

export const FIXTURE_IDS = [
  "all-verified",
  "mixed",
  "related-unsure",
  "multi-conflict",
  "check-failed",
  "none-confirmed",
  "unmatched",
  "no-text",
  "long",
  "money-to-you",
] as const;

export type FixtureId = (typeof FIXTURE_IDS)[number];

export interface Fixture {
  id: FixtureId;
  title: string;
  /** What the fixture is for, in a few words. */
  checks: string;
  result: AnalysisResult;
}

export function isFixtureId(value: unknown): value is FixtureId {
  return typeof value === "string" && (FIXTURE_IDS as readonly string[]).includes(value);
}

/**
 * Whether the preview address may show fixtures: while developing (`next
 * dev`), or in a built app whose server sets UNSEALED_TEST_FIXTURES=1 at
 * run time, as a local review build does. A deployment that doesn't set it
 * never shows them; the address falls back to the public sample.
 */
export function fixturesEnabled(env: {
  NODE_ENV?: string;
  UNSEALED_TEST_FIXTURES?: string;
}): boolean {
  return env.NODE_ENV === "development" || env.UNSEALED_TEST_FIXTURES === "1";
}

/** Citations for one letter, located the way the service locates them. */
function citer(letter: string) {
  const index = indexDocument(letter);
  return (quote: string): Citation => {
    const found = locate(quote, index);
    if (!found) throw new Error(`Fixture quote is not in its letter: ${quote}`);
    return { quote, ...found };
  };
}

const DISCLAIMER = "Unsealed explains documents. It is not legal or financial advice.";
// The note the service gives a field it downgrades because of a conflict.
const CONFLICT_NOTE =
  "This letter gives different answers in different places. Please confirm with the sender.";

const verified = (value: string, citation: Citation, confidence = 0.95): Field => ({
  status: "verified",
  value,
  normalized: null,
  citation,
  confidence,
  note: null,
});
const unsure = (value: string | null, citation: Citation | null, note: string | null): Field => ({
  status: "unsure",
  value,
  normalized: null,
  citation,
  confidence: 0.45,
  note,
});
const notFound = (note: string | null = "The letter doesn't say."): Field => ({
  status: "not_found",
  value: null,
  normalized: null,
  citation: null,
  confidence: 0,
  note,
});
const metrics = (checkStatus?: "ok" | "failed"): AnalysisResult["metrics"] => ({
  model: "fixture",
  inputTokens: 0,
  outputTokens: 0,
  latencyMs: 0,
  costUsd: 0,
  ...(checkStatus ? { checkStatus } : {}),
});

// --- 1. Four verified answers -------------------------------------------

const waterBill = `LAKEMOOR MUNICIPAL WATER (fictional)
Customer Billing

Statement date: October 2, 2026

Dear Customer,

Your water and sewer charges for September 2026 come to $84.20. Payment is due by November 3, 2026.

Please pay online, by phone, or by mail using the enclosed slip.

If payment is not received by the due date, a late fee of $10.00 will be added to your next bill.

Lakemoor Municipal Water`;
const w = citer(waterBill);

const allVerified: AnalysisResult = {
  id: "fixture-all-verified",
  documentType: "Water bill",
  documentText: waterBill,
  summary:
    "Your water company says your September charges are due by a set date, and a late fee is added if you pay after it.",
  fields: {
    amountOwed: verified("$84.20", w("charges for September 2026 come to $84.20")),
    deadline: verified("November 3, 2026", w("Payment is due by November 3, 2026")),
    requiredAction: verified(
      "Pay online, by phone, or by mail",
      w("Please pay online, by phone, or by mail"),
    ),
    consequence: verified(
      "A $10.00 late fee on your next bill",
      w("a late fee of $10.00 will be added to your next bill"),
    ),
  },
  overall: "ok",
  disclaimer: DISCLAIMER,
  metrics: metrics("ok"),
};

// --- 2. Verified, unsure and not found together -------------------------

const parkingNotice = `CITY OF ASHBRIDGE (fictional)
Parking Services

Notice date: October 6, 2026

A parking citation has been issued for the vehicle registered to you. The fine is $45.00.

Please pay the fine or request a review within the next few weeks.

Ashbridge Parking Services`;
const pk = citer(parkingNotice);

const mixed: AnalysisResult = {
  id: "fixture-mixed",
  documentType: "Parking citation notice",
  documentText: parkingNotice,
  summary:
    "Your city says a parking fine was issued for your car and asks you to pay it or ask for a review. It doesn't give an exact date.",
  fields: {
    amountOwed: verified("$45.00", pk("The fine is $45.00")),
    deadline: unsure(
      "Within the next few weeks",
      pk("within the next few weeks"),
      "The letter gives no exact date, only \"within the next few weeks\".",
    ),
    requiredAction: verified(
      "Pay the fine or request a review",
      pk("Please pay the fine or request a review"),
    ),
    consequence: notFound(),
  },
  overall: "partial",
  disclaimer: DISCLAIMER,
  metrics: metrics("ok"),
};

// --- 3. One conflict, several related answers left unsure -----------------

const clinicBill = `BRAMBLE HILL CLINIC (fictional)
Patient Accounts

Statement date: September 30, 2026

BALANCE SUMMARY
Amount due: $312.40
Due date: October 28, 2026

Dear Patient,

After your insurance payment, your remaining balance for your visit on August 14, 2026 is $321.40. To settle your account, please pay $321.40 by October 28, 2026.

If your balance is not paid by the due date, your account may be sent to a collection agency.

Patient Accounts Office`;
const cl = citer(clinicBill);

const relatedUnsure: AnalysisResult = {
  id: "fixture-related-unsure",
  documentType: "Patient statement",
  documentText: clinicBill,
  summary:
    "Your clinic says you have a balance left after insurance and asks you to pay it by a set date. The letter gives two different amounts.",
  fields: {
    amountOwed: unsure("$312.40", cl("Amount due: $312.40"), CONFLICT_NOTE),
    deadline: verified("October 28, 2026", cl("Due date: October 28, 2026")),
    // Repeats the disputed amount, so the service left it unsure too.
    requiredAction: unsure(
      "Pay $321.40 by October 28, 2026",
      cl("please pay $321.40 by October 28, 2026"),
      CONFLICT_NOTE,
    ),
    consequence: verified(
      "Your account may be sent to a collection agency",
      cl("your account may be sent to a collection agency"),
    ),
  },
  overall: "partial",
  warnings: [
    {
      kind: "conflict",
      message: "The letter gives two different amounts: $312.40 and $321.40.",
      quotes: [cl("Amount due: $312.40"), cl("remaining balance for your visit on August 14, 2026 is $321.40")],
    },
  ],
  disclaimer: DISCLAIMER,
  metrics: metrics("ok"),
};

// --- 4. Two conflicts, plus one the page must leave out -------------------

const leaseNotice = `HARBORVIEW APARTMENTS (fictional)
Resident Office

Notice date: October 1, 2026

RENEWAL SUMMARY
New monthly rent: $1,450.00
Reply by: October 20, 2026

Dear Resident,

Your lease ends on November 30, 2026. If you renew, your new monthly rent will be $1,540.00. Please return the signed renewal form by October 25, 2026.

If we do not hear from you by the reply date, we will assume you are moving out at the end of your lease.

Resident Office`;
const ls = citer(leaseNotice);

const multiConflict: AnalysisResult = {
  id: "fixture-multi-conflict",
  documentType: "Lease renewal notice",
  documentText: leaseNotice,
  summary:
    "Your landlord offers a lease renewal at a new rent and asks for a signed form by a reply date. The letter gives two different rents and two different reply dates.",
  fields: {
    amountOwed: unsure("$1,450.00", ls("New monthly rent: $1,450.00"), CONFLICT_NOTE),
    deadline: unsure("October 20, 2026", ls("Reply by: October 20, 2026"), CONFLICT_NOTE),
    requiredAction: unsure(
      "Return the signed renewal form by October 25, 2026",
      ls("Please return the signed renewal form by October 25, 2026"),
      CONFLICT_NOTE,
    ),
    consequence: verified(
      "The landlord will assume you are moving out at the end of your lease",
      ls("we will assume you are moving out at the end of your lease"),
    ),
  },
  overall: "partial",
  warnings: [
    {
      kind: "conflict",
      message: "The letter gives two different monthly rents: $1,450.00 and $1,540.00.",
      quotes: [ls("New monthly rent: $1,450.00"), ls("your new monthly rent will be $1,540.00")],
    },
    {
      kind: "conflict",
      message: "The letter gives two different reply dates: October 20, 2026 and October 25, 2026.",
      quotes: [ls("Reply by: October 20, 2026"), ls("return the signed renewal form by October 25, 2026")],
    },
    // Deliberately unconfirmable: its second passage points at the wrong
    // words. The page must list it apart and mark none of it in the letter.
    {
      kind: "conflict",
      message: "This conflict has a passage that can't be confirmed.",
      quotes: [ls("Your lease ends on November 30, 2026"), { quote: "Your lease ends on December 31, 2026", start: 0, end: 36 }],
    },
  ],
  disclaimer: DISCLAIMER,
  metrics: metrics("ok"),
};

// --- 5. The consistency check didn't finish --------------------------------

const checkFailed: AnalysisResult = {
  ...allVerified,
  id: "fixture-check-failed",
  metrics: metrics("failed"),
};

// --- 6. Nothing confirmed --------------------------------------------------

const vagueLetter = `NORTHGATE SERVICES GROUP (fictional)

Re: Your account

Dear Customer,

We are writing about your account with us. Some changes may apply in the coming period, and further details will follow in due course. Please keep this letter for your records.

Northgate Services Group`;
const vg = citer(vagueLetter);

const noneConfirmed: AnalysisResult = {
  id: "fixture-none-confirmed",
  documentType: "Account letter",
  documentText: vagueLetter,
  summary:
    "A company writes about your account and says changes may apply, but gives no amounts, dates or clear requests.",
  fields: {
    amountOwed: notFound(),
    deadline: notFound(),
    requiredAction: unsure(
      "Keep this letter",
      vg("Please keep this letter for your records"),
      "The letter only asks you to keep it; it's not clear anything else is needed.",
    ),
    consequence: notFound(),
  },
  overall: "abstained",
  disclaimer: DISCLAIMER,
  metrics: metrics("ok"),
};

// --- 7. Quotes whose offsets can't be confirmed ----------------------------

const libraryNotice = `WESTFIELD PUBLIC LIBRARY (fictional)

Notice date: October 3, 2026

Our records show 2 items checked out on your card are overdue. Please return them or pay the replacement cost of $38.50 by October 31, 2026.

Westfield Public Library`;
const lb = citer(libraryNotice);
const replacement = lb("replacement cost of $38.50");

const unmatched: AnalysisResult = {
  id: "fixture-unmatched",
  documentType: "Overdue items notice",
  documentText: libraryNotice,
  summary:
    "Your library says two items are overdue and asks you to return them or pay for them by a set date.",
  fields: {
    // Deliberately wrong: the right quote, offsets shifted onto other words.
    amountOwed: verified("$38.50", {
      ...replacement,
      start: replacement.start - 20,
      end: replacement.end - 20,
    }),
    deadline: verified("October 31, 2026", lb("by October 31, 2026")),
    // Deliberately unlocated: the service reports -1 when it can't find one.
    requiredAction: unsure(
      "Return the items or pay for them",
      { quote: "return the items to any branch", start: -1, end: -1 },
      "The quoted wording couldn't be found in the letter's text.",
    ),
    consequence: notFound(),
  },
  overall: "partial",
  disclaimer: DISCLAIMER,
  metrics: metrics("ok"),
};

// --- 8. No text available --------------------------------------------------

const noText: AnalysisResult = {
  ...allVerified,
  id: "fixture-no-text",
  documentText: "",
  fields: {
    amountOwed: { ...allVerified.fields.amountOwed, citation: { quote: "charges for September 2026 come to $84.20", start: -1, end: -1 } },
    deadline: { ...allVerified.fields.deadline, citation: { quote: "Payment is due by November 3, 2026", start: -1, end: -1 } },
    requiredAction: notFound(),
    consequence: notFound(),
  },
  overall: "partial",
};

// --- 9. A long letter with long quotes --------------------------------------

const longParagraphs = [
  "This notice explains changes to the way your property is assessed for the 2027 tax year. Assessments are reviewed every two years, and the figures below reflect the review completed in August 2026.",
  "The assessed value of your property has been set at $286,400.00, compared with $271,900.00 in the previous review. The change reflects sales of similar homes in your area during the review period.",
  "If you believe the assessed value is wrong, you may file an appeal with the Board of Review. Appeals must include the reasons you believe the value is wrong and any supporting documents, such as a recent appraisal, photographs of the property, or records of sales of comparable homes.",
  "Your first installment of property tax for the 2027 tax year is $2,148.00 and is due on or before January 31, 2027. The second installment will be billed separately in the spring.",
  "Payments may be made online, by mail, or in person at the County Treasurer's Office during regular business hours. Please include your parcel number on any payment.",
  "If the first installment is not paid in full by January 31, 2027, interest will be charged at one percent per month on the unpaid amount from the due date until it is paid, and the unpaid amount may be reported to the county for collection.",
  "Property owners aged 65 or older, and owners with certain disabilities, may qualify for an exemption that reduces the assessed value. Applications are available from the Assessor's Office and must be filed by March 1, 2027.",
];
const longLetter = `COUNTY OF RIVERMEAD (fictional)
Office of the Assessor and Treasurer

Notice date: October 10, 2026
Parcel number: 00-000-000

Dear Property Owner,

${[
  ...longParagraphs,
  // The letter repeats its opening section later, with a different figure.
  ...longParagraphs
    .slice(0, 3)
    .map((p) => p.replace("This notice", "This part of the notice").replace("$286,400.00", "$268,400.00")),
].join("\n\n")}

Sincerely,
Office of the Assessor and Treasurer`;
const lg = citer(longLetter);

const long: AnalysisResult = {
  id: "fixture-long",
  documentType: "Property tax and assessment notice",
  documentText: longLetter,
  summary:
    "Your county explains your new property assessment and bills the first installment of your 2027 property tax, with interest if it's paid late. You can appeal the assessment, and some owners can apply for an exemption.",
  fields: {
    amountOwed: verified("$2,148.00", lg("Your first installment of property tax for the 2027 tax year is $2,148.00")),
    deadline: verified("January 31, 2027", lg("is due on or before January 31, 2027")),
    requiredAction: verified(
      "Pay the first installment online, by mail, or in person at the County Treasurer's Office, and include your parcel number on any payment",
      lg("Payments may be made online, by mail, or in person at the County Treasurer's Office during regular business hours. Please include your parcel number on any payment."),
    ),
    consequence: verified(
      "Interest of one percent per month on the unpaid amount, which may also be reported to the county for collection",
      lg("interest will be charged at one percent per month on the unpaid amount from the due date until it is paid, and the unpaid amount may be reported to the county for collection"),
    ),
  },
  overall: "ok",
  warnings: [
    {
      kind: "conflict",
      message:
        "The letter gives two different assessed values for your property: $286,400.00 and $268,400.00.",
      quotes: [
        lg("The assessed value of your property has been set at $286,400.00, compared with $271,900.00 in the previous review. The change reflects sales of similar homes in your area during the review period."),
        lg("The assessed value of your property has been set at $268,400.00, compared with $271,900.00 in the previous review. The change reflects sales of similar homes in your area during the review period."),
      ],
    },
  ],
  disclaimer: DISCLAIMER,
  metrics: metrics("ok"),
};

// --- 10. Money owed to the reader --------------------------------------------

const depositLetter = `OAKRIDGE PROPERTY MANAGEMENT (fictional)

Date: October 8, 2026

Re: Return of security deposit

Dear Former Resident,

Following your move-out inspection, we will return $640.00 of your security deposit to you. To receive your refund check, please confirm your forwarding address by November 15, 2026.

If we do not receive a forwarding address, your refund will be held at our office.

Oakridge Property Management`;
const dp = citer(depositLetter);

const moneyToYou: AnalysisResult = {
  id: "fixture-money-to-you",
  documentType: "Security deposit return letter",
  documentText: depositLetter,
  summary:
    "Your former landlord says it will return $640.00 of your security deposit to you. This is money owed to you, not money you need to pay. To get the check, confirm your forwarding address by the date given.",
  fields: {
    amountOwed: notFound("The letter is about money owed to you, not an amount you need to pay."),
    deadline: verified("November 15, 2026", dp("confirm your forwarding address by November 15, 2026")),
    requiredAction: verified(
      "Confirm your forwarding address",
      dp("please confirm your forwarding address"),
    ),
    consequence: verified(
      "Your refund will be held at their office",
      dp("your refund will be held at our office"),
    ),
  },
  overall: "partial",
  disclaimer: DISCLAIMER,
  metrics: metrics("ok"),
};

export const FIXTURES: readonly Fixture[] = [
  { id: "all-verified", title: "Water bill (fixture)", checks: "Four verified answers", result: allVerified },
  { id: "mixed", title: "Parking notice (fixture)", checks: "Verified, unsure and not found together", result: mixed },
  { id: "related-unsure", title: "Clinic statement (fixture)", checks: "One conflict, two related answers unsure", result: relatedUnsure },
  { id: "multi-conflict", title: "Lease renewal (fixture)", checks: "Two conflicts, and one whose passage can't be confirmed, listed apart", result: multiConflict },
  { id: "check-failed", title: "Water bill, check failed (fixture)", checks: "The consistency check didn't finish", result: checkFailed },
  { id: "none-confirmed", title: "Vague letter (fixture)", checks: "Nothing confirmed", result: noneConfirmed },
  { id: "unmatched", title: "Library notice (fixture)", checks: "Quotes whose place can't be confirmed", result: unmatched },
  { id: "no-text", title: "Water bill without text (fixture)", checks: "No letter text available", result: noText },
  { id: "long", title: "Property tax notice (fixture)", checks: "A long letter and long quotes", result: long },
  { id: "money-to-you", title: "Deposit return (fixture)", checks: "Money owed to the reader", result: moneyToYou },
];

export function getFixture(id: FixtureId): Fixture {
  const fixture = FIXTURES.find((item) => item.id === id);
  if (!fixture) throw new Error(`Unknown fixture: ${id}`);
  return fixture;
}
