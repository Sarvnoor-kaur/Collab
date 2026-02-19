import * as React from "react"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variants = {
    default: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 focus:ring-cyan-500",
    outline: "border-2 border-slate-700 bg-transparent text-white hover:bg-slate-800/50 hover:border-cyan-500/50 focus:ring-slate-500",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800/50"
  }

  const sizes = {
    default: "h-12 px-6 py-3",
    sm: "h-9 px-4 text-sm",
    lg: "h-14 px-8 text-lg"
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
