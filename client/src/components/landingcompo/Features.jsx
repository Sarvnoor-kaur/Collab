import { motion } from "framer-motion";
import { MessageSquare, Video, FolderOpen, Share2, Shield } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Instant messaging with typing indicators, read receipts, and group conversations.",
  },
  {
    icon: Video,
    title: "Video Meetings",
    description: "WebRTC-powered video calls with screen sharing and recording capabilities.",
  },
  {
    icon: FolderOpen,
    title: "Collab Workspaces",
    description: "Shared spaces for teams to organize projects, files, and conversations.",
  },
  {
    icon: Share2,
    title: "File Sharing",
    description: "Seamlessly share documents, images, and files with your team in real-time.",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "Enterprise-grade security with JWT tokens and encrypted communications.",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 px-6 bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Collaborate
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Powerful features designed for modern teams working across the globe.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative p-6 rounded-2xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-300" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
