import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

type PrivacyPolicyPageProps = Readonly<{
  params: Promise<{ locale: (typeof routing.locales)[number] }>;
}>;

export async function generateMetadata({
  params,
}: PrivacyPolicyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'LEGAL.PRIVACY_POLICY',
  });

  return {
    title: t('META_TITLE'),
    description: t('META_DESCRIPTION'),
    alternates: {
      languages: {
        en: '/en/privacy-policy',
        es: '/es/privacy-policy',
      },
    },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: PrivacyPolicyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'LEGAL.PRIVACY_POLICY',
  });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm md:p-12">
        <header className="mb-10 border-b border-gray-200 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {t('TITLE')}
          </h1>

          <p className="mt-3 text-sm text-gray-500">{t('LAST_UPDATED')}</p>
        </header>

        <div className="space-y-10 text-gray-700 leading-7">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('INTRODUCTION_TITLE')}
            </h2>

            <p>{t('INTRODUCTION_P1')}</p>

            <p className="mt-4">{t('INTRODUCTION_P2')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('INFORMATION_TITLE')}
            </h2>

            <p>{t('INFORMATION_INTRO')}</p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>{t('INFORMATION_ITEM_NAME')}</li>
              <li>{t('INFORMATION_ITEM_EMAIL')}</li>
              <li>{t('INFORMATION_ITEM_CREDENTIALS')}</li>
              <li>{t('INFORMATION_ITEM_GROUPS')}</li>
              <li>{t('INFORMATION_ITEM_PARTICIPANTS')}</li>
              <li>{t('INFORMATION_ITEM_EXPENSES')}</li>
              <li>{t('INFORMATION_ITEM_OTHER')}</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('USE_TITLE')}
            </h2>

            <p>{t('USE_P1')}</p>

            <p className="mt-4">{t('USE_P2')}</p>

            <p className="mt-4">{t('USE_P3')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('PASSWORD_TITLE')}
            </h2>

            <p>{t('PASSWORD_P1')}</p>

            <p className="mt-4">{t('PASSWORD_P2')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('PROVIDERS_TITLE')}
            </h2>

            <p>{t('PROVIDERS_INTRO')}</p>

            <ul className="mt-4 list-disc space-y-3 pl-6">
              <li>
                <strong>Turso</strong> — {t('PROVIDER_TURSO')}
              </li>

              <li>
                <strong>Vercel</strong> — {t('PROVIDER_VERCEL')}
              </li>

              <li>
                <strong>Resend</strong> — {t('PROVIDER_RESEND')}
              </li>
            </ul>

            <p className="mt-4">{t('PROVIDERS_P2')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('EMAILS_TITLE')}
            </h2>

            <p>{t('EMAILS_P1')}</p>

            <p className="mt-4">{t('EMAILS_P2')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('RETENTION_TITLE')}
            </h2>

            <p>{t('RETENTION_P1')}</p>

            <p className="mt-4">{t('RETENTION_P2')}</p>

            <p className="mt-4">{t('RETENTION_P3')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('DELETION_TITLE')}
            </h2>

            <p>{t('DELETION_P1')}</p>

            <p className="mt-4">{t('DELETION_P2')}</p>

            <p className="mt-4">{t('DELETION_P3')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('DATA_PRIVACY_TITLE')}
            </h2>

            <p>{t('DATA_PRIVACY_P1')}</p>

            <p className="mt-4">{t('DATA_PRIVACY_P2')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('OPEN_SOURCE_TITLE')}
            </h2>

            <p>{t('OPEN_SOURCE_P1')}</p>

            <p className="mt-4">{t('OPEN_SOURCE_P2')}</p>

            <p className="mt-4">{t('OPEN_SOURCE_P3')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('CHANGES_TITLE')}
            </h2>

            <p>{t('CHANGES_P1')}</p>

            <p className="mt-4">{t('CHANGES_P2')}</p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {t('CONTACT_TITLE')}
            </h2>

            <p>{t('CONTACT_INTRO')}</p>

            <div className="mt-4 space-y-2">
              <p>
                <strong>{t('CONTACT_DEVELOPER_LABEL')}</strong> Ignacio Jiménez
              </p>

              <p>
                <strong>{t('CONTACT_WEBSITE_LABEL')}</strong>{' '}
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
                <strong>{t('CONTACT_LINKEDIN_LABEL')}</strong>{' '}
                <a
                  href="https://www.linkedin.com/in/ignacio-jimenezjimenez/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:underline"
                >
                  {t('CONTACT_LINKEDIN_LINK')}
                </a>
              </p>
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
