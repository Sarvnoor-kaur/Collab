# 🚀 Quick Auth Reference

## Pages

### Register
- **URL**: `/register`
- **Fields**: Name, Email, Password, Confirm Password
- **Buttons**: Create Account, Sign up with Google
- **Redirects to**: `/discover` on success

### Login
- **URL**: `/login`
- **Fields**: Email, Password
- **Buttons**: Login, Sign in with Google
- **Redirects to**: `/dashboard` on success

---

## UI Components

### Input
```jsx
import { Input } from '../components/ui/input';
<Input type="email" placeholder="Email" />
```

### Button
```jsx
import { Button } from '../components/ui/button';
<Button>Submit</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Skip</Button>
```

### Label
```jsx
import { Label } from '../components/ui/label';
<Label htmlFor="email">Email</Label>
```

---

## File Structure

```
client/src/
├── components/
│   ├── ui/
│   │   ├── input.jsx
│   │   ├── button.jsx
│   │   └── label.jsx
│   └── auth/
│       └── AuthModel.jsx
└── pages/
    ├── Register.js
    └── Login.js
```

---

## Key Features

✅ Dark mode
✅ Glassmorphism
✅ Spline 3D model
✅ Framer Motion animations
✅ Form validation
✅ Error handling
✅ Loading states
✅ Responsive design
✅ lucide-react icons
✅ shadcn/ui structure

---

## Customization

### Change Spline Model
`client/src/components/auth/AuthModel.jsx`
```jsx
<Spline scene="YOUR_URL" />
```

### Change Colors
`client/src/components/ui/button.jsx`
```jsx
from-cyan-500 to-blue-600
// Change to your colors
```

---

## Testing

1. Start dev server: `npm start`
2. Visit: http://localhost:3000/register
3. Visit: http://localhost:3000/login

---

## Dependencies

All already installed:
- react
- react-router-dom
- framer-motion
- @splinetool/react-spline
- lucide-react
- tailwindcss

---

Ready to go! 🎉
