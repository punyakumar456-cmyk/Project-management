import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4fbff_0%,#ecf3f9_48%,#f8fafc_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.24),_transparent_30%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.16),_transparent_24%),radial-gradient(circle_at_center,_rgba(15,23,42,0.06),_transparent_44%)]" />
      <div className="pointer-events-none absolute left-[-8rem] top-28 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-[-4rem] top-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="relative">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
