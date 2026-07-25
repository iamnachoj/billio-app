import Link from 'next/link';

export default function Home() {
  return (
    <>
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-teal-50 to-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center lg:flex-row lg:justify-between lg:text-left">
            <div className="max-w-2xl">
              <span className="rounded-full bg-teal-100 px-4 py-1 text-sm font-medium text-teal-700">
                Shared expenses made simple
              </span>

              <h1 className="mt-6 text-5xl font-bold tracking-tight text-gray-900 lg:text-6xl">
                Stop arguing about{' '}
                <span className="text-teal-500">who owes what.</span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-gray-600">
                Billio helps friends, couples, roommates and travel groups track
                expenses, split bills fairly and settle debts with clarity.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login?register=true"
                  className="rounded-xl bg-teal-500 px-6 py-3 text-center font-semibold text-white transition hover:bg-teal-600"
                >
                  Get Started
                </Link>

                <Link
                  href="/login"
                  className="rounded-xl border border-gray-300 px-6 py-3 text-center font-semibold text-gray-700 transition hover:border-teal-500 hover:text-teal-600"
                >
                  Sign in
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-8 text-sm text-gray-500">
                <span>✓ Unlimited groups</span>
                <span>✓ Smart balances</span>
                <span>✓ Free forever</span>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="mt-16 w-full max-w-lg lg:mt-0">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                <div className="rounded-2xl bg-gray-50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Lisbon Trip 🇵🇹
                      </p>
                      <p className="text-sm text-gray-500">5 participants</p>
                    </div>

                    <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700">
                      Active
                    </span>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                      <div>
                        <p className="font-medium">🍽 Dinner</p>
                        <p className="text-sm text-gray-500">Paid by Ignacio</p>
                      </div>

                      <p className="font-semibold">€84.00</p>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                      <div>
                        <p className="font-medium">🚕 Taxi</p>
                        <p className="text-sm text-gray-500">Paid by Marine</p>
                      </div>

                      <p className="font-semibold">€32.50</p>
                    </div>

                    <div className="rounded-xl bg-teal-500 p-5 text-white">
                      <p className="text-sm opacity-90">Your current balance</p>

                      <p className="mt-2 text-3xl font-bold">You owe €18.40</p>

                      <p className="mt-2 text-sm opacity-90">
                        Settle with Laura
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
              Everything you need to manage shared expenses
            </h2>

            <p className="mt-4 text-lg text-gray-300">
              Designed for real life: trips, roommates, couples and everyday
              spending.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon="💳"
              title="Track every expense"
              description="Create expenses in seconds with categories, notes and flexible split methods."
            />

            <FeatureCard
              icon="⚖️"
              title="Automatic balances"
              description="Know instantly who owes whom and minimize the number of transfers."
            />

            <FeatureCard
              icon="👥"
              title="Invite anyone"
              description="Share groups with friends, even before they create an account."
            />
          </div>
        </section>

        {/* Stats */}
        <section className="bg-gray-800 py-24 text-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 text-center md:grid-cols-3">
            <Stat value="∞" label="Groups" />
            <Stat value="3" label="Split methods" />
            <Stat value="100%" label="Privacy focused" />
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-6 py-24">
          <div className="rounded-3xl bg-teal-500 p-12 text-center text-white shadow-xl">
            <h2 className="text-4xl font-bold">
              Ready to stop using spreadsheets?
            </h2>

            <p className="mt-4 text-lg text-teal-50">
              Organize your expenses, settle debts fairly and enjoy your trips
              instead of calculating them.
            </p>

            <Link
              href="/login?register=true"
              className="mt-10 inline-block rounded-xl bg-white px-8 py-4 font-semibold text-teal-600 transition hover:scale-105"
            >
              Create your free account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Billio · Built with Next.js
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
