# Design Guidelines for Mahajan Garments E-commerce Website

## Design Approach
**Reference-Based Approach**: Drawing inspiration from H&M Kids and Zara Kids for their clean product displays, intuitive navigation, and family-friendly shopping experience. The design will emphasize visual product showcase while maintaining professional e-commerce functionality.

## Core Design Elements

### A. Color Palette
**Light Mode:**
- Primary: 0 69% 69% (warm coral #FF6B6B)
- Secondary: 174 70% 64% (mint green #4ECDC4) 
- Accent: 47 100% 71% (sunny yellow #FFE66D)
- Background: 0 0% 98% (soft white #FAFAFA)
- Text: 210 29% 24% (navy #2C3E50)
- Success: 145 63% 42% (trust green #27AE60)

**Dark Mode:**
- Primary: 0 69% 60% (dimmed coral)
- Secondary: 174 60% 55% (muted mint)
- Background: 210 25% 12% (dark navy)
- Surface: 210 20% 18% (lighter dark)
- Text: 0 0% 95% (off-white)

### B. Typography
- **Primary Font**: Poppins (headings, buttons, navigation)
- **Secondary Font**: Open Sans (body text, descriptions)
- **Sizes**: text-sm to text-4xl for hierarchy
- **Weights**: 400 (regular), 600 (semibold), 700 (bold)

### C. Layout System
**Spacing Units**: Consistent use of Tailwind units 2, 4, 6, 8, 12, 16
- Micro spacing: p-2, gap-2 (8px)
- Standard spacing: p-4, m-4, gap-4 (16px)
- Section spacing: p-8, mb-8 (32px)
- Large spacing: p-12, mt-16 (48px-64px)

### D. Component Library

**Navigation:**
- Sticky header with logo, age-based categories, search, cart icon
- Breadcrumb navigation on product pages
- Mobile hamburger menu with slide-out drawer

**Product Display:**
- Grid layout: 2 columns mobile, 3-4 desktop
- Product cards with hover effects and quick view
- Image aspect ratio 4:5 for consistency
- Color-coded age category tags

**Forms & Interactions:**
- Rounded corners (rounded-lg, rounded-xl)
- Soft shadows (shadow-sm, shadow-md)
- Primary buttons with coral background
- Outline buttons with transparent background and coral border

**Shopping Experience:**
- Floating cart sidebar
- Size selector with visual swatches
- Quantity selectors with +/- buttons
- Progress indicators for checkout

### E. Visual Treatment

**Product Focus:**
- Clean white/light backgrounds for product photography
- Consistent lighting and styling across all product images
- Hover states reveal additional product angles

**Playful Elements:**
- Subtle rounded corners throughout
- Gentle color transitions
- Age-appropriate iconography (toys, animals, stars)

**Trust Indicators:**
- Security badges near checkout
- Customer review stars and counts
- Clear return policy messaging

## Images Section

**Logo Placement**: The existing Mahajan Garments logo with "TINY THREADS, BIG MOMENTS" tagline should be prominently displayed in the header.

**Hero Section**: Medium-sized hero banner (not full viewport) showcasing seasonal collections with lifestyle photography of children wearing the clothing. Should include a subtle gradient overlay and call-to-action button.

**Product Images**: High-quality product photography with consistent white backgrounds, multiple angles per product, and lifestyle shots showing items being worn.

**Category Images**: Age-group category sections should feature representative lifestyle imagery showing children in that age range wearing appropriate clothing.

**Trust Elements**: Small icons for secure payment, fast delivery, and easy returns should be placed in the footer and checkout areas.

## Mobile-First Responsive Design

**Breakpoints:**
- Mobile: Single column product grid, simplified navigation
- Tablet: 2-3 column grid, expanded filters
- Desktop: 4 column grid, persistent sidebar filters

**Touch Targets**: Minimum 44px for all interactive elements, generous spacing between clickable items.

This design framework creates a trustworthy, engaging e-commerce experience that reflects the joy and care associated with children's clothing while maintaining professional functionality for parents shopping online.