import { motion } from "framer-motion";
import { UserPlus, Users, Zap } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create a Collab",
    description: "Sign up and create your first collaborative workspace in seconds.",
  },
  {
    icon: Users,
    number: "02",
    title: "Invite Your Team",
    description: "Add team members via email or shareable invite links.",
  },
  {
    icon: Zap,
    number: "03",
    title: "Chat, Meet & Collaborate",
    description: "Start messaging, schedule meetings, and work together seamlessly.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-24 px-6 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Get Started in{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              3 Simple Steps
            </span>
          </h2>
          <p className="text-slate-400 text-lg">
            From signup to collaboration in under a minute.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative text-center"
            >
              {/* Connecting Line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent" />
              )}

              {/* Step Number */}
              <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-xl" />
                <div className="relative w-24 h-24 rounded-full bg-slate-800 border-2 border-cyan-500/50 flex items-center justify-center">
                  <step.icon className="w-10 h-10 text-cyan-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {step.number}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
