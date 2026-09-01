export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm md:p-12">
        <header className="mb-10 border-b border-gray-200 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Privacy Policy
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Last updated: September 2026
          </p>
        </header>

        <div className="space-y-10 text-gray-700 leading-7">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              1. Introduction
            </h2>

            <p>
              Billio is a free, open-source application designed to help
              individuals and groups track shared expenses and manage balances.
            </p>

            <p className="mt-4">
              This Privacy Policy explains what information may be collected
              when you use Billio, how that information is stored, and how it is
              handled.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              2. Information We Collect
            </h2>

            <p>
              When you create and use an account, Billio may store information
              necessary to provide the service, including:
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Your name</li>
              <li>Your email address</li>
              <li>Your account credentials</li>
              <li>Groups you create or join</li>
              <li>Group participants</li>
              <li>Expenses and expense splits</li>
              <li>
                Other information you voluntarily provide through the
                application
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              3. How We Use Your Information
            </h2>

            <p>
              The information stored by Billio is used solely to provide and
              operate the application's functionality.
            </p>

            <p className="mt-4">
              Your information is not sold, rented, or otherwise provided to
              third parties for advertising or marketing purposes.
            </p>

            <p className="mt-4">
              Billio does not use your expense data, group information, or
              account information for commercial profiling or advertising.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              4. Password Security
            </h2>

            <p>
              Billio does not store your password in plain text. Passwords are
              securely hashed before being stored and cannot be retrieved in
              their original form by the application.
            </p>

            <p className="mt-4">
              You are responsible for keeping your account credentials secure
              and for choosing a sufficiently strong password.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              5. Third-Party Service Providers
            </h2>

            <p>
              Billio relies on third-party infrastructure providers to operate
              the application. These providers may process or store data on
              behalf of Billio as necessary to provide their services.
            </p>

            <ul className="mt-4 list-disc space-y-3 pl-6">
              <li>
                <strong>Turso</strong> — used for database hosting and
                management.
              </li>

              <li>
                <strong>Vercel</strong> — used for application hosting and
                deployment.
              </li>

              <li>
                <strong>Resend</strong> — used to deliver transactional emails,
                such as password reset emails.
              </li>
            </ul>

            <p className="mt-4">
              These services are used as infrastructure necessary to operate
              Billio and are not used by Billio to sell or monetize your
              personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              6. Emails
            </h2>

            <p>
              Billio may send transactional emails when necessary to provide
              certain features, such as password recovery or group invitations.
            </p>

            <p className="mt-4">
              These emails are sent using Resend. Billio does not use your email
              address to send advertising or promotional communications
              unrelated to the service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              7. Data Retention
            </h2>

            <p>
              Billio is provided as a free personal project and operates with
              limited infrastructure and resources. While reasonable measures
              are taken to keep the service available and preserve stored
              information, we cannot guarantee that your data will always be
              available or permanently retained.
            </p>

            <p className="mt-4">
              Data may be lost, deleted, or become unavailable as a result of
              technical failures, maintenance, infrastructure changes, or the
              discontinuation of the service.
            </p>

            <p className="mt-4">
              Users should therefore not rely on Billio as the sole or permanent
              storage location for important financial information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              8. Account Deletion
            </h2>

            <p>
              You may request deletion of your Billio account through the
              functionality provided by the application.
            </p>

            <p className="mt-4">
              When an account is deleted, information associated with that
              account may also be deleted where technically and legally
              appropriate.
            </p>

            <p className="mt-4">
              Some information may remain temporarily in backups, logs, or
              third-party infrastructure according to the retention policies of
              those services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              9. Data Privacy
            </h2>

            <p>
              Billio is designed with privacy in mind. Information stored in the
              application is intended to remain private and is not intentionally
              made publicly available or sold to third parties.
            </p>

            <p className="mt-4">
              However, no online service can guarantee absolute security or
              protection against every possible security incident. By using
              Billio, you acknowledge the inherent risks associated with
              transmitting and storing information online.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              10. Open Source
            </h2>

            <p>
              Billio is an open-source project. The source code is publicly
              available for transparency and educational purposes.
            </p>

            <p className="mt-4">
              The availability of the source code does not mean that the Billio
              name, branding, logo, or other protected intellectual property may
              be reused for another commercial service.
            </p>

            <p className="mt-4">
              Anyone interested in running their own instance of Billio may
              inspect the source code and create their own fork in accordance
              with the project's license and applicable intellectual property
              rights.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              11. Changes to This Privacy Policy
            </h2>

            <p>
              This Privacy Policy may be updated from time to time as Billio
              evolves or as changes are made to its infrastructure and
              functionality.
            </p>

            <p className="mt-4">
              Any updated version will be published on this page together with
              an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              12. Contact
            </h2>

            <p>
              If you have any questions about this Privacy Policy, the handling
              of your data, or the Billio project, you can contact the
              developer:
            </p>

            <div className="mt-4 space-y-2">
              <p>
                <strong>Developer:</strong> Ignacio Jiménez
              </p>

              <p>
                <strong>Website:</strong>{' '}
                <a
                  href="https://ignacio-jimenez.xyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:underline"
                >
                  ignacio-jimenez.xyz
                </a>
              </p>

              <p>
                <strong>LinkedIn:</strong>{' '}
                <a
                  href="https://www.linkedin.com/in/ignacio-jimenezjimenez/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:underline"
                >
                  LinkedIn profile
                </a>
              </p>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
