import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-4">better-auth-paymongo Example</h1>
      <p className="text-gray-600 mb-8">
        TanStack Start example with Bun SQLite database.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/pricing"
          className="block p-6 bg-white rounded-lg border hover:border-orange-500 transition"
        >
          <h2 className="text-xl font-semibold mb-2">Pricing Page →</h2>
          <p className="text-gray-600">View plans and subscribe</p>
        </Link>

        <Link
          to="/billing"
          className="block p-6 bg-white rounded-lg border hover:border-orange-500 transition"
        >
          <h2 className="text-xl font-semibold mb-2">Billing Dashboard →</h2>
          <p className="text-gray-600">Check usage and manage subscription</p>
        </Link>
      </div>

      <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>
            Copy <code className="bg-gray-200 px-1 rounded">.env.example</code>{" "}
            to <code className="bg-gray-200 px-1 rounded">.env</code>
          </li>
          <li>Add your PayMongo secret key</li>
          <li>
            Run <code className="bg-gray-200 px-1 rounded">bun install</code>
          </li>
          <li>
            Run <code className="bg-gray-200 px-1 rounded">bun run dev</code>
          </li>
        </ol>
      </div>
    </main>
  );
}
