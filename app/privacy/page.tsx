import type { Metadata } from "next";
import Link from "next/link";
import { ContactEmailLink } from "../components/shared/ContactEmailLink";
import {
  LegalDocumentPage,
  LegalSection,
} from "../components/shared/LegalDocumentPage";
import { legalContactEmail } from "../lib/legal/contact-email";

export const metadata: Metadata = {
  title: "Privacy — Playlistly",
  description:
    "How Playlistly handles your data: browser storage, Google sign-in, and YouTube playlist loading.",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      description="Plain summary of what Playlistly stores and who it talks to. Last updated May 2026."
      title="Privacy"
    >
      <LegalSection title="The short version">
        <p>
          Playlistly is a visual canvas for YouTube playlists. Your layouts and
          preferences stay in{" "}
          <strong className="text-white/90">this browser</strong>. There is no
          Playlistly account database and no paid tier tracking you across the
          web.
        </p>
        <p>
          If you sign in with Google, we use that only to list and load your
          YouTube playlists. We do not sell your data or run ads.
        </p>
      </LegalSection>

      <LegalSection title="What stays on your device">
        <p>
          Playlistly saves some things in your browser&apos;s local storage:
        </p>
        <ul className="legal-page-list">
          <li>
            Canvas layout — tile positions, camera, and which playlists you
            loaded
          </li>
          <li>
            Cached playlist video metadata (titles, channels, etc.) to load
            faster
          </li>
          <li>Display settings — e.g. shortcut legend and hover details</li>
          <li>Whether you dismissed the welcome screen</li>
        </ul>
        <p>
          Clearing site data in your browser removes this. You can also clear
          playlist cache or saved layout from Settings in the app. Exporting a{" "}
          <code className="legal-page-code">.playlistly.json</code> file is
          entirely under your control — we do not upload those files to our
          servers.
        </p>
      </LegalSection>

      <LegalSection title="What hits our servers">
        <p>
          When you load a playlist, our app calls Playlistly API routes that:
        </p>
        <ul className="legal-page-list">
          <li>
            Fetch playlist contents from the{" "}
            <strong className="text-white/90">YouTube Data API</strong> (public
            playlist URLs can use an API key; signed-in users use your Google
            access token with read-only YouTube scope)
          </li>
          <li>Apply basic rate limits so the shared API key is not abused</li>
        </ul>
        <p>
          We do not store your playlists on a Playlistly database. Requests are
          processed to return data to your browser for that session.
        </p>
      </LegalSection>

      <LegalSection title="Google sign-in">
        <p>
          Optional sign-in uses Google through NextAuth. If you sign in, Google
          may share your name, email, and profile image so we can show your
          account menu. We request read-only access to YouTube (
          <code className="legal-page-code">youtube.readonly</code>) so you can
          pick playlists from your channel. We do not post, edit, or delete
          anything on YouTube for you.
        </p>
        <p>
          Google&apos;s own privacy policy applies to how Google handles your
          Google account:{" "}
          <a
            className="legal-page-link"
            href="https://policies.google.com/privacy"
            rel="noopener noreferrer"
            target="_blank"
          >
            policies.google.com/privacy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Hosting">
        <p>
          The site is hosted on Vercel. Vercel may process standard web logs (IP
          address, request timing, errors) as part of running the service. We do
          not use third-party analytics or ad trackers in the app.
        </p>
      </LegalSection>

      <LegalSection title="YouTube">
        <p>
          Playlistly is not made by Google or YouTube. Thumbnails and metadata
          come from YouTube. Use of YouTube content is subject to{" "}
          <a
            className="legal-page-link"
            href="https://www.youtube.com/t/terms"
            rel="noopener noreferrer"
            target="_blank"
          >
            YouTube&apos;s Terms of Service
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Playlistly is not directed at children under 13. If you believe a
          child has signed in or submitted data through the app, contact us and
          we will help remove local data they control via browser settings.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          This page may be updated as the app changes. The date at the top
          reflects the latest revision. Continued use after an update means you
          accept the revised summary.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about privacy? Reach us at{" "}
          <ContactEmailLink email={legalContactEmail} />. See also our{" "}
          <Link className="legal-page-link" href="/terms">
            Terms of Service
          </Link>
          . There is no separate data-export portal because we do not hold your
          layouts on our servers.
        </p>
      </LegalSection>
    </LegalDocumentPage>
  );
}
