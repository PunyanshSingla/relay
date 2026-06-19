import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Relay",
  description: "Privacy Policy for Relay AI Chief of Staff",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: June 19, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            1. Introduction
          </h2>
          <p>
            Relay (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is an AI-powered
            chief of staff for Gmail and Google Calendar. This Privacy Policy
            explains how we collect, use, store, and protect your information
            when you use our application and related services (collectively, the
            &quot;Service&quot;).
          </p>
          <p className="mt-2">
            By using Relay, you agree to the collection and use of information
            in accordance with this policy. If you do not agree, please
            discontinue use of the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            2. Information We Collect
          </h2>
          <p className="mb-2">
            We collect the following categories of information:
          </p>

          <h3 className="mb-1 font-semibold text-foreground">
            2.1 Account Information
          </h3>
          <p>
            When you create an account, we collect your name, email address, and
            password (stored in hashed form). If you sign in via Google OAuth,
            we receive your basic Google profile information (name, email,
            profile image) as authorized by you.
          </p>

          <h3 className="mb-1 mt-3 font-semibold text-foreground">
            2.2 Gmail Data
          </h3>
          <p>
            With your explicit authorization via Google OAuth, Relay accesses
            your Gmail account to provide its core functionality. This includes:
          </p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            <li>Email content (text, HTML, and attachments)</li>
            <li>Sender and recipient information</li>
            <li>Email subjects, threads, and labels</li>
            <li>Timestamps, read/starred status</li>
            <li>Draft emails</li>
          </ul>
          <p className="mt-2">
            We use this data to enable AI-powered email triage, prioritization,
            reply drafting, follow-up tracking, semantic search, and daily brief
            generation.
          </p>

          <h3 className="mb-1 mt-3 font-semibold text-foreground">
            2.3 Google Calendar Data
          </h3>
          <p>
            With your authorization, we access your Google Calendar to provide
            meeting intelligence, scheduling, and event creation. This includes:
          </p>
          <ul className="mt-1 list-inside list-disc space-y-1">
            <li>Event titles, descriptions, and locations</li>
            <li>Start and end times</li>
            <li>Attendee information</li>
            <li>Event status (confirmed, tentative, cancelled)</li>
          </ul>

          <h3 className="mb-1 mt-3 font-semibold text-foreground">
            2.4 Usage and Interaction Data
          </h3>
          <p>
            We collect information about how you interact with Relay, including
            actions taken, command usage patterns, and feature engagement. This
            data is used to improve the Service and power workflow automation
            suggestions.
          </p>

          <h3 className="mb-1 mt-3 font-semibold text-foreground">
            2.5 Device and Log Information
          </h3>
          <p>
            We automatically collect IP addresses, browser type, operating
            system, and log data for security, debugging, and service
            improvement purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            3. How We Use Your Information
          </h2>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong className="text-foreground">Email Processing:</strong> AI
              classification, prioritization (P1/P2/P3), reply drafting, and
              daily brief generation.
            </li>
            <li>
              <strong className="text-foreground">Calendar Integration:</strong>{" "}
              Meeting intelligence, event creation, and conflict detection.
            </li>
            <li>
              <strong className="text-foreground">Contact Intelligence:</strong>{" "}
              Relationship tracking, interaction history, and VIP flagging.
            </li>
            <li>
              <strong className="text-foreground">Semantic Search:</strong>{" "}
              Vector embeddings of email content to enable natural-language
              search.
            </li>
            <li>
              <strong className="text-foreground">
                Workflow Automation:
              </strong>{" "}
              Learning repeated action patterns to suggest and execute
              automations.
            </li>
            <li>
              <strong className="text-foreground">Service Improvement:</strong>{" "}
              Debugging, performance monitoring, and feature development.
            </li>
            <li>
              <strong className="text-foreground">Security:</strong> Fraud
              prevention, authentication, and abuse detection.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            4. AI and Automated Processing
          </h2>
          <p>
            Relay uses Google Gemini (via the Google AI SDK) to process email
            content for classification, priority scoring, and reply generation.
            Email content is transmitted to Google&apos;s AI services solely for
            the purpose of generating responses and classifications on your
            behalf. Your email data is not used to train Google&apos;s AI models.
            AI-generated outputs (priorities, categories, drafts, summaries) are
            stored in our database to provide the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            5. Data Storage and Security
          </h2>
          <p>
            Your data is stored in encrypted databases hosted on Supabase
            (PostgreSQL with pgvector). We implement industry-standard security
            measures including:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Encryption in transit (TLS/HTTPS)</li>
            <li>Password hashing with salt</li>
            <li>Secure session management</li>
            <li>OAuth token encryption</li>
            <li>Regular security monitoring</li>
          </ul>
          <p className="mt-2">
            OAuth access tokens are encrypted at rest. We store only the minimum
            tokens necessary to provide the Service and refresh them
            automatically.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            6. Data Sharing and Third Parties
          </h2>
          <p>We do not sell your personal data. We share data only with:</p>
          <ul className="mt-2 list-inside list-disc space-y-2">
            <li>
              <strong className="text-foreground">Google LLC:</strong> Via OAuth
              APIs for Gmail and Calendar access, and via the Google AI SDK for
              AI-powered email processing.
            </li>
            <li>
              <strong className="text-foreground">Supabase:</strong> Database
              hosting and infrastructure.
            </li>
            <li>
              <strong className="text-foreground">Vercel:</strong> Application
              hosting and deployment.
            </li>
            <li>
              <strong className="text-foreground">Resend:</strong> Transactional
              email delivery (e.g., email verification).
            </li>
            <li>
              <strong className="text-foreground">Inngest:</strong> Background
              job processing for email sync, classification, and automation
              workflows.
            </li>
          </ul>
          <p className="mt-2">
            All third-party providers are bound by data processing agreements
            and are only authorized to process data as necessary to provide
            their respective services.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            7. Data Retention
          </h2>
          <p>
            We retain your data for as long as your account is active or as
            needed to provide the Service. Gmail and Calendar data is synced and
            stored to power features like semantic search, contact intelligence,
            and workflow learning. When you revoke Google access or delete your
            account, we will delete your stored data within 30 days, except
            where we are legally required to retain it.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            8. Your Rights
          </h2>
          <p>You have the right to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong className="text-foreground">Access:</strong> Request a
              copy of the personal data we hold about you.
            </li>
            <li>
              <strong className="text-foreground">Deletion:</strong> Request
              deletion of your account and associated data.
            </li>
            <li>
              <strong className="text-foreground">Revoke Access:</strong>{" "}
              Disconnect your Google account at any time through Google account
              settings or by contacting us.
            </li>
            <li>
              <strong className="text-foreground">Export:</strong> Request an
              export of your data in a portable format.
            </li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us at{" "}
            <strong className="text-foreground">
              punyanshcoder@gmail.com
            </strong>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            9. Children&apos;s Privacy
          </h2>
          <p>
            Relay is not intended for use by individuals under the age of 16. We
            do not knowingly collect personal information from children. If you
            believe we have collected information from a child, please contact
            us immediately.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            10. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new policy on this page
            and updating the &quot;Last updated&quot; date. Continued use of the
            Service after changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            11. Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at:
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Email:</strong>{" "}
            punyanshcoder@gmail.com
          </p>
        </section>
      </div>
    </main>
  );
}
