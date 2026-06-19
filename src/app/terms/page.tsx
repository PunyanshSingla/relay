import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Relay",
  description: "Terms of Service for Relay AI Chief of Staff",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: June 19, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Relay (the &quot;Service&quot;), you agree to
            be bound by these Terms of Service (&quot;Terms&quot;). If you do
            not agree to these Terms, you must not access or use the Service.
            These Terms constitute a legally binding agreement between you and
            Relay.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            2. Description of Service
          </h2>
          <p>
            Relay is an AI-powered chief of staff for Gmail and Google Calendar.
            The Service provides email triage, prioritization, AI-generated
            reply drafts, daily briefs, meeting intelligence, follow-up
            tracking, contact management, semantic search, and workflow
            automation.
          </p>
          <p className="mt-2">
            Relay operates by connecting to your Google account via OAuth and
            processing your email and calendar data using artificial
            intelligence. The Service is currently in private beta.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            3. Account Registration
          </h2>
          <p>
            To use Relay, you must create an account and provide accurate,
            current, and complete information. You are responsible for
            maintaining the confidentiality of your account credentials and for
            all activities that occur under your account.
          </p>
          <p className="mt-2">
            You must be at least 16 years of age to create an account and use
            the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            4. Google Account Access
          </h2>
          <p>
            Relay requires access to your Google account via OAuth 2.0 to
            provide its core functionality. By granting Relay access, you
            authorize us to:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Read your Gmail messages and metadata</li>
            <li>Send emails and create drafts on your behalf</li>
            <li>Read, create, and modify Google Calendar events</li>
            <li>Access your Google profile information</li>
          </ul>
          <p className="mt-2">
            You may revoke Relay&apos;s access to your Google account at any
            time through your Google account security settings. Revoking access
            will disable the Service&apos;s core functionality.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            5. User Responsibilities
          </h2>
          <p>You agree to:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Use the Service only for lawful purposes and in accordance with
              these Terms
            </li>
            <li>
              Not use the Service to send spam, phishing emails, or malicious
              content
            </li>
            <li>
              Not attempt to gain unauthorized access to other users&apos;
              accounts or the Service&apos;s infrastructure
            </li>
            <li>
              Not use the Service to violate any applicable law or regulation
            </li>
            <li>
              Not reverse engineer, decompile, or disassemble any part of the
              Service
            </li>
            <li>
              Not use automated means (bots, scrapers) to access the Service
              except as intended through the Service&apos;s features
            </li>
            <li>
              Not resell, sublicense, or distribute the Service to third parties
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            6. AI-Generated Content
          </h2>
          <p>
            Relay uses artificial intelligence to generate email priorities,
            categories, reply drafts, summaries, and other content
            (&quot;AI Outputs&quot;). You acknowledge that:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              AI Outputs are generated by machine learning models and may
              contain errors or inaccuracies
            </li>
            <li>
              You are solely responsible for reviewing and approving AI Outputs
              before they are used (e.g., before sending an AI-drafted email)
            </li>
            <li>
              Relay does not guarantee the accuracy, completeness, or
              reliability of any AI Output
            </li>
            <li>
              Sending emails via Relay is done at your discretion and risk
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            7. Intellectual Property
          </h2>
          <p>
            The Service, including its design, code, features, and branding, is
            the intellectual property of Relay. These Terms do not grant you any
            right, title, or interest in the Service beyond the limited license
            to use it as provided herein.
          </p>
          <p className="mt-2">
            You retain all rights to your email content, calendar data, and
            other personal data. By using the Service, you grant Relay a
            limited, non-exclusive license to process this data solely for the
            purpose of providing the Service to you.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            8. Subscription and Payment
          </h2>
          <p>
            Relay offers both free and paid subscription plans. Paid
            subscription fees are non-refundable except where required by
            applicable law. Relay reserves the right to modify pricing with
            reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            9. Service Availability and Modifications
          </h2>
          <p>
            Relay is currently in private beta and may be modified, suspended,
            or discontinued at any time without notice. We do not guarantee
            uninterrupted or error-free operation of the Service. We may
            temporarily suspend access for maintenance or updates.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            10. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, Relay and its
            operators shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including but not limited to loss
            of data, revenue, profits, or business opportunities, arising from:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Your use of or inability to use the Service</li>
            <li>Any AI Outputs or actions taken based on them</li>
            <li>Unauthorized access to your account or data</li>
            <li>Errors, bugs, or interruptions in the Service</li>
          </ul>
          <p className="mt-2">
            In no event shall our total liability exceed the amount you paid us
            in the twelve (12) months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            11. Indemnification
          </h2>
          <p>
            You agree to indemnify and hold harmless Relay and its operators
            from any claims, losses, or damages arising from your use of the
            Service, your violation of these Terms, or your violation of any
            rights of a third party.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            12. Termination
          </h2>
          <p>
            You may terminate your account at any time by contacting us or
            through the Service&apos;s account settings. We may suspend or
            terminate your access to the Service at our discretion, with or
            without notice, for conduct that violates these Terms or is harmful
            to other users or the Service.
          </p>
          <p className="mt-2">
            Upon termination, your right to use the Service ceases immediately.
            We will delete your data within 30 days of termination, except
            where retention is required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            13. Governing Law
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of India, without regard to its conflict of law
            provisions. Any disputes arising from these Terms shall be resolved
            in the courts of India.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            14. Changes to These Terms
          </h2>
          <p>
            We reserve the right to modify these Terms at any time. We will
            notify you of material changes by posting the updated Terms on this
            page and updating the &quot;Last updated&quot; date. Your continued
            use of the Service after changes take effect constitutes acceptance
            of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            15. Contact Us
          </h2>
          <p>
            If you have any questions about these Terms, please contact us at:
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
