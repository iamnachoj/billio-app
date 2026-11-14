import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

type TermsAndConditionsPageProps = Readonly<{
  params: Promise<{ locale: (typeof routing.locales)[number] }>;
}>;

export async function generateMetadata({
  params,
}: TermsAndConditionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'LEGAL.TERMS_AND_CONDITIONS',
  });

  return {
    title: t('META_TITLE'),
    description: t('META_DESCRIPTION'),
    alternates: {
      languages: {
        en: '/en/terms-and-conditions',
        es: '/es/terms-and-conditions',
      },
    },
  };
}

export default async function TermsAndConditions({
  params,
}: TermsAndConditionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'LEGAL.TERMS_AND_CONDITIONS',
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-100 px-6 py-16">
      <article className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-xl sm:p-12">
        <header className="border-b border-gray-200 pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-800">
            {t('TITLE')}
          </h1>

          <p className="mt-3 text-sm text-gray-500">{t('LAST_UPDATED')}</p>
        </header>

        <div className="mt-10 space-y-10 text-gray-600 leading-7">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('ABOUT_TITLE')}
            </h2>

            <p className="mt-4">{t('ABOUT_P1')}</p>

            <p className="mt-4">{t('ABOUT_P2')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('AVAILABILITY_TITLE')}
            </h2>

            <p className="mt-4">{t('AVAILABILITY_P1')}</p>

            <p className="mt-4">{t('AVAILABILITY_P2')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('DATA_TITLE')}
            </h2>

            <p className="mt-4">{t('DATA_P1')}</p>

            <p className="mt-4">{t('DATA_P2')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('ACCEPTABLE_USE_TITLE')}
            </h2>

            <p className="mt-4">{t('ACCEPTABLE_USE_P1')}</p>

            <p className="mt-4">{t('ACCEPTABLE_USE_P2')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('PRIVACY_TITLE')}
            </h2>

            <p className="mt-4">{t('PRIVACY_P1')}</p>

            <p className="mt-4">{t('PRIVACY_P2')}</p>

            <p className="mt-4">{t('PRIVACY_P3')}</p>

            <p className="mt-4">
              {t('PRIVACY_P4_PREFIX')}
              <Link
                href="/privacy-policy"
                className="font-medium text-teal-600"
              >
                {' '}
                {t('PRIVACY_POLICY_LINK')}
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('ACCOUNT_DELETION_TITLE')}
            </h2>

            <p className="mt-4">{t('ACCOUNT_DELETION_P1')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('OPEN_SOURCE_TITLE')}
            </h2>

            <p className="mt-4">{t('OPEN_SOURCE_P1')}</p>

            <a
              href="https://github.com/iamnachoj/billio-app"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-medium text-teal-600 hover:text-teal-700 hover:underline"
            >
              github.com/iamnachoj/billio-app
            </a>

            <p className="mt-4">{t('OPEN_SOURCE_P2')}</p>

            <p className="mt-4">{t('OPEN_SOURCE_P3')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('BRAND_TITLE')}
            </h2>

            <p className="mt-4">{t('BRAND_P1')}</p>

            <p className="mt-4">{t('BRAND_P2')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('LIABILITY_TITLE')}
            </h2>

            <p className="mt-4">{t('LIABILITY_P1')}</p>

            <p className="mt-4">{t('LIABILITY_P2')}</p>

            <p className="mt-4">{t('LIABILITY_P3')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('CHANGES_TITLE')}
            </h2>

            <p className="mt-4">{t('CHANGES_P1')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('CONTACT_TITLE')}
            </h2>

            <p className="mt-4">{t('CONTACT_P1')}</p>
          </section>

          <section className="border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-500">{t('ACKNOWLEDGEMENT')}</p>
          </section>
        </div>
      </article>
    </main>
  );
}
