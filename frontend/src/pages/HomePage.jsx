import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { useLanguage } from "../context/LanguageContext";

import PreferenceToggles from "../components/PreferenceToggles";
import heroMountains from "../assets/hero-mountains.jpg";

const SERVICES = [
  {
    icon: "📄",
    color: "bg-portal-primary",
    title: "e-Sifaris / Certificate Request",
    description: "Apply for various certificates online.",
    link: "/citizen/apply",
  },
  {
    icon: "💬",
    color: "bg-emerald-600",
    title: "Complaints & Feedback",
    description: "Submit your complaints and feedback.",
    link: "/citizen/complaints",
  },
  {
    icon: "💳",
    color: "bg-amber-600",
    title: "Tax Payment",
    description: "Pay your taxes and charges online.",
    link: "/citizen/tax",
  },
  {
    icon: "📢",
    color: "bg-slate-600",
    title: "Notices & Announcements",
    description: "Stay updated with latest notices.",
    link: "/notices",
  },
];

const VALUES = [
  {
    icon: "👥",
    iconBg: "bg-slate-200",
    title: "Citizen Friendly",
    description:
      "A digital platform to connect citizens with municipal services.",
  },
  {
    icon: "🛡️",
    iconBg: "bg-emerald-100",
    title: "Transparent Services",
    description: "Easy, transparent and accessible for everyone.",
  },
  {
    icon: "📊",
    iconBg: "bg-amber-100",
    title: "Efficient Management",
    description: "Streamlined operations for better governance.",
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-portal-bg text-portal-text">
      {/* Navbar */}
      <header className="border-b border-portal-panel-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-xl">🏛️</span>
            <span>{t("app.name")}</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-portal-muted">
            <a href="#home" className="text-portal-text">
              Home
            </a>

            <a href="#services" className="hover:text-portal-text">
              Services
            </a>

            <Link
              to="/notices"
              className="hover:text-portal-text"
            >
              Notices
            </Link>

            <a href="#about" className="hover:text-portal-text">
              About Us
            </a>

            <a href="#contact" className="hover:text-portal-text">
              Contact
            </a>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <PreferenceToggles />

            {/* Login Button */}
            <Link
              to="/login"
              className="bg-portal-primary hover:bg-portal-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        id="home"
        className="relative px-6 py-20 bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(11, 30, 61, 0.88), rgba(18, 41, 79, 0.82), rgba(28, 58, 99, 0.78)), url(${heroMountains})`,
        }}
      >
        <div className="max-w-6xl mx-auto relative">
          <h1 className="text-4xl md:text-5xl font-bold max-w-2xl leading-tight">
            Welcome back to {t("app.name")}
          </h1>

          <p className="text-portal-muted mt-4 max-w-lg">
            Access all municipal services online. Quick, easy and transparent.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl flex gap-2">
            <input
              type="text"
              placeholder="Search services..."
              className="flex-1 rounded-lg bg-[#0b1120]/70 border border-portal-panel-border px-4 py-3 text-portal-text placeholder-portal-muted focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />

            <button className="bg-portal-primary hover:bg-portal-primary-hover text-white font-medium px-6 rounded-lg transition-colors">
              SEARCH
            </button>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section
        id="services"
        className="max-w-6xl mx-auto px-6 py-16"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            Popular Services
          </h2>

          <Link
            to="/login"
            className="text-sm text-portal-primary hover:underline"
          >
            VIEW ALL →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {SERVICES.map((s) => (
            <Link
              key={s.title}
              to={user ? s.link : "/login"}
              className="bg-portal-panel border border-portal-panel-border rounded-xl p-5 hover:border-portal-primary/50 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center text-lg mb-4`}
              >
                {s.icon}
              </div>

              <p className="font-medium text-portal-text mb-1">
                {s.title}
              </p>

              <p className="text-xs text-portal-muted">
                {s.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Values */}
      <section
        id="about"
        className="bg-portal-panel/40 border-y border-portal-panel-border py-16"
      >
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xl font-semibold text-center mb-10">
            Digital Municipality, Smart Society
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-portal-panel border border-portal-panel-border rounded-xl p-8 text-center"
              >
                <div
                  className={`w-14 h-14 rounded-full ${v.iconBg} flex items-center justify-center text-2xl mx-auto mb-4`}
                >
                  {v.icon}
                </div>

                <p className="font-semibold text-portal-text mb-2">
                  {v.title}
                </p>

                <p className="text-sm text-portal-muted">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="border-t border-portal-panel-border"
      >
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-medium flex items-center gap-2">
              🏛️ Smart Municipality
            </p>

            <p className="text-xs text-portal-muted mt-1">
              © 2026 {t("app.name")}. All rights reserved.
            </p>
          </div>

          <div className="flex gap-6 text-xs text-portal-muted">
            <a
              href="#"
              className="hover:text-portal-text"
            >
              Privacy Policy
            </a>

            <a
              href="#"
              className="hover:text-portal-text"
            >
              Terms of Service
            </a>

            <a
              href="#"
              className="hover:text-portal-text"
            >
              FAQ
            </a>

            <a
              href="#"
              className="hover:text-portal-text"
            >
              Emergency Contacts
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}