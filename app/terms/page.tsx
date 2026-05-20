import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmailLink } from "../components/shared/ContactEmailLink";
import {
  LegalDocumentPage,
  LegalSection,
} from "../components/shared/LegalDocumentPage";
import { legalContactEmail } from "../lib/legal/contact-email";

export const metadata: Metadata = {
  title: "Terms of Service — Playlistly",
  description:
    "Rules for using Playlistly: acceptable use, disclaimers, and limitations.",
};

export default function TermsPage() {
  return (
    <LegalDocumentPage
      description="Rules for using Playlistly. Last updated May 2026."
      title="Terms of Service"
    >
      <LegalSection title="Agreement">
        <p>
          By using Playlistly at{" "}
          <a className="legal-page-link" href="https://playlistly.vercel.app">
            playlistly.vercel.app
          </a>
          , you agree to these terms. If you do not agree, do not use the site.
        </p>
      </LegalSection>

      <LegalSection title="What Playlistly is">
        <p>
          Playlistly is a free visual tool that loads YouTube playlist metadata
          and displays it on a canvas you can pan, zoom, and rearrange. Layouts
          are stored in your browser unless you export them yourself. Playlistly
          is not made by, endorsed by, or affiliated with Google or YouTube.
        </p>
      </LegalSection>

      <LegalSection title="Your responsibilities">
        <p>You agree to:</p>
        <ul className="legal-page-list">
          <li>Use the app only for lawful purposes</li>
          <li>
            Only load playlists and content you have the right to access
          </li>
          <li>
            Not abuse the service (spam requests, attempt to break rate limits,
            scrape, or disrupt the site)
          </li>
          <li>
            Comply with{" "}
            <a
              className="legal-page-link"
              href="https://www.youtube.com/t/terms"
              rel="noopener noreferrer"
              target="_blank"
            >
              YouTube&apos;s Terms of Service
            </a>{" "}
            when using playlist data from YouTube
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Accounts and sign-in">
        <p>
          Optional Google sign-in is provided to list your YouTube playlists.
          Google&apos;s terms and policies apply to your Google account. See our{" "}
          <Link className="legal-page-link" href="/privacy">
            Privacy
          </Link>{" "}
          page for how we handle data.
        </p>
      </LegalSection>

      <LegalSection title="No guarantees">
        <p>
          Playlistly is provided &quot;as is&quot; without warranties. We do not
          guarantee that the site will be available, error-free, or that saved
          layouts will never be lost (browser storage can be cleared, devices
          change, or browsers fail). Export a{" "}
          <code className="legal-page-code">.playlistly.json</code> file if you
          want a backup.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, Playlistly and its operator
          are not liable for indirect, incidental, or consequential damages
          arising from your use of the site — including lost data, lost profits,
          or issues caused by third-party services (Google, YouTube, Vercel).
        </p>
      </LegalSection>

      <LegalSection title="Changes and termination">
        <p>
          We may change these terms or stop offering the service at any time.
          Continued use after changes means you accept the updated terms. We may
          block access if we believe the service is being abused.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms? Contact{" "}
          <ContactEmailLink email={legalContactEmail} />.
        </p>
      </LegalSection>
    </LegalDocumentPage>
  );
}
