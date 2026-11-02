import React, { useState } from 'react';
import { Heart, Coffee, Gamepad2, Rocket, Copy, Check, ExternalLink } from "lucide-react";

export const AboutView: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyDonate = () => {
    navigator.clipboard.writeText('https://ko-fi.com/leuie');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-16">
      
      {/* Hero Creator Header */}
      <div className="relative rounded-3xl overflow-hidden border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-slate-100 to-white dark:from-rose-950/20 dark:via-[#131622] dark:to-poe-darkest p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-6 flex-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              Created with Passion by Leuie
            </div>

            <h1 className="text-3xl sm:text-5xl font-poe font-black text-slate-900 dark:text-slate-100 tracking-wide leading-tight">
              Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-500 to-rose-700 dark:from-rose-400 dark:via-amber-300 dark:to-rose-400">Leuie</span>. <br />
              Welcome to Exile SSF.
            </h1>

            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
              I built <strong className="text-amber-700 dark:text-amber-400">Exile SSF</strong> because I love games with deep, intricate systems and I love the purity and satisfaction of <strong>Solo Self Found & Private League</strong> progression.
            </p>
          </div>

          <div className="flex-shrink-0 flex justify-center md:justify-end">
            <img
              src="/logo.png"
              alt="Exile SSF Logo"
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-2xl shadow-xl border border-amber-500/40"
            />
          </div>
        </div>
      </div>

      {/* Story & Philosophy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Why I Created This Site */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/80/60 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100">
            Why I Created Exile SSF
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Too many Path of Exile resources assume you're playing in a trade league where every gearing obstacle is solved by whispering someone on a trade site. 
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            When you play SSF or in a private league with friends, you need a different mindset: deterministic recipes, vendor math, knowledge based crafting, and anti distraction roadmaps. I wanted to eliminate the 30 open browser tabs and build a unified, beautiful home for self reliant exiles.
          </p>
        </div>

        {/* The Future Vision */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/80/60 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Rocket className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-poe font-bold text-slate-900 dark:text-slate-100">
            The Multi Game Vision
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Exile SSF is just the beginning. As an avid gamer and builder, I plan to create a network of high utility, modern companion tools and knowledge bases for the games I play and love (including <strong>Path of Exile 2</strong>, ARPGs, and MMOs).
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            My goal is always simple: clean design, fast performance, respectful of your time, and built by a player, for players.
          </p>
        </div>

      </div>

      {/* Support & Buy Me a Coffee Section */}
      <div className="rounded-3xl border border-amber-500/40 bg-white dark:bg-gradient-to-br dark:from-poe-card dark:via-[#161a26] dark:to-poe-darkest p-8 sm:p-10 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              <Coffee className="w-4 h-4" />
              Community Support & Hosting
            </div>
            <h2 className="text-2xl sm:text-3xl font-poe font-bold text-slate-900 dark:text-slate-100">
              Support Leuie & Help Keep Exile SSF Ad Free
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          This site is 100% free, community driven, and contains zero intrusive ads. If you find these tools, the SSF Bible runbook, or the embedded portals helpful in your journeys, consider supporting server hosting costs or buying me a coffee!
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          {/* Buy Me a Coffee / Ko-fi button */}
          <a
            href="https://ko-fi.com/leuie"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <Coffee className="w-4 h-4" />
            <span>Buy Leuie a Coffee on Ko-fi</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Copy Link button */}
          <button
            onClick={handleCopyDonate}
            className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-poe-dark border border-slate-800 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Support Link'}</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 italic pt-2">
          ❤️ Every contribution goes directly towards domain hosting, server infrastructure, and development of future companion tools.
        </div>
      </div>

    </div>
  );
};
