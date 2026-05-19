import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-gray-600 mb-6">Page not found</p>
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-800 underline">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
