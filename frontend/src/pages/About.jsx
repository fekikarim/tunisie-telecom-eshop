import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, Code2, ExternalLink, GraduationCap, Layers, Rocket, ShieldCheck, Users } from 'lucide-react';
import Logo from '../components/Logo.jsx';

const TEAM = [
  {
    name: 'Karim Feki',
    initials: 'KF',
    github: 'https://github.com/fekikarim',
    handle: 'fekikarim',
    focus: 'Full-stack development shared equally: React interface, REST API, database and testing',
  },
  {
    name: 'Nesrine Derouiche',
    initials: 'ND',
    github: 'https://github.com/nesrine-derouiche',
    handle: 'nesrine-derouiche',
    focus: 'Full-stack development shared equally: React interface, REST API, database and testing',
  },
];

const STACK = [
  { label: 'React 19', group: 'Frontend' },
  { label: 'Vite', group: 'Frontend' },
  { label: 'React Router', group: 'Frontend' },
  { label: 'Tailwind CSS', group: 'Frontend' },
  { label: 'Axios', group: 'Frontend' },
  { label: 'Node.js', group: 'Backend' },
  { label: 'Express 5', group: 'Backend' },
  { label: 'JWT', group: 'Backend' },
  { label: 'bcrypt', group: 'Backend' },
  { label: 'SQLite', group: 'Data' },
  { label: 'REST API', group: 'Data' },
  { label: 'Git', group: 'Tooling' },
];

const PILLARS = [
  { icon: GraduationCap, title: 'Learning by building', text: 'We chose a realistic project so every concept, from routing to transactions, is tied to a feature people actually use.' },
  { icon: Layers, title: 'Full stack, end to end', text: 'From the React interface to the Express API and the SQLite database, we followed each request through every layer.' },
  { icon: ShieldCheck, title: 'Good engineering habits', text: 'Server-side validation, hashed passwords, role-based access and transactional stock updates were built in from the start.' },
  { icon: Users, title: 'Working together', text: 'We reviewed each other’s code, split the work by layer and shared what we learned along the way.' },
];

export default function About() {
  return (
    <div className="fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-tt-700 text-white">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-40 left-10 size-96 rounded-full bg-white/5" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tt-100">
              <Rocket className="size-3.5 text-sun" /> About the project
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              A telecom store built to learn, and to get better at building.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-tt-100/90 sm:text-lg">
              This platform started as an internship project in July 2023. Karim Feki and Nesrine Derouiche worked on it together
              to learn each technology in the stack and to sharpen their development skills, one feature at a time.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/shop" className="btn bg-white text-tt-800 shadow-md hover:bg-tt-50">Explore the shop <ArrowRight className="size-4" /></Link>
              <a href="#team" className="btn border border-white/30 bg-white/5 text-white hover:bg-white/10">Meet the team</a>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <div className="flex aspect-square w-80 items-center justify-center rounded-3xl bg-white p-10 shadow-lift ring-8 ring-white/10">
              <Logo className="w-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-tt-600">Our story</p>
            <h2 className="section-title mt-2">From internship to a complete platform</h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-slate-600">
            <p>
              The goal was simple: build a professional online shop for a telecom operator, with the features a real customer and a real
              administrator would need. Customers browse products, manage a cart and place orders. Administrators manage the catalogue,
              stock and order lifecycle from a dashboard.
            </p>
            <p>
              Rather than stop at a visual mock-up, we built the whole system: a React interface, an Express REST API with JWT
              authentication, and a SQLite database. Each order is created in a transaction, so stock and orders can never disagree.
            </p>
            <p className="font-medium text-ink">
              This is a learning project and a demonstration. It is not an official service of Tunisie Telecom, and payments are simulated.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-tt-50 text-tt-600">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section id="team" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-tt-600">The team</p>
          <h2 className="section-title mt-2">Built by two developers</h2>
          <p className="mt-3 text-muted">Two developers, one project, and a shared goal: master every tool in the stack.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {TEAM.map((m) => (
            <article key={m.name} className="card flex flex-col items-center p-8 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-tt-500 to-tt-800 text-2xl font-extrabold text-white ring-4 ring-tt-100">
                {m.initials}
              </div>
              <h3 className="mt-5 text-xl font-bold text-ink">{m.name}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-tt-600">Co-developer · Internship 2023</p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{m.focus}</p>
              <a
                href={m.github}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary btn-sm mt-6"
              >
                <Code2 className="size-4" /> github.com/{m.handle} <ExternalLink className="size-3.5" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="card p-8 sm:p-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-tt-600">Technologies</p>
              <h2 className="section-title mt-2">What we learned and used</h2>
            </div>
            <Boxes className="hidden size-10 text-tt-200 sm:block" />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {STACK.map((t) => (
              <span key={t.label} className="inline-flex items-center gap-2 rounded-full bg-tt-50 px-4 py-2 text-sm font-semibold text-tt-800 ring-1 ring-inset ring-tt-100">
                {t.label}
                <span className="text-[11px] font-medium uppercase tracking-wide text-tt-500">{t.group}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-sun p-8 text-ink shadow-card sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-extrabold">Want to see the code?</h2>
            <p className="mt-1.5 text-sm text-ink/75">The project is open for review. Explore the repository and the API.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="https://github.com/fekikarim" target="_blank" rel="noreferrer" className="btn bg-ink text-white hover:bg-tt-950">Karim on GitHub</a>
            <a href="https://github.com/nesrine-derouiche" target="_blank" rel="noreferrer" className="btn bg-white text-ink hover:bg-white/80">Nesrine on GitHub</a>
          </div>
        </div>
      </section>
    </div>
  );
}
