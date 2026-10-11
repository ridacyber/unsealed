import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Unsealed",
  description: "How Unsealed handles the letters you upload.",
};

const wrap: CSSProperties = { maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.25rem 4rem", lineHeight: 1.65 };
const h2: CSSProperties = { marginTop: "2rem" };

export default function PrivacyPage() {
  return (
    <main style={wrap}>
      <p><Link href="/">← Back to Unsealed</Link></p>
      <h1>Privacy Policy</h1>
      <p><em>Effective date: October 11, 2026</em></p>

      <p>
        Unsealed is a hackathon project that explains official letters in plain language. It was built by Rida Rahim and
        Muhammad Bin Zeeshan. This page explains what happens to the letter you upload.
      </p>

      <h2 style={h2}>What you upload</h2>
      <p>
        You choose a PDF of a letter. Our server reads the text out of the PDF and sends that text to AI models to
        produce your explanation. Only PDF uploads are accepted. Photos and scans without readable text are not supported.
      </p>

      <h2 style={h2}>Who processes your letter</h2>
      <p>
        The text of your letter is processed by AI models hosted through Nebius Token Factory, including NVIDIA Nemotron
        technology. One model reads the letter and pulls out the amount owed, the deadline, the required action, and the
        consequence. A second model checks whether the letter contradicts itself. We call these models through Nebius. We
        do not send your document to NVIDIA directly.
      </p>
      <p>
        How Nebius handles requests, including how long it keeps them and whether it uses them for any other purpose, is
        set by its own terms and privacy policy, which we do not control. Please review them before you upload anything
        you consider sensitive.
      </p>

      <h2 style={h2}>What we keep</h2>
      <p>
        We do not intentionally save your PDF, its text, or your results in a database or file storage, and we do not
        create accounts. Your results are shown in your browser and may be held temporarily in your browser memory or
        session storage on your own device so the results page can display them.
      </p>
      <p>
        Our hosting provider and our server may keep ordinary technical logs, such as request times and error messages. We
        have built Unsealed so that the text of your letter is not written to our own logs, but we cannot control how
        third-party services handle their logs.
      </p>

      <h2 style={h2}>What we do not do</h2>
      <p>
        We do not sell your data, use your letters for advertising, or knowingly add tracking cookies or analytics to
        Unsealed.
      </p>

      <h2 style={h2}>Please do not upload sensitive information</h2>
      <p>
        Unsealed is a demo. Do not upload letters that contain Social Security numbers, bank or card numbers, passwords,
        medical records, or other information you would not want sent to a third-party AI service. To try Unsealed, use a
        fictional or sample letter.
      </p>

      <h2 style={h2}>Children</h2>
      <p>Unsealed is not directed at children under 13, and we do not knowingly collect information from them.</p>

      <h2 style={h2}>Changes</h2>
      <p>We may update this policy as the project changes. The effective date above shows when it was last updated.</p>

      <h2 style={h2}>Contact</h2>
      <ul>
        <li>
          Questions about how your letter is processed (backend): Rida Rahim,{" "}
          <a href="mailto:ridarahim76@gmail.com">ridarahim76@gmail.com</a>
        </li>
        <li>
          Questions about the website and interface (frontend): Muhammad Bin Zeeshan,{" "}
          <a href="mailto:ziishantags@gmail.com">ziishantags@gmail.com</a>
        </li>
      </ul>

      <p><Link href="/terms">Terms of Service</Link></p>
    </main>
  );
}
