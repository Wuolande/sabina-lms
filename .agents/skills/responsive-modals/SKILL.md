---
name: responsive-modals
description: Standardized guidelines, patterns, and component structures for developing flexible, fully responsive, accessible modals and dialogs across mobile, tablet, and desktop viewports in Sabina LMS.
---

# Universal Responsive Modal Guidelines & Architecture

This skill defines the strict design principles, layout strategies, keyboard accessibility, and state management rules for creating modals and dialogs in Sabina LMS.

## Core Rules & Invariants

1. **Zero Browser Native Popups**:
   - Never use `window.alert()`, `window.confirm()`, or `window.prompt()`.
   - All confirmations, alerts, action forms, and notifications must use the centralized `useModal()` hook and `<ModalProvider />` or the pre-built responsive modal components.

2. **Adaptive Responsive Layout (Mobile Drawer vs. Desktop Floating Card)**:
   - **On Mobile Viewports (< 640px / `sm`)**:
     - Modals MUST render as **Bottom Sheets / Drawers** sliding up from the bottom edge (`inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl sm:rounded-2xl`).
     - Include a visible swipe/drag pull indicator handle (`w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3`).
     - Buttons MUST stack vertically with full width (`w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end`), ensuring easy single-hand thumb tapping. Minimum tap target size is 44px (11 Tailwind units).
     - Auto-scrollable internal content (`overflow-y-auto max-h-[calc(85vh-120px)] overscroll-contain`).
   - **On Tablet & Desktop Viewports (>= 640px)**:
     - Modals MUST render as **Centered Floating Dialog Cards** (`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl w-[calc(100%-2rem)] rounded-2xl`).
     - Backdrop: Frosted glass blur overlay (`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity`).

3. **Accessibility & Keyboard Navigation**:
   - Trap focus inside the modal when opened.
   - Close on `Escape` key press.
   - Close on backdrop click (unless `preventBackdropClose` is set to `true`).
   - Body scroll locking (`document.body.style.overflow = 'hidden'`) while modal is active.
   - ARIA roles: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`, `aria-describedby="modal-desc"`.

4. **Brand Color Harmony**:
   - Primary accents: `#14209C` (`bg-[#14209C] hover:bg-[#0f1877] text-white`).
   - Secondary / Attention accents: `#F9C31C` (`bg-[#F9C31C] text-slate-900`).
   - Danger / Destructive actions: `bg-rose-600 hover:bg-rose-700 text-white`.
   - Neutral dismiss: `bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200`.

## Component Catalog & Usage Patterns

### 1. `useModal()` Programmatic API
```tsx
import { useModal } from '@/components/ui/modal-context';

export function ExampleComponent() {
  const { confirm, alert, prompt, openDrawer } = useModal();

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Tutor Application?',
      message: 'This will permanently reject and archive this application. This action cannot be undone.',
      confirmText: 'Yes, Reject Application',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (isConfirmed) {
      // Execute API call
    }
  };
}
```

### 2. Standard Responsive Modal Template (`<ResponsiveModal />`)
```tsx
import { ResponsiveModal } from '@/components/ui/responsive-modal';

<ResponsiveModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Tutor Profile"
  description="Update hourly rate, subjects, and verified credentials."
  size="lg" // 'sm' | 'md' | 'lg' | 'xl' | 'full'
>
  <form className="space-y-4">
    {/* Form contents */}
  </form>
</ResponsiveModal>
```

### 3. Responsive Side Drawer (`<ResponsiveDrawer />`)
For deep aggregation views (e.g. Tutor 360, Document Verification Viewer):
- Slides out from right on desktop (`sm:inset-y-0 sm:right-0 sm:w-full sm:max-w-2xl`).
- Slides up as bottom sheet on mobile (`inset-x-0 bottom-0 max-h-[92vh] rounded-t-2xl`).
