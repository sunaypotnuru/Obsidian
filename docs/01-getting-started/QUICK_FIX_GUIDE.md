# ⚡ Quick Fix Guide - Start Fixing Now!

**Target**: Fix 746 accessibility issues  
**Priority**: WCAG 2.2 Level AA compliance by May 11, 2026

---

## 🎯 Top 5 Most Common Issues

### 1. onClick Without Keyboard Support (531 issues) 🔴

**Find**:
```bash
grep -r "onClick" src/app/pages/ | wc -l
```

**Fix Pattern**:
```tsx
// ❌ BAD
<div onClick={() => handleClick()}>Click me</div>

// ✅ GOOD - Option 1 (Best)
<button onClick={() => handleClick()}>Click me</button>

// ✅ GOOD - Option 2
import { AccessibleButton } from '@/components/AccessibleButton';
<AccessibleButton onClick={() => handleClick()}>Click me</AccessibleButton>

// ✅ GOOD - Option 3 (when div is necessary)
import { AccessibleClickable } from '@/components/AccessibleClickable';
<AccessibleClickable onClick={() => handleClick()} ariaLabel="Click me">
    <div>Click me</div>
</AccessibleClickable>
```

---

### 2. Missing Input Labels (100+ issues) 🔴

**Find**:
```bash
grep -r "<input" src/ | grep -v "aria-label" | grep -v "id="
```

**Fix Pattern**:
```tsx
// ❌ BAD
<input type="text" placeholder="Name" />

// ✅ GOOD - Option 1 (Best)
<label htmlFor="name">Name</label>
<input id="name" type="text" />

// ✅ GOOD - Option 2
import { AccessibleFormField } from '@/components/AccessibleForm';
<AccessibleFormField label="Name" name="name" type="text" required />

// ✅ GOOD - Option 3
<input type="text" aria-label="Name" />
```

---

### 3. Missing Button Labels (80+ issues) 🔴

**Find**:
```bash
grep -r "<button" src/ | grep -v "aria-label" | grep "onClick"
```

**Fix Pattern**:
```tsx
// ❌ BAD
<button onClick={handleClose}>
    <X />
</button>

// ✅ GOOD - Option 1
<button onClick={handleClose} aria-label="Close">
    <X aria-hidden="true" />
</button>

// ✅ GOOD - Option 2 (Best for icon buttons)
import { AccessibleIconButton } from '@/components/AccessibleButton';
<AccessibleIconButton icon={<X />} label="Close" onClick={handleClose} />
```

---

### 4. Heading Hierarchy (50+ issues) 🟡

**Find**:
```bash
grep -r "<h[1-6]" src/ | sort
```

**Fix Pattern**:
```tsx
// ❌ BAD
<h1>Page Title</h1>
<h3>Section</h3>  {/* Skipped h2! */}

// ✅ GOOD
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

**Rules**:
- Only ONE h1 per page
- Don't skip levels (h1 → h2 → h3, not h1 → h3)
- Use CSS for styling, not heading levels

---

### 5. Missing Alt Text (10+ issues) 🟡

**Find**:
```bash
grep -r "<img" src/ | grep -v "alt="
```

**Fix Pattern**:
```tsx
// ❌ BAD
<img src="/photo.jpg" />

// ✅ GOOD - Meaningful image
<img src="/photo.jpg" alt="Dr. Smith examining patient" />

// ✅ GOOD - Decorative image
<img src="/decoration.jpg" alt="" role="presentation" />

// ✅ GOOD - Use component
import { AccessibleImage } from '@/components/AccessibleImage';
<AccessibleImage src="/photo.jpg" alt="Dr. Smith examining patient" />
```

---

## 🚀 Quick Start - Fix Your First 10 Issues

### Step 1: Pick a File (2 minutes)
```bash
# Find files with most issues
node accessibility-audit.js | grep "📄" | head -10
```

### Step 2: Open File (1 minute)
```bash
# Example: Fix DashboardPage.tsx
code src/app/pages/DashboardPage.tsx
```

### Step 3: Fix onClick Handlers (10 minutes)
```tsx
// Find all onClick in the file
// Ctrl+F: "onClick"

// Replace each one:
// Before:
<div onClick={() => navigate('/appointments')}>
    View Appointments
</div>

// After:
<button onClick={() => navigate('/appointments')}>
    View Appointments
</button>
```

### Step 4: Fix Missing Labels (5 minutes)
```tsx
// Find all inputs
// Ctrl+F: "<input"

// Add labels:
// Before:
<input type="email" placeholder="Email" />

// After:
<label htmlFor="email">Email</label>
<input id="email" type="email" placeholder="Email" />
```

### Step 5: Fix Icon Buttons (5 minutes)
```tsx
// Find icon buttons
// Ctrl+F: "<button"

// Add aria-label:
// Before:
<button onClick={handleDelete}>
    <Trash />
</button>

// After:
<button onClick={handleDelete} aria-label="Delete item">
    <Trash aria-hidden="true" />
</button>
```

### Step 6: Test (2 minutes)
```bash
# Run audit again
node accessibility-audit.js

# Check your file
# Should see fewer issues!
```

**Congratulations! You fixed 10+ issues in 25 minutes!** 🎉

---

## 📋 Daily Fix Targets

### Day 1 (Today)
- [ ] Fix 50 onClick handlers
- [ ] Fix 20 missing labels
- [ ] Fix 10 icon buttons
- **Target**: 80 issues fixed

### Day 2
- [ ] Fix 100 onClick handlers
- [ ] Fix 30 missing labels
- [ ] Fix 20 icon buttons
- **Target**: 150 issues fixed

### Day 3
- [ ] Fix 150 onClick handlers
- [ ] Fix 30 missing labels
- [ ] Fix 20 icon buttons
- **Target**: 200 issues fixed

### Day 4
- [ ] Fix remaining onClick handlers (231)
- [ ] Fix 20 missing labels
- [ ] Fix 20 icon buttons
- **Target**: 271 issues fixed

### Day 5
- [ ] Fix all remaining labels
- [ ] Fix all remaining icon buttons
- [ ] Fix heading hierarchy
- [ ] Fix alt text
- **Target**: All issues fixed!

---

## 🛠️ Useful Commands

### Find Issues
```bash
# Count onClick handlers
grep -r "onClick" src/app/pages/ | wc -l

# Find missing alt text
grep -r "<img" src/ | grep -v "alt=" | wc -l

# Find inputs without labels
grep -r "<input" src/ | grep -v "aria-label" | grep -v "id=" | wc -l

# Find icon buttons
grep -r "<button" src/ | grep -v "aria-label" | wc -l
```

### Run Audits
```bash
# Full audit
node accessibility-audit.js

# Check specific file
grep -n "onClick" src/app/pages/DashboardPage.tsx

# Check progress
node accessibility-audit.js | grep "Total Issues"
```

### Test Changes
```bash
# Start dev server
npm run dev

# Test keyboard navigation
# Tab through page, Enter/Space to activate

# Test with screen reader
# Windows: NVDA (free)
# Mac: VoiceOver (built-in)
```

---

## 💡 Pro Tips

### Tip 1: Use Find & Replace
```
Find: <div onClick=
Replace: <button onClick=

Find: </div>
Replace: </button>

(Review each change!)
```

### Tip 2: Import Components at Top
```tsx
import { AccessibleButton, AccessibleIconButton } from '@/components/AccessibleButton';
import { AccessibleFormField } from '@/components/AccessibleForm';
import { AccessibleImage } from '@/components/AccessibleImage';
```

### Tip 3: Fix Similar Issues Together
- Fix all onClick in one file
- Then fix all labels in same file
- Then fix all icon buttons
- More efficient than jumping around

### Tip 4: Test As You Go
- Fix 10 issues
- Test keyboard navigation
- Fix 10 more
- Repeat

### Tip 5: Use TypeScript
```tsx
// TypeScript will enforce alt text!
<AccessibleImage 
    src="/photo.jpg"
    alt="Description"  // Required by TypeScript!
/>
```

---

## ✅ Checklist for Each File

When fixing a file, check:

- [ ] All `<div onClick>` replaced with `<button>` or `AccessibleButton`
- [ ] All `<input>` have associated `<label>` or `aria-label`
- [ ] All icon buttons have `aria-label`
- [ ] All `<img>` have `alt` attribute
- [ ] Heading hierarchy is correct (h1 → h2 → h3)
- [ ] Colors use WCAG-compliant variables
- [ ] Test keyboard navigation (Tab, Enter, Space)
- [ ] Run audit to verify fixes

---

## 🎯 Success Metrics

Track your progress:

```bash
# Before
Total Issues: 746

# After Day 1
Total Issues: 666 (80 fixed!)

# After Day 2
Total Issues: 516 (230 fixed!)

# After Day 3
Total Issues: 316 (430 fixed!)

# After Day 4
Total Issues: 45 (701 fixed!)

# After Day 5
Total Issues: 0 (ALL FIXED!) 🎉
```

---

## 🚨 Common Mistakes to Avoid

### Mistake 1: Forgetting aria-hidden on icons
```tsx
// ❌ BAD
<button aria-label="Close">
    <X />  {/* Screen reader reads this too! */}
</button>

// ✅ GOOD
<button aria-label="Close">
    <X aria-hidden="true" />  {/* Hidden from screen readers */}
</button>
```

### Mistake 2: Empty aria-label
```tsx
// ❌ BAD
<button aria-label="">
    <X />
</button>

// ✅ GOOD
<button aria-label="Close dialog">
    <X aria-hidden="true" />
</button>
```

### Mistake 3: Duplicate IDs
```tsx
// ❌ BAD
<input id="email" />
<input id="email" />  {/* Duplicate! */}

// ✅ GOOD
<input id="email-1" />
<input id="email-2" />
```

### Mistake 4: Skipping keyboard testing
```
Always test with keyboard after fixing!
Tab → Enter → Space → Escape
```

---

## 📞 Need Help?

### Resources
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [Accessibility Fix Guide](./ACCESSIBILITY_FIX_GUIDE.md)
- [Component Documentation](./docs/03-features/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility tool
- [NVDA](https://www.nvaccess.org/) - Free screen reader

---

## 🎉 Let's Do This!

**You can fix 746 issues in 5 days!**

- Day 1: 80 issues
- Day 2: 150 issues
- Day 3: 200 issues
- Day 4: 271 issues
- Day 5: 45 issues

**Start now. Fix one issue. Then another. You got this!** 💪

---

**Last Updated**: April 23, 2026  
**Status**: Ready to Fix  
**Let's make Netra AI 100% accessible!** ♿

