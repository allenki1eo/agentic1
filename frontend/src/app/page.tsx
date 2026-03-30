"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import {
  Moon, Sun, Sparkles, Table, FileText, Presentation,
  Zap, Shield, Clock, ChevronRight, ArrowRight,
  CheckCircle2, Star, Users, TrendingUp, Bot, FileSearch, Edit3,
} from "lucide-react";

/* ─────────────────── Nav ─────────────────── */
function Nav() {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">DocuAI</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "How it works", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/app"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all hover:shadow-md"
          >
            Get started free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────── Hero ─────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 px-6">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium">
          <Zap className="w-3.5 h-3.5" />
          Powered by multi-agent AI — Gemini, Llama & DeepSeek
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6">
          Professional documents{" "}
          <span className="relative">
            <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
              in seconds
            </span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 8" fill="none">
              <path d="M0 6 Q150 0 300 6" stroke="url(#u)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <defs>
                <linearGradient id="u" x1="0" y1="0" x2="300" y2="0">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h1>

        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Describe what you need in plain English. DocuAI&apos;s agent pipeline generates
          fully formatted Excel spreadsheets, Word reports, and PowerPoint decks —
          with real data, formulas, and content tailored to your request.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Start creating for free
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Watch demo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Social proof row */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
          {[
            { icon: <Users className="w-4 h-4" />, text: "10,000+ documents created" },
            { icon: <Star className="w-4 h-4 text-amber-400" />, text: "4.9 / 5 satisfaction" },
            { icon: <Shield className="w-4 h-4" />, text: "No sign-up required" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5">
              {item.icon}
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Features ─────────────────── */
const FEATURES = [
  {
    icon: <Table className="w-6 h-6 text-emerald-500" />,
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    title: "Smart Excel Spreadsheets",
    desc: "Generates real data, SUM/AVERAGE formulas, styled headers, and auto-width columns — all matching your exact request.",
  },
  {
    icon: <FileText className="w-6 h-6 text-blue-500" />,
    bg: "bg-blue-50 dark:bg-blue-900/20",
    title: "Polished Word Documents",
    desc: "Writes full paragraphs, headings, bullet lists, and tables with professional typography and layout.",
  },
  {
    icon: <Presentation className="w-6 h-6 text-orange-500" />,
    bg: "bg-orange-50 dark:bg-orange-900/20",
    title: "PowerPoint Decks",
    desc: "Builds slide decks with title, content, and agenda slides containing concise, on-topic bullet points.",
  },
  {
    icon: <Bot className="w-6 h-6 text-violet-500" />,
    bg: "bg-violet-50 dark:bg-violet-900/20",
    title: "Multi-Agent AI Pipeline",
    desc: "Intent classification, structure design, data generation, and review agents work in concert for quality output.",
  },
  {
    icon: <Edit3 className="w-6 h-6 text-pink-500" />,
    bg: "bg-pink-50 dark:bg-pink-900/20",
    title: "Inline Document Editing",
    desc: "Generated a document but need changes? Click Edit, describe the modifications, and get an updated version instantly.",
  },
  {
    icon: <FileSearch className="w-6 h-6 text-cyan-500" />,
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    title: "Rich Preview & Download",
    desc: "Preview Word paragraphs, Excel grids, and PowerPoint slides directly in the browser before downloading.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-slate-50/70 dark:bg-slate-900/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
            Everything you need
          </p>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            One tool. Every document format.
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Stop switching between apps. DocuAI handles Excel, Word, and PowerPoint
            through a single conversational interface.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── How it works ─────────────────── */
const STEPS = [
  {
    num: "01",
    title: "Describe your document",
    desc: "Type what you need in plain English — as simple as 'Q4 sales report with regional breakdown' or 'investor pitch deck for SaaS startup'.",
  },
  {
    num: "02",
    title: "AI agents build it",
    desc: "Our pipeline classifies intent, designs structure, writes content, and compiles the file — all in one round trip to the model.",
  },
  {
    num: "03",
    title: "Preview, edit & download",
    desc: "Inspect the result inline, request refinements in natural language, and download the fully formatted file in your chosen format.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
            Simple workflow
          </p>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            From prompt to polished file
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <div key={s.num} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-300 to-transparent dark:from-blue-700 -translate-y-1/2 z-0" />
              )}
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg mb-5 shadow-lg shadow-blue-500/25">
                  {s.num}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Testimonials ─────────────────── */
const TESTIMONIALS = [
  {
    name: "Sarah K.",
    role: "Financial Analyst",
    avatar: "SK",
    stars: 5,
    text: "I used to spend 2 hours formatting quarterly reports. Now I describe it and get a polished Excel file in under a minute. Incredible.",
  },
  {
    name: "Marcus R.",
    role: "Startup Founder",
    avatar: "MR",
    stars: 5,
    text: "Generated our entire investor pitch deck in one prompt. The content was actually relevant and the formatting looked professional. Game changer.",
  },
  {
    name: "Priya M.",
    role: "Operations Manager",
    avatar: "PM",
    stars: 5,
    text: "The inline editing feature is underrated. I generated a report, asked it to add an executive summary, and got back exactly what I needed.",
  },
];

function Testimonials() {
  return (
    <section className="py-24 px-6 bg-slate-50/70 dark:bg-slate-900/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            Trusted by professionals
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Join thousands of teams who create documents with DocuAI every day.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Pricing ─────────────────── */
function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Pricing</p>
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
          Start free. Scale as you grow.
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-16 max-w-xl mx-auto">
          All core features are free to use with no credit card required.
        </p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left shadow-sm">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Starter</p>
            <p className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1">Free</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">No credit card needed</p>
            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300 mb-8">
              {["50 documents / month", "Excel, Word & PowerPoint", "Document preview & editing", "Download all formats"].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/app"
              className="block w-full text-center py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Get started
            </Link>
          </div>
          {/* Pro */}
          <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-left shadow-lg shadow-blue-500/25 relative overflow-hidden">
            <div className="absolute top-4 right-4 px-2.5 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">
              Most popular
            </div>
            <p className="text-sm font-semibold text-blue-200 mb-2">Pro</p>
            <p className="text-4xl font-extrabold text-white mb-1">$19<span className="text-xl font-medium text-blue-200">/mo</span></p>
            <p className="text-sm text-blue-200 mb-6">Billed monthly</p>
            <ul className="space-y-3 text-sm text-blue-100 mb-8">
              {["Unlimited documents", "Priority AI models", "API access", "Team collaboration", "Custom templates"].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/app"
              className="block w-full text-center py-3 text-sm font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded-xl transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── CTA Banner ─────────────────── */
function CTABanner() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-center shadow-2xl shadow-blue-600/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative">
          <TrendingUp className="w-10 h-10 text-blue-200 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to 10× your document workflow?
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
            Start creating professional Excel, Word, and PowerPoint files with a single sentence.
            No templates. No formatting. Just results.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-10 py-4 text-base font-semibold text-blue-700 bg-white hover:bg-blue-50 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-5 h-5" />
            Create your first document — it&apos;s free
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Footer ─────────────────── */
function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-6 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-base">DocuAI</span>
        </div>
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} DocuAI · AI-powered document generation
        </p>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Docs", "Status"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────── Page ─────────────────── */
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTABanner />
      <Footer />
    </main>
  );
}
