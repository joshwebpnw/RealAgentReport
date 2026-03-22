import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Real Agent Report',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="font-bold text-gray-900 text-lg">Real Agent Report</Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: March 21, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Who We Are</h2>
            <p>Real Agent Report is a free performance audit tool for real estate agents, operated by Real Agent Systems, LLC. Our website is located at realagentreport.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Audit Responses</h3>
            <p>When you take the performance audit, we collect the answers you provide: number of closings, lead volume, lead sources, average commission, response speed, and follow-up frequency. This data is used solely to calculate your performance score and personalized report.</p>
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Email Address</h3>
            <p>We collect your email address when you submit it to receive your report results. Your email may be used to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Deliver your performance report</li>
              <li>Send follow-up tips related to your results</li>
              <li>Inform you about Agent Assistant, our lead automation platform</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Usage Data</h3>
            <p>We automatically collect basic usage information including pages visited, browser type, and device information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To generate your personalized performance score and report</li>
              <li>To improve our audit tool and scoring algorithms</li>
              <li>To send you your results and related follow-up content</li>
              <li>To inform you about Agent Assistant (agentassistant.io), our paid platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Data Sharing</h2>
            <p>Your audit responses and email address may be shared with Agent Assistant (agentassistant.io), our companion platform, to pre-populate your account if you choose to sign up. We do not sell your personal information to any third party.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Third-Party Services</h2>
            <p>We use the following services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Vercel</strong> - for hosting and infrastructure</li>
              <li><strong>Neon</strong> - for database hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Data Security</h2>
            <p>We use encrypted connections (TLS/SSL) and secure database hosting. Your audit data is stored securely and access is restricted to authorized personnel only.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to the data we hold about you</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications at any time</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at josh@patriotpulsedigital.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Cookies</h2>
            <p>This site does not use cookies for tracking or advertising. We may use minimal session storage to maintain your progress through the audit flow.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Children&apos;s Privacy</h2>
            <p>This service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Changes to This Policy</h2>
            <p>We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Contact Us</h2>
            <p>If you have questions about this privacy policy, contact us at:</p>
            <p className="mt-2">
              <strong>Real Agent Systems, LLC</strong><br />
              Email: josh@patriotpulsedigital.com
            </p>
          </section>
        </div>
      </main>
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm">
          <div className="flex justify-center gap-6 mb-3">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Real Agent Systems, LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
