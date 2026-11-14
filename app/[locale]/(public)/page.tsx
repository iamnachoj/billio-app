import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { publicAlternates } from '@/i18n/metadata';

export const metadata = { alternates: publicAlternates('') };

export default async function Home() {
  const [t, locale] = await Promise.all([
    getTranslations('PAGES.HOME'),
    getLocale(),
  ]);
  const currency = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  });
  return (
    <>
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-teal-50 to-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center lg:flex-row lg:justify-between lg:text-left">
            <div className="max-w-2xl">
              <span className="rounded-full bg-teal-100 px-4 py-1 text-sm font-medium text-teal-700">
                {t('BADGE')}
              </span>

              <h1 className="mt-6 text-5xl font-bold tracking-tight text-gray-900 lg:text-6xl">
                {t('HEADING')}{' '}
                <span className="text-teal-500">{t('HEADING_ACCENT')}</span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-gray-600">
                {t('INTRO')}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login?register=true"
                  className="rounded-xl bg-teal-500 px-6 py-3 text-center font-semibold text-white transition hover:bg-teal-600"
                >
                  {t('GET_STARTED')}
                </Link>

                <Link
                  href="/login"
                  className="rounded-xl border border-gray-300 px-6 py-3 text-center font-semibold text-gray-700 transition hover:border-teal-500 hover:text-teal-600"
                >
                  {t('SIGN_IN')}
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-8 text-sm text-gray-500">
                <span>✓ {t('UNLIMITED_GROUPS')}</span>
                <span>✓ {t('SMART_BALANCES')}</span>
                <span>✓ {t('FREE_FOREVER')}</span>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="mt-16 w-full max-w-lg lg:mt-0">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                <div className="rounded-2xl bg-gray-50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {t('EXAMPLE_TRIP')} 🇵🇹
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('EXAMPLE_PARTICIPANTS')}
                      </p>
                    </div>

                    <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700">
                      {t('ACTIVE')}
                    </span>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                      <div>
                        <p className="font-medium">🍽 {t('DINNER')}</p>
                        <p className="text-sm text-gray-500">
                          {t('PAID_BY', { name: 'Ignacio' })}
                        </p>
                      </div>

                      <p className="font-semibold">{currency.format(84)}</p>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                      <div>
                        <p className="font-medium">🚕 {t('TAXI')}</p>
                        <p className="text-sm text-gray-500">
                          {t('PAID_BY', { name: 'Marine' })}
                        </p>
                      </div>

                      <p className="font-semibold">{currency.format(32.5)}</p>
                    </div>

                    <div className="rounded-xl bg-teal-500 p-5 text-white">
                      <p className="text-sm opacity-90">
                        {t('CURRENT_BALANCE')}
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {t('YOU_OWE', { amount: currency.format(18.4) })}
                      </p>

                      <p className="mt-2 text-sm opacity-90">
                        {t('SETTLE_WITH', { name: 'Laura' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-200">
              {t('FEATURES_HEADING')}
            </h2>

            <p className="mt-4 text-lg text-gray-300">{t('FEATURES_INTRO')}</p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon="💳"
              title={t('TRACK_TITLE')}
              description={t('TRACK_DESCRIPTION')}
            />

            <FeatureCard
              icon="⚖️"
              title={t('BALANCES_TITLE')}
              description={t('BALANCES_DESCRIPTION')}
            />

            <FeatureCard
              icon="👥"
              title={t('INVITE_TITLE')}
              description={t('INVITE_DESCRIPTION')}
            />
          </div>
        </section>

        {/* Stats */}
        <section className="bg-gray-800 py-24 text-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 text-center md:grid-cols-3">
            <Stat value="∞" label={t('GROUPS')} />
            <Stat value="3" label={t('SPLIT_METHODS')} />
            <Stat value="100%" label={t('PRIVACY')} />
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-6 py-24">
          <div className="rounded-3xl bg-teal-500 p-12 text-center text-white shadow-xl">
            <h2 className="text-4xl font-bold">{t('CTA_HEADING')}</h2>

            <p className="mt-4 text-lg text-teal-50">{t('CTA_DESCRIPTION')}</p>

            <Link
              href="/login?register=true"
              className="mt-10 inline-block rounded-xl bg-white px-8 py-4 font-semibold text-teal-600 transition hover:scale-105"
            >
              {t('CREATE_ACCOUNT')}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-white">
        © {new Date().getFullYear()} Billio · {t('FOOTER')}
      </footer>
    </>
  );
}

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="text-4xl">{icon}</div>

      <h3 className="mt-6 text-xl font-semibold text-gray-900">{title}</h3>

      <p className="mt-3 leading-7 text-gray-600">{description}</p>
    </div>
  );
}

type StatProps = {
  value: string;
  label: string;
};

function Stat({ value, label }: StatProps) {
  return (
    <div>
      <div className="text-5xl font-bold text-teal-400">{value}</div>

      <div className="mt-3 text-lg text-gray-300">{label}</div>
    </div>
  );
}
