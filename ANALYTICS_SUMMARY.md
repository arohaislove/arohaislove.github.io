# Analytics Implementation Summary

## Overview

Privacy-respecting analytics have been implemented across all GitHub Pages projects using **Plausible Analytics** - a lightweight, GDPR-compliant analytics solution that doesn't use cookies or track personal data.

## Setup

### Analytics Provider: Plausible
- **Service**: https://plausible.io
- **Script Size**: < 1KB
- **Privacy**: No cookies, GDPR/CCPA compliant, doesn't collect personal data
- **Free Tier**: Available for open source projects
- **Domain**: arohaislove.github.io

### Implementation
1. **Shared Analytics Utility**: `/shared/analytics.js`
   - Auto-tracks page views
   - Auto-tracks clicks on elements with `data-track` attributes
   - Falls back to element text/ID if no data-track attribute
   - Tracks session duration automatically
   - Tracks device/browser info automatically

2. **Integration Pattern**:
   ```html
   <!-- In <head> section -->
   <script defer data-domain="arohaislove.github.io" src="https://plausible.io/js/script.js"></script>
   <script src="/shared/analytics.js"></script>

   <!-- Before </body> or in main script -->
   <script>
     if (window.Analytics) {
       Analytics.init();
     }
   </script>
   ```

## Tracked Interactions by Project

### Main Landing Page (index.html)
**Page**: `/`

**Tracked Interactions**:
- **Project Clicks**: Which projects users navigate to from the main page
  - `Project: NZ Policy Matcher` - Click to NZ Policy Matcher
  - `Project: NZ Election Venn` - Click to NZ Election Venn
  - `Project: Perspective Engine` - Click to Perspective Engine
  - `Project: Religion Venn` - Click to Religion Venn Diagram
  - `Project: PWA Widget` - Click to PWA Widget Demo
  - `Project: Chromesthesia` - Click to Chromesthesia

**Analytics Insights**:
- Most popular projects
- Entry points to individual tools
- User journey through portfolio

---

### The Perspective Engine
**Page**: `/perspective-engine/`

**Tracked Interactions**:
1. **Navigation**:
   - `Back to Projects` - Return to main page

2. **Age Adjustments** (Input sliders):
   - `Adjust Current Age` - User changes current age slider
   - `Adjust Goal Age` - User changes goal/life expectancy age slider

**Analytics Insights**:
- How often users interact with age sliders
- Engagement with the life visualization tool
- Session duration (how long users contemplate their life)

---

### Chromesthesia
**Page**: `/chromesthesia/`

**Tracked Interactions**:
1. **Navigation**:
   - `Back to Projects` - Return to main page

2. **Example Text Selection**:
   - `Example: MLK` - Load MLK "I Have a Dream" speech
   - `Example: JFK` - Load JFK Inaugural Address
   - `Example: Maya Angelou` - Load Maya Angelou poem
   - `Example: Dylan Thomas` - Load Dylan Thomas poem
   - `Example: Dickens` - Load Dickens passage

3. **Painting Actions**:
   - `Paint My Words` - Generate watercolor from text
   - `Download Painting` - Download generated artwork
   - `Clear Canvas` - Reset the canvas

**Analytics Insights**:
- Most popular example texts
- Conversion rate (views → paintings generated)
- Download rate (paintings → downloads)
- User engagement with different literary works

---

### Ekphrasis
**Page**: `/ekphrasis/`

**Tracked Interactions**:
1. **Image Upload**:
   - `Clear Image` - Remove uploaded image

2. **Poetry Style Selection**:
   - `Style: Free Verse` - Select free verse style
   - `Style: Haiku` - Select haiku style
   - `Style: Sonnet` - Select sonnet style
   - `Style: Song Lyrics` - Select song lyrics style
   - `Style: Quote` - Select quote style
   - `Style: Flash Prose` - Select flash prose style

3. **Generation Actions**:
   - `Generate Poem` - Create poem from image
   - `Copy Poem` - Copy generated poem to clipboard
   - `Regenerate Poem` - Generate new poem from same image

**Analytics Insights**:
- Most popular poetry styles
- Regeneration rate (how often users try multiple outputs)
- Copy rate (satisfaction indicator)
- Style preferences by user behavior

---

### NZ Policy Matcher 2026
**Page**: `/nz-policy-matcher/`

**Tracked Interactions**:
1. **Navigation**:
   - `Back to Projects` - Return to main page
   - `Explore Policy Overlaps` - Navigate to NZ Election Venn from results

2. **Quiz Flow**:
   - `Start Quiz` - Begin the policy matching quiz
   - `Answer: Strongly Agree` - User strongly agrees with policy
   - `Answer: Somewhat Agree` - User somewhat agrees
   - `Answer: Neutral` - User neutral on policy
   - `Answer: Somewhat Disagree` - User somewhat disagrees
   - `Answer: Strongly Disagree` - User strongly disagrees
   - `Previous Question` - Navigate back to previous question

3. **Results Actions**:
   - `Restart Quiz` - Take quiz again
   - `Explore Policy Overlaps` - View Venn diagram after results

**Analytics Insights**:
- Quiz completion rate
- Answer distribution (political leanings)
- Question navigation patterns (use of back button)
- Cross-project navigation (quiz → venn diagram)

---

### NZ 2026 Election Policy Venn
**Page**: `/nz-election-venn/`

**Tracked Interactions**:
1. **Navigation**:
   - `Back to Projects` - Return to main page

2. **Venn Diagram Interactions**:
   - `View Left Bloc Policies` - Click left circle (Labour + Greens)
   - `View Right Bloc Policies` - Click right circle (National + ACT + NZ First)
   - `Close Info Panel` - Close policy information panel

**Analytics Insights**:
- Which political blocs users are most interested in
- Engagement with policy details
- Panel interaction patterns

---

### Religion Venn Diagram
**Page**: `/religion-venn-diagram/`

**Tracked Interactions**:
1. **Navigation**:
   - `Back to Projects` - Return to main page

2. **Interactive Elements**:
   - Auto-tracked clicks on religion circles (via element detection)
   - Auto-tracked clicks on overlap areas

**Analytics Insights**:
- Which religions users explore
- Interest in shared principles vs. unique aspects
- Engagement patterns with comparative religion content

---

### PWA Widget Demo
**Page**: `/pwa-widget-demo/`

**Tracked Interactions**:
1. **Navigation**:
   - `Back to Projects` - Return to main page

2. **PWA Actions**:
   - Auto-tracked installation prompts
   - Auto-tracked widget interactions

**Analytics Insights**:
- PWA installation rate
- Widget feature adoption
- Mobile vs. desktop usage patterns

---

## Automatic Tracking

In addition to the explicit `data-track` events listed above, the analytics utility automatically tracks:

### 1. Page Views
- Every page visit is automatically logged
- URL path tracked
- Referrer information (respecting privacy)

### 2. Session Duration
Tracked in time buckets:
- `0-30s` - Very brief visit
- `30s-1min` - Quick browse
- `1-2min` - Standard engagement
- `2-3min` - Good engagement
- `3-5min` - High engagement
- `5min+` - Deep engagement

### 3. Device & Browser Info
Automatically collected by Plausible:
- Device type (Desktop, Mobile, Tablet)
- Browser (Chrome, Firefox, Safari, etc.)
- Operating System (Windows, macOS, Linux, iOS, Android)
- Screen size (categorized)
- Country (based on IP, without storing IP)

### 4. Fallback Tracking
For elements without `data-track` attributes, the system automatically tracks:
- Button clicks (using button text or ID)
- Link clicks (using link text or href)
- Form submissions (using form ID or name)
- Input changes (checkboxes, radios, selects)

## Privacy Features

### What We DON'T Track:
- ❌ No cookies
- ❌ No personal information
- ❌ No IP addresses stored
- ❌ No cross-site tracking
- ❌ No unique user IDs
- ❌ No text content entered by users
- ❌ No uploaded images

### What We DO Track:
- ✅ Page views (which pages are visited)
- ✅ Button/link clicks (which features are used)
- ✅ Session duration (how long users engage)
- ✅ Device type (mobile vs desktop optimization)
- ✅ Referrer info (where traffic comes from)
- ✅ Aggregate behavior patterns

### GDPR Compliance
- No cookie consent banner needed (no cookies used)
- Data stored in EU (if using Plausible Cloud)
- Respects "Do Not Track" browser settings
- No personal data collection
- Users cannot be individually identified

## Setup Instructions for Plausible Account

### Option 1: Plausible Cloud (Recommended for Simplicity)

1. **Sign up** at https://plausible.io
2. **Add your site**: `arohaislove.github.io`
3. **Choose plan**:
   - Free for open source projects (if you make your stats public)
   - Otherwise: €9/month for up to 10k monthly pageviews
4. **Verify domain**: The script tags are already in place
5. **View analytics**: Dashboard will populate as users visit

### Option 2: Self-Hosted Plausible

1. Deploy Plausible on your own infrastructure (requires Docker)
2. Update script URLs in all files from `plausible.io` to your domain
3. More control but requires server maintenance

### Option 3: Alternative - Umami (Self-Hosted, Free)

If you prefer a free, self-hosted solution:

1. Deploy Umami to Vercel/Netlify/Cloudflare (free tiers available)
2. Update the analytics script tags to point to your Umami instance
3. The `/shared/analytics.js` utility will still work (it's provider-agnostic for events)

## Viewing Analytics

Once Plausible is set up, you can view:

- **Real-time visitors**: Current users on site
- **Top pages**: Most visited projects
- **Top events**: Most clicked interactions
- **Traffic sources**: Where visitors come from
- **Devices**: Desktop vs mobile usage
- **Locations**: Which countries visitors are from
- **Goals**: Track specific conversion events

### Recommended Goals to Set Up in Plausible:

1. **Quiz Completion**: Track `Start Quiz` → `Restart Quiz` flow
2. **Art Generation**: Track `Paint My Words` and `Generate Poem` events
3. **Downloads**: Track `Download Painting` events
4. **Cross-Project Navigation**: Track clicks on project links

## Testing the Analytics

To verify analytics are working:

1. Visit any page on your site
2. Interact with buttons/links that have `data-track` attributes
3. Check browser console for `[Analytics]` log messages
4. Check Plausible dashboard (may take a few minutes to appear)

### Console Debug Messages:

When analytics are working, you'll see:
```
[Analytics] Analytics utility loaded - call Analytics.init() to start tracking
[Analytics] Tracking page view: /perspective-engine/
[Analytics] Tracking event: Click: Adjust Current Age {element: "input"}
```

## Files Modified

All projects now include analytics:

1. `/index.html` - Main landing page
2. `/perspective-engine/index.html` - Perspective Engine
3. `/chromesthesia/index.html` - Chromesthesia
4. `/ekphrasis/index.html` - Ekphrasis
5. `/nz-policy-matcher/index.html` + `script.js` - Policy Matcher
6. `/nz-election-venn/index.html` + `script.js` - Election Venn
7. `/religion-venn-diagram/index.html` + `script.js` - Religion Venn
8. `/pwa-widget-demo/index.html` + `script.js` - PWA Widget

**New file created**:
- `/shared/analytics.js` - Reusable analytics utility (23KB)

## Future Enhancements

Possible improvements for later:

1. **Custom Events**: Add more specific tracking for unique interactions
2. **Funnel Tracking**: Set up conversion funnels in Plausible (e.g., Landing → Project → Action → Download)
3. **A/B Testing**: Test different UI variations using event tracking
4. **Error Tracking**: Track JavaScript errors (would require privacy-conscious implementation)
5. **Performance Metrics**: Track page load times and user experience metrics
6. **Heatmaps**: Visualize where users click (requires additional tool, may impact privacy)

## Cost Estimate

### Plausible Cloud:
- **Open Source (Free)**: If you make your analytics public
- **Paid**: €9/month for up to 10k pageviews/month
  - €19/month for up to 100k pageviews/month

### Self-Hosted (Umami or Plausible):
- **Free**: Just hosting costs (can be $0 on Vercel/Netlify free tier)
- **Time**: Requires initial setup and occasional maintenance

## Summary

✅ **Complete**: Analytics implemented across all 7 projects + main page
✅ **Privacy-First**: No cookies, GDPR compliant, minimal data collection
✅ **Lightweight**: < 1KB script, minimal performance impact
✅ **Auto-Tracking**: Automatic detection of interactive elements
✅ **Comprehensive**: Page views, clicks, session duration, device info all tracked
✅ **Maintainable**: Centralized analytics utility, easy to extend

Your portfolio now has professional-grade analytics that respect user privacy while giving you valuable insights into how people interact with your projects!
