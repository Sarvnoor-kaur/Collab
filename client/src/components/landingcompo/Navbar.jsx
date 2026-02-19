import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe2, Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const navItems = [
    { id: "home", label: "Home", href: "#" },
    { id: "features", label: "Features", href: "#features" },
    { id: "about", label: "About", href: "#about" },
  ];

  return (
    <>
      {/* Desktop Navbar - Fixed Top */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="relative flex items-center justify-between rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 px-6 py-3 shadow-lg shadow-black/20">

            {/* Left - Logo */}
            <Link to="/" className="flex items-center gap-2 text-white">
              <Globe2 className="w-6 h-6 text-cyan-400" />
              <span className="text-xl font-bold">
                Collab<span className="text-cyan-400">Sphere</span>
              </span>
            </Link>

            {/* Center - Tubelight Navigation */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-800/50 rounded-full p-1 border border-slate-700/50">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setActiveTab(item.id)}
                  className="relative px-6 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                >
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="tubelight"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/50 shadow-lg shadow-cyan-500/25"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </a>
              ))}
            </div>

            {/* Right - Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar - Fixed Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-4 mb-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 shadow-lg shadow-black/40">
          <div className="flex items-center justify-around px-4 py-3">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-4 py-2 text-xs font-medium transition-colors ${activeTab === item.id ? "text-cyan-400" : "text-slate-400"
                  }`}
              >
                {activeTab === item.id && (
                  <motion.div
                    layoutId="mobile-tubelight"
                    className="absolute inset-0 bg-cyan-500/10 rounded-lg border border-cyan-500/30"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </a>
            ))}
            <button
              onClick={() => setOpen(!open)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-6"
          >
            <Link to="/" className="flex items-center gap-2 text-white mb-8">
              <Globe2 className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-bold">
                Collab<span className="text-cyan-400">Sphere</span>
              </span>
            </Link>
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="px-8 py-3 text-lg font-medium text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/25"
            >
              Register
            </Link>
          </motion.div>
        )}
      </nav>
    </>
  );
}
