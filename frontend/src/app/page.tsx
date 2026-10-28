import Notes from "./notes";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold">ITSCI Learn</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Next.js → Spring Boot (/api) → MySQL
      </p>
      <Notes />
    </main>
  );
}
