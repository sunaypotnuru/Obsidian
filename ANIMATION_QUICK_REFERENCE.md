# 🎬 Animation System - Quick Reference Guide

## 🚀 Quick Start

### 1. Import Components
```typescript
// Foundation animations
import { FadeIn, SlideIn, ScrollReveal } from '@/animations';

// UI components
import {
  AnimatedButton,
  AnimatedInput,
  AnimatedModal,
  AnimatedTooltip,
} from '@/components/ui/animated';
```

### 2. Use in Your Component
```typescript
function MyComponent() {
  return (
    <FadeIn>
      <AnimatedButton>Click Me</AnimatedButton>
    </FadeIn>
  );
}
```

---

## 📦 Component Categories

### Foundation Animations
Use these to wrap content for entrance animations:

| Component | Use Case | Props |
|-----------|----------|-------|
| `FadeIn` | Fade in content | `direction`, `delay`, `duration` |
| `SlideIn` | Slide in content | `direction`, `delay`, `distance` |
| `ScaleIn` | Scale in content | `delay`, `duration` |
| `StaggerContainer` | Stagger children | `stagger`, `direction` |
| `ScrollReveal` | Animate on scroll | `direction`, `threshold` |

### Buttons & Forms
| Component | Use Case | Key Features |
|-----------|----------|--------------|
| `AnimatedButton` | Interactive buttons | Hover, tap, loading, ripple |
| `AnimatedInput` | Form inputs | Floating label, validation, error shake |
| `AnimatedCheckbox` | Checkboxes | Check animation with spring |
| `AnimatedSwitch` | Toggle switches | Smooth slide animation |

### Layout & Cards
| Component | Use Case | Key Features |
|-----------|----------|--------------|
| `AnimatedCard` | Content cards | Hover lift, shadow transition |
| `AnimatedTabs` | Tab navigation | Sliding indicator, content fade |

### Overlays & Dialogs
| Component | Use Case | Key Features |
|-----------|----------|--------------|
| `AnimatedModal` | Modal dialogs | Backdrop, focus trap, escape key |
| `AnimatedDrawer` | Side panels | Slide from any side, spring physics |
| `AnimatedTooltip` | Tooltips | Auto-positioning, delay |
| `AnimatedDropdown` | Dropdown menus | Keyboard nav, auto-position |

### Content
| Component | Use Case | Key Features |
|-----------|----------|--------------|
| `AnimatedAccordion` | Expandable sections | Height animation, keyboard nav |
| `AnimatedProgress` | Progress bars | Linear, circular, steps |

### Feedback
| Component | Use Case | Key Features |
|-----------|----------|--------------|
| `AnimatedToast` | Notifications | Auto-dismiss, ARIA live regions |
| `AnimatedSkeleton` | Loading states | Shimmer/pulse animation |

---

## 💡 Common Patterns

### Pattern 1: Page with Fade In
```typescript
import { FadeIn } from '@/animations';

function MyPage() {
  return (
    <FadeIn>
      <div className="container">
        <h1>Page Title</h1>
        <p>Content here</p>
      </div>
    </FadeIn>
  );
}
```

### Pattern 2: Staggered List
```typescript
import { StaggerContainer } from '@/animations';

function MyList() {
  return (
    <StaggerContainer stagger="normal" direction="up">
      {items.map(item => (
        <div key={item.id} className="item">
          {item.name}
        </div>
      ))}
    </StaggerContainer>
  );
}
```

### Pattern 3: Modal Dialog
```typescript
import { AnimatedModal, AnimatedButton } from '@/components/ui/animated';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatedButton onClick={() => setIsOpen(true)}>
        Open Modal
      </AnimatedButton>

      <AnimatedModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        footer={
          <>
            <AnimatedButton variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </AnimatedButton>
            <AnimatedButton onClick={handleConfirm}>
              Confirm
            </AnimatedButton>
          </>
        }
      >
        <p>Are you sure?</p>
      </AnimatedModal>
    </>
  );
}
```

### Pattern 4: Form with Validation
```typescript
import { AnimatedInput, AnimatedButton } from '@/components/ui/animated';

function MyForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.includes('@')) {
      setError('Invalid email');
    } else {
      setError('');
    }
  };

  return (
    <form>
      <AnimatedInput
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={validate}
        error={error}
        required
      />
      <AnimatedButton type="submit">Submit</AnimatedButton>
    </form>
  );
}
```

### Pattern 5: Toast Notifications
```typescript
import { ToastContainer, type Toast } from '@/components/ui/animated';

function MyApp() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    setToasts(prev => [...prev, {
      id: Date.now().toString(),
      type,
      title: 'Notification',
      description: 'This is a message',
    }]);
  };

  return (
    <>
      {/* Your app content */}
      
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        position="top-right"
      />
    </>
  );
}
```

### Pattern 6: Progress Indicator
```typescript
import { AnimatedProgress } from '@/components/ui/animated';

function MyUpload() {
  const [progress, setProgress] = useState(0);

  return (
    <div>
      <h3>Uploading...</h3>
      <AnimatedProgress value={progress} max={100} showLabel />
    </div>
  );
}
```

### Pattern 7: Accordion FAQ
```typescript
import { AnimatedAccordion, type AccordionItem } from '@/components/ui/animated';

function FAQ() {
  const items: AccordionItem[] = [
    {
      id: '1',
      title: 'What is this?',
      content: <p>This is an answer.</p>,
    },
    {
      id: '2',
      title: 'How does it work?',
      content: <p>It works like this.</p>,
    },
  ];

  return <AnimatedAccordion items={items} />;
}
```

### Pattern 8: Tooltip Help
```typescript
import { AnimatedTooltip } from '@/components/ui/animated';
import { HelpCircle } from 'lucide-react';

function MyField() {
  return (
    <div className="flex items-center gap-2">
      <label>Field Name</label>
      <AnimatedTooltip content="This field is required for verification">
        <HelpCircle className="w-4 h-4 text-gray-400" />
      </AnimatedTooltip>
    </div>
  );
}
```

---

## 🎨 Animation Tokens

### Durations
```typescript
import { animationTokens } from '@/animations/tokens';

animationTokens.duration.instant  // 100ms
animationTokens.duration.fast     // 200ms
animationTokens.duration.normal   // 300ms
animationTokens.duration.slow     // 500ms
animationTokens.duration.slower   // 800ms
```

### Easings
```typescript
animationTokens.easing.standard    // [0.4, 0.0, 0.2, 1]
animationTokens.easing.decelerate  // [0.0, 0.0, 0.2, 1]
animationTokens.easing.accelerate  // [0.4, 0.0, 1, 1]
animationTokens.easing.gentle      // [0.25, 0.1, 0.25, 1] - Healthcare-friendly
animationTokens.easing.sharp       // [0.4, 0.0, 0.6, 1]
```

### Springs
```typescript
animationTokens.spring.gentle  // { stiffness: 200, damping: 20 }
animationTokens.spring.bouncy  // { stiffness: 400, damping: 15 }
animationTokens.spring.stiff   // { stiffness: 600, damping: 30 }
```

---

## 🎯 Props Reference

### FadeIn
```typescript
<FadeIn
  direction="up" | "down" | "left" | "right" | "none"
  delay={0}
  duration={300}
  distance={20}
>
  {children}
</FadeIn>
```

### AnimatedButton
```typescript
<AnimatedButton
  variant="default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
  size="xs" | "sm" | "default" | "lg"
  loading={false}
  ripple={false}
  disabled={false}
  onClick={handleClick}
>
  Button Text
</AnimatedButton>
```

### AnimatedInput
```typescript
<AnimatedInput
  label="Field Label"
  type="text" | "email" | "password" | "number"
  value={value}
  onChange={handleChange}
  onBlur={handleBlur}
  error="Error message"
  helperText="Helper text"
  success={false}
  required={false}
  disabled={false}
/>
```

### AnimatedModal
```typescript
<AnimatedModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  description="Optional description"
  size="sm" | "md" | "lg" | "xl" | "full"
  closeOnClickOutside={true}
  showCloseButton={true}
  footer={<>Footer content</>}
>
  {children}
</AnimatedModal>
```

### AnimatedDrawer
```typescript
<AnimatedDrawer
  isOpen={isOpen}
  onClose={handleClose}
  side="left" | "right" | "top" | "bottom"
  title="Drawer Title"
  size="sm" | "md" | "lg" | "full"
  closeOnClickOutside={true}
  showCloseButton={true}
>
  {children}
</AnimatedDrawer>
```

### AnimatedTooltip
```typescript
<AnimatedTooltip
  content="Tooltip text"
  position="top" | "bottom" | "left" | "right"
  delay={200}
>
  <button>Hover me</button>
</AnimatedTooltip>
```

### AnimatedProgress
```typescript
<AnimatedProgress
  value={75}
  max={100}
  indeterminate={false}
  variant="primary" | "success" | "warning" | "danger"
  size="sm" | "md" | "lg"
  showLabel={false}
/>
```

---

## ♿ Accessibility

### Reduced Motion
All components automatically respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are simplified or removed */
}
```

### Keyboard Navigation
- **Modal/Drawer:** Escape to close, Tab for focus trap
- **Accordion:** Arrow keys, Home, End, Enter, Space
- **Dropdown:** Arrow keys, Enter, Escape
- **Tabs:** Arrow keys for navigation

### ARIA Attributes
All components include proper ARIA attributes:
- `role="dialog"`, `aria-modal="true"` for modals
- `role="progressbar"` for progress indicators
- `aria-expanded`, `aria-controls` for accordions
- `aria-live` for toast notifications

---

## 🎓 Best Practices

### DO ✅
- Use gentle, predictable animations
- Keep animations under 500ms
- Respect `prefers-reduced-motion`
- Provide clear visual feedback
- Test with keyboard navigation
- Test with screen readers

### DON'T ❌
- No parallax scrolling (vestibular issues)
- No auto-playing carousels
- No continuous looping animations
- No rapid flashing (seizure risk)
- No aggressive/bouncy animations
- No decorative animations that distract

---

## 🐛 Troubleshooting

### Animation not working?
1. Check if Motion is installed: `npm list motion`
2. Verify AnimationProvider is wrapping your app
3. Check browser console for errors
4. Ensure component is imported correctly

### Animation too slow/fast?
Use animation tokens or override duration:
```typescript
<FadeIn duration={200}> {/* Faster */}
```

### Need to disable animation?
Check user's reduced motion preference:
```typescript
import { useReducedMotion } from '@/animations';

const prefersReducedMotion = useReducedMotion();
```

---

## 📚 Resources

- **Demo Page:** `/animation-demo`
- **Documentation:** See `ANIMATION_PHASE*_COMPLETE.md` files
- **Research:** `ANIMATION_RESEARCH_FINDINGS.md`
- **Motion Docs:** https://motion.dev

---

**Quick Reference Version:** 1.0  
**Last Updated:** April 29, 2026  
**For:** Netra-Ai Healthcare Platform
