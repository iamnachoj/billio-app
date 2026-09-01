import Link from 'next/link';

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 px-6 py-16">
      <article className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-xl sm:p-12">
        <header className="border-b border-gray-200 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">
            Terms and Conditions
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Last updated: September 1, 2026
          </p>
        </header>

        <div className="mt-10 space-y-10 text-gray-600 leading-7">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              1. About Billio
            </h2>

            <p className="mt-4">
              Billio is a free, open-source web application designed to help
              individuals and groups track shared expenses, manage
              contributions, and calculate balances between participants.
            </p>

            <p className="mt-4">
              Billio is currently operated as an independent personal project
              and is provided free of charge. It is not operated as a commercial
              financial service, accounting service, or banking product.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              2. Free Service and Availability
            </h2>

            <p className="mt-4">
              Billio is provided on a free-of-charge basis and is developed and
              maintained as an independent project. As a result, no guarantee is
              made regarding the continuous availability, performance,
              reliability, or long-term operation of the service.
            </p>

            <p className="mt-4">
              The service may be modified, suspended, discontinued, or
              temporarily unavailable at any time. Features may also be changed
              or removed without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              3. Data Persistence and Backups
            </h2>

            <p className="mt-4">
              Due to the nature and limited resources of this personal project,
              Billio does not guarantee the permanent preservation or
              availability of data stored through the service.
            </p>

            <p className="mt-4">
              Users should therefore not rely on Billio as the sole repository
              of financial records or other information that they consider
              important. No guarantee is made regarding backups, recovery of
              data, or restoration following technical failures, maintenance,
              security incidents, infrastructure changes, or discontinuation of
              the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              4. Acceptable Use
            </h2>

            <p className="mt-4">
              Users agree to use Billio lawfully and responsibly. The service
              must not be used for fraudulent, unlawful, abusive, or otherwise
              harmful activities.
            </p>

            <p className="mt-4">
              Users are responsible for the information they enter into the
              application and for ensuring that they have the necessary rights
              or permissions to provide such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              5. Privacy and Personal Data
            </h2>

            <p className="mt-4">
              Billio may process personal information necessary to operate the
              service, such as account information, group membership,
              participant information, and expense-related data.
            </p>

            <p className="mt-4">
              Personal data is not sold or commercially traded to third parties.
              Data is processed only for purposes related to providing,
              maintaining, securing, and improving the service, or where
              otherwise required by law.
            </p>

            <p className="mt-4">
              Appropriate technical and organisational measures are taken
              according to the nature and resources of the project. However, no
              internet-connected service can guarantee absolute security, and
              users acknowledge the inherent risks associated with transmitting
              and storing information online.
            </p>

            <p className="mt-4">
              For further information about the processing of personal data and
              the rights available to users, please refer to the
              <Link
                href="/privacy-policy"
                className="font-medium text-teal-600"
              >
                {' '}
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              6. Account Deletion
            </h2>

            <p className="mt-4">
              Users may request or initiate deletion of their account where this
              functionality is provided by the application. Account deletion may
              result in the removal or anonymisation of data associated with the
              account, subject to applicable legal obligations and technical
              limitations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              7. Open Source Software
            </h2>

            <p className="mt-4">
              The source code of Billio is publicly available as an open-source
              project and can be accessed at:
            </p>

            <a
              href="https://github.com/iamnachoj/billio-app"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-medium text-teal-600 hover:text-teal-700 hover:underline"
            >
              github.com/iamnachoj/billio-app
            </a>

            <p className="mt-4">
              Users and developers are welcome to inspect the source code and,
              where permitted by the applicable open-source licence, create
              their own versions or forks of the software.
            </p>

            <p className="mt-4">
              A separate deployment of the software may provide a more
              appropriate solution for organisations or individuals requiring
              greater control over infrastructure, data persistence, backups,
              availability, or security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              8. Billio Name and Brand
            </h2>

            <p className="mt-4">
              The availability of the Billio source code does not grant
              permission to use the Billio name, logo, trademarks, or other
              distinctive brand elements for commercial purposes or in a manner
              that suggests an official association with the original project.
            </p>

            <p className="mt-4">
              The Billio name and associated brand identity are reserved.
              Unauthorised commercial use, impersonation, or misleading use of
              the brand may result in appropriate legal action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              9. Limitation of Liability
            </h2>

            <p className="mt-4">
              To the maximum extent permitted by applicable law, Billio and its
              developer shall not be liable for indirect, incidental, or
              consequential losses arising from the use of, inability to use,
              modification of, or discontinuation of the service.
            </p>

            <p className="mt-4">
              This includes, where legally permitted, loss of data, interruption
              of service, or reliance on information generated by the
              application.
            </p>

            <p className="mt-4">
              Nothing in these Terms is intended to exclude or limit liability
              where such exclusion or limitation is not permitted by applicable
              law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              10. Changes to These Terms
            </h2>

            <p className="mt-4">
              These Terms may be updated from time to time to reflect changes to
              the service, applicable law, or the way Billio operates. Updated
              versions will be made available through the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              11. Contact
            </h2>

            <p className="mt-4">
              If you have questions regarding these Terms, the Billio project,
              or the processing of personal data, you may contact the project
              developer through the contact information made available with the
              service or through the project's GitHub repository.
            </p>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-500">
              By creating or using a Billio account, you acknowledge that you
              have read and understood these Terms and Conditions.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
