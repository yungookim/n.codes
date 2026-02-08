# Landing Page Analytics

## Overview

n.codes uses two analytics systems on public landing pages:
1. **Google Analytics 4 (GA4)** - For standard web analytics and user behavior tracking
2. **PostHog** - For product-focused event tracking and feature adoption

## Google Analytics 4

GA4 automatically tracks:
- **Page views** - When users visit any page
- **Scroll depth** - How far down the page users scroll
- **Click tracking** - Button and link interactions
- **Session duration** - How long users spend on pages
- **Traffic source** - Referrers, campaigns, organic search
- **Device & browser** - User device type, browser, OS
- **Demographics** - Location, language, user interests (with consent)

GA4 is configured with measurement ID: `G-2G927JQW7Y`

## Tracked Events (PostHog)

### All Pages
- **page_view** - Recorded when any page loads
  - `page_path` - URL path visited
  - `page_title` - Page title

### Homepage (`/`)
- **external_link_click** - When users click external links (GitHub, Twitter, etc.)
  - `url` - Target URL
  - `text` - Link text
- **internal_link_click** - When users click anchor links (navigation within page)
  - `anchor` - Anchor href
  - `text` - Link text

### Demo Page (`/demo/`)
- **demo_loaded** - When demo app finishes initializing
- **demo_build_clicked** - When user clicks "Build with AI" button
- **demo_example_selected** - When user selects a demo example
  - `example_text` - Example description
- **demo_walkthrough_skipped** - When user skips the guided tour

### Changelog Page (`/changelog/`)
- **page_view** - Standard page view tracking

## What We Don't Track

- User personal information (name, email, IP address is hashed)
- Content inside text areas or input fields
- Form submissions or sensitive data
- Browsing history outside n.codes

## Privacy

- **Anonymous by default** - PostHog's person profiles identify unique browsers, not individuals
- **No personally identifiable information** - We don't collect or track PII
- **Privacy-compliant** - Compliant with GDPR, CCPA, and other privacy regulations
- **Transparent** - This document explains what we track

## Why We Track

**GA4 helps us:**
- Understand overall website traffic and engagement
- Identify popular pages and conversion funnels
- Measure campaign effectiveness
- Track technical performance metrics

**PostHog helps us:**
- Understand which features are most interesting to visitors
- Identify drop-off points in the demo experience
- Measure specific feature adoption
- Optimize landing page content based on actual product usage

## Opting Out

Users can opt out using browser privacy settings:
- **Do Not Track (DNT)** header is respected by both GA4 and PostHog
- **Browser privacy mode / incognito** mode disables tracking
- **Browser extensions** like uBlock Origin can block tracking scripts
- **Google's opt-out browser extension** disables GA4: https://tools.google.com/dlpage/gaoptout

## Implementation Details

**Google Analytics 4:**
- Loaded asynchronously from `googletagmanager.com`
- Uses standard gtag.js library
- Automatically tracks page views and user interactions
- Non-blocking, does not affect page performance

**PostHog:**
- Loaded asynchronously from `us.i.posthog.com`
- Uses event capturing for custom event tracking
- Automatically batches events for efficiency
- Non-blocking, does not affect page performance

Both scripts are loaded in the `<head>` or before closing `</body>` tag and configured to load asynchronously.
