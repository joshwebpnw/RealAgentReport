import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Real Agent Report',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="font-bold text-gray-900 text-lg">Real Agent Report</Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: March 21, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Real Agent Report (&quot;the Service&quot;), operated by Real Agent Systems, LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Description of Service</h2>
            <p>Real Agent Report is a free online tool that provides real estate agents with a performance score based on self-reported data. The Service analyzes your lead response speed, follow-up frequency, and conversion metrics to generate a personalized performance report with actionable improvement recommendations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. No Account Required</h2>
            <p>You do not need to create an account to use the audit tool. You will be asked to provide your email address to receive your results. By providing your email, you consent to receiving your report and related follow-up communications.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Accuracy of Information</h2>
            <p>The performance scores, percentile rankings, commission gap estimates, and improvement recommendations provided by the Service are based on industry benchmarks and statistical models. They are intended for informational and educational purposes only.</p>
            <p className="mt-3">We do not guarantee the accuracy of any estimates or projections. Actual results depend on many factors outside our control, including market conditions, individual effort, and local market dynamics.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. No Professional Advice</h2>
            <p>The Service does not constitute financial, business, legal, or professional advice. You should consult with appropriate professionals before making business decisions based on your report results.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Submit false or misleading information to manipulate your score</li>
              <li>Use automated tools to repeatedly access the Service</li>
              <li>Attempt to reverse-engineer the scoring algorithms</li>
              <li>Use the Service for any illegal purpose</li>
              <li>Copy, reproduce, or redistribute the Service or its content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Intellectual Property</h2>
            <p>All content, scoring methodologies, design, and code comprising the Service are the property of Real Agent Systems, LLC. Your use of the Service does not grant you any ownership rights to our intellectual property.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Related Services</h2>
            <p>The Service may recommend or link to Agent Assistant (agentassistant.io), our paid lead automation platform. Use of Agent Assistant is subject to its own separate Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Real Agent Systems, LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. The Service is provided &quot;as is&quot; without warranties of any kind.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Service Availability</h2>
            <p>We strive to keep the Service available but do not guarantee uninterrupted access. We may modify, suspend, or discontinue the Service at any time without notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of Washington, without regard to conflict of law principles.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">12. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated date. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">13. Contact Us</h2>
            <p>If you have questions about these Terms, contact us at:</p>
            <p className="mt-2">
              <strong>Real Agent Systems, LLC</strong><br />
              Email: contact@realagentlabs.com
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
