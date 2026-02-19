# CollabSphere Authentication Pages

## 🎨 Overview

Modern dark-mode authentication pages with split-screen design:
- **Left**: Form with glassmorphism card
- **Right**: Spline 3D model with animated rings

## 📁 Files Created

### UI Components (shadcn/ui structure)
```
client/src/components/ui/
├── input.jsx       - Custom input with dark theme
├── button.jsx      - Button with variants (default, outline, ghost)
└── label.jsx       - Form label component
```

### Auth Components
```
client/src/components/auth/
└── AuthModel.jsx   - Spline 3D model wrapper
```

### Pages Updated
```
client/src/pages/
├── Register.js     - Registration page (updated)
└── Login.js        - Login page (updated)
```

---

## 🎯 Features

### Register Page
- ✅ Full Name field with User icon
- ✅ Email field with Mail icon
- ✅ Password field with Lock icon
- ✅ Confirm Password field with Lock icon
- ✅ Primary button: "Create Account"
- ✅ Secondary button: "Sign up with Google"
- ✅ Link to Login page
- ✅ Terms & Privacy links

### Login Page
- ✅ Email field with Mail icon
- ✅ Password field with Lock icon
- ✅ "Forgot password?" link
- ✅ Primary button: "Login"
- ✅ Secondary button: "Sign in with Google"
- ✅ Link to Register page

### Both Pages Include
- ✅ Dark glassmorphism card
- ✅ Framer Motion animations
- ✅ Error message display
- ✅ Loading states
- ✅ Form validation
- ✅ Spline 3D model (desktop only)
- ✅ Animated rotating rings
- ✅ Responsive design
- ✅ CollabSphere logo with link to home

---

## 🎨 Design System

### Colors
- **Background**: Gradient from slate-950 to slate-900
- **Card**: slate-900/50 with backdrop-blur
- **Border**: slate-800/50
- **Text**: White (headings), slate-400 (body)
- **Primary**: Cyan-500 to Blue-600 gradient
- **Error**: Red-500/10 background, red-500/50 border

### Components

#### Input
```jsx
<Input
  type="email"
  placeholder="you@example.com"
  className="pl-11" // For icon spacing
/>
```

#### Button Variants
```jsx
// Primary (default)
<Button>Create Account</Button>

// Outline
<Button variant="outline">Sign up with Google</Button>

// Ghost
<Button variant="ghost">Cancel</Button>
```

#### Label
```jsx
<Label htmlFor="email">Email Address</Label>
```

---

## 📱 Responsive Behavior

### Desktop (lg: 1024px+)
- Split screen: 50% form, 50% 3D model
- Form centered in left half
- Spline model visible on right

### Mobile (< 1024px)
- Full-width form
- 3D model hidden
- Centered layout

---

## 🎭 Animations

### Page Load
```jsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

### Error Messages
```jsx
initial={{ opacity: 0, y: -10 }}
animate={{ opacity: 1, y: 0 }}
```

### Rotating Rings
```jsx
// Clockwise
animate={{ rotate: 360 }}
transition={{ duration: 30, repeat: Infinity, ease: "linear" }}

// Counter-clockwise
animate={{ rotate: -360 }}
transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
```

---

## 🔧 Customization

### Change Spline Model
Update `AuthModel.jsx`:
```jsx
<Spline scene="YOUR_SPLINE_URL_HERE" />
```

### Modify Colors
Update button gradients in `button.jsx`:
```jsx
default: "bg-gradient-to-r from-cyan-500 to-blue-600"
// Change to:
default: "bg-gradient-to-r from-purple-500 to-pink-600"
```

### Add More Fields
```jsx
<div className="space-y-2">
  <Label htmlFor="phone">Phone Number</Label>
  <div className="relative">
    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
    <Input
      id="phone"
      name="phone"
      type="tel"
      placeholder="+1 (555) 000-0000"
      className="pl-11"
    />
  </div>
</div>
```

---

## 🚀 Usage

### Navigate to Pages
```jsx
// From Landing page
<Link to="/register">Get Started</Link>
<Link to="/login">Login</Link>

// Programmatically
navigate('/register');
navigate('/login');
```

### Form Submission
Both pages integrate with existing `AuthContext`:
```jsx
const { register, login, user, error } = useAuth();

// Register
const result = await register({ name, email, password });

// Login
const result = await login({ email, password });
```

---

## 🎯 Form Validation

### Register Page
- All fields required
- Password minimum 6 characters
- Passwords must match
- Email format validation (browser default)

### Login Page
- All fields required
- Email format validation (browser default)

### Error Display
```jsx
{(localError || error) && (
  <motion.div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
    {localError || error}
  </motion.div>
)}
```

---

## 🔐 Security Features

- Password fields use `type="password"`
- Form validation before submission
- Loading states prevent double submission
- Disabled inputs during submission
- HTTPS recommended for production

---

## 🎨 Visual Hierarchy

### Typography
- **H1**: 3xl, bold, white (page title)
- **Body**: Base, slate-400 (descriptions)
- **Labels**: sm, medium, slate-300
- **Links**: sm, cyan-400, hover cyan-300

### Spacing
- Card padding: 8 (32px)
- Form fields gap: 5 (20px)
- Section margins: 6-8 (24-32px)

### Shadows
- Card: shadow-2xl
- Button: shadow-lg shadow-cyan-500/25
- Hover: shadow-cyan-500/40

---

## 🐛 Troubleshooting

### Spline not loading
- Check internet connection
- Verify scene URL in `AuthModel.jsx`
- Check browser console for errors

### Icons not showing
- Ensure lucide-react is installed
- Check import statements

### Form not submitting
- Check AuthContext is properly set up
- Verify API endpoints are running
- Check browser console for errors

### Styling issues
- Ensure Tailwind CSS is configured
- Check all UI components are imported
- Verify class names are correct

---

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.22.0",
  "framer-motion": "^12.34.2",
  "@splinetool/react-spline": "^4.1.0",
  "lucide-react": "latest",
  "tailwindcss": "^4.2.0"
}
```

---

## 🎓 Best Practices

1. **Accessibility**: All inputs have labels and proper IDs
2. **UX**: Clear error messages and loading states
3. **Performance**: Spline hidden on mobile to reduce load
4. **Security**: Password fields properly masked
5. **Responsive**: Mobile-first approach
6. **Animations**: Subtle, not distracting
7. **Validation**: Client-side + server-side

---

## 🚀 Next Steps

1. Test registration flow
2. Test login flow
3. Implement Google OAuth
4. Add "Forgot Password" functionality
5. Add email verification
6. Test on mobile devices
7. Add loading skeletons
8. Implement remember me checkbox

---

Built with ❤️ for CollabSphere
