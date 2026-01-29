export default function HomePage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Better Auth + PayMongo
      </h1>
      <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">
        Feature-based billing with the Autumn pattern
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/pricing"
          className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          View Pricing
        </a>
        <a
          href="/billing"
          className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Billing Dashboard
        </a>
      </div>
    </div>
  );
}
