"use client";

import ChatInterface from "@/components/ChatInterface";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, Sparkles } from "lucide-react";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {/* Logo / brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                AI Office Suite
              </span>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Hero text */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              <span className="text-slate-900 dark:text-white">Create documents with </span>
              <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                AI agents
              </span>
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Describe what you need — Excel spreadsheets, Word reports, or PowerPoint decks —
              and our multi-agent AI builds it for you in seconds.
            </p>
          </div>
        </header>

        <ChatInterface />
      </div>
    </main>
  );
}
