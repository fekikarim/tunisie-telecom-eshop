import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="mt-20 bg-tt-900 text-tt-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <div className="inline-block rounded-2xl bg-white p-2.5">
            <Logo className="h-12 w-auto" />
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-tt-200/90">
            Phones, routers, fibre and internet packages, all in one place. Order online, pay on delivery or by card, and follow every order from your account.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white" to="/shop?category=smartphones">Smartphones</Link></li>
            <li><Link className="hover:text-white" to="/shop?category=routers">Routers &amp; Wi-Fi</Link></li>
            <li><Link className="hover:text-white" to="/shop?category=packages">Internet packages</Link></li>
            <li><Link className="hover:text-white" to="/shop?category=fiber">Fibre equipment</Link></li>
          </ul>
          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-white">Project</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white" to="/about">About the team</Link></li>
            <li><a className="hover:text-white" href="https://github.com/fekikarim" target="_blank" rel="noreferrer">Karim Feki</a></li>
            <li><a className="hover:text-white" href="https://github.com/nesrine-derouiche" target="_blank" rel="noreferrer">Nesrine Derouiche</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-sun" /> Avenue Habib Bourguiba, Tunis</li>
            <li className="flex gap-2.5"><Phone className="mt-0.5 size-4 shrink-0 text-sun" /> +216 71 000 000</li>
            <li className="flex gap-2.5"><Mail className="mt-0.5 size-4 shrink-0 text-sun" /> contact@telecom.tn</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-tt-200/80 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Tunisie Telecom. Demonstration project, not an official service.</p>
          <p>Payments are simulated. No real transactions are processed.</p>
        </div>
      </div>
    </footer>
  );
}
