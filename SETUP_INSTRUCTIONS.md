# CollabSphere Landing Page Setup

## Required Dependencies

Install lucide-react for icons:
```bash
cd client
npm install lucide-react
```

## About shadcn/ui (Optional)

This project currently uses Tailwind CSS directly. If you want to add shadcn/ui components in the future:

### Why shadcn/ui?
- Pre-built, accessible components
- Full customization control (components are copied to your project)
- Built on Radix UI primitives
- Seamless Tailwind integration

### How to Initialize shadcn/ui:
```bash
cd client
npx shadcn@latest init
```

During setup, configure:
- **Components path**: `src/components/ui` (CRITICAL)
- **Tailwind config**: Use existing
- **CSS variables**: Yes (for theming)

### Why `/components/ui` is Important:
- Keeps shadcn components separate from custom components
- Prevents naming conflicts
- Standard convention across projects
- Easy to identify which components are from shadcn vs custom
- Simplifies imports: `@/components/ui/button` vs `@/components/Button`

## Current Stack
- React 18
- Tailwind CSS 4.2
- Framer Motion 12
- Spline (3D models)
- lucide-react (icons)
