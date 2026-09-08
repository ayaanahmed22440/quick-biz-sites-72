# WebLaunch Studio

WEBWARHEADS — MASTER SAAS PLATFORM BUILD SPECIFICATION

1. WHAT WE ARE BUILDING

Build WebWarheads, a modern SaaS platform designed to become the go-to place for small and local businesses to get online.

Core positioning

WebWarheads — The go-to place for small & local businesses to get a website.

The product is designed around one simple promise:

Get your business website live without paying thousands of dollars or dealing with a developer.

Our initial target market is small/local service businesses, beginning with cleaning companies.

This is not intended to be a disposable AI-generated prototype.

Build the foundation as a serious SaaS product that can eventually support thousands of businesses.

2. HOMEPAGE — CONVERSION IS A PRIORITY

The homepage must be highly conversion-focused.

Do not make it a generic SaaS landing page that talks vaguely about "transforming your digital presence."

The visitor should immediately understand:

What WebWarheads is

Who it is for

How much it costs

Why it is better than hiring a traditional web designer

How quickly they can get online

What they get

How to get started

Hero direction

The hero should communicate a direct message around:

Get your website live for pennies. Stop paying $1,500+ for a website.

This is a directional messaging concept. Improve the wording professionally while preserving the aggressive value proposition.

The primary CTA should be extremely obvious:

Get Your Website Live

Secondary CTA:

See How It Works

The homepage should feel confident, direct and commercially focused.

Do NOT make the hero vague.

Avoid generic phrases such as:

"Empowering businesses with next-generation digital solutions."

Instead communicate the actual product and value.

3. PRICING MODEL

WebWarheads will use three primary subscription tiers.

PLAN 1 — $37/month

Position this as the affordable entry-level website plan.

Includes:

Professional website

Website hosting

SSL

Connect your own domain

Responsive mobile design

Professional template

Website editor

Business information management

Services management

Images/logo management

Lead/contact form

Basic website management

Standard support

The customer does NOT need to understand hosting, servers or technical configuration.

PLAN 2 — $68/month

Position this as the Website + SEO plan.

Everything in the $37 plan PLUS:

Local SEO basics

Build a genuine basic local SEO offering around the customer's business.

This should include architecture for:

Local keyword targeting

Service + location keywords

Location/service-area targeting

SEO page titles

Meta descriptions

Heading structure

Image alt text

Internal linking

Sitemap

Robots.txt

Search-engine indexing configuration

Canonical URLs where appropriate

Structured data/schema where appropriate

LocalBusiness schema

Service schema where appropriate

NAP consistency

Basic technical SEO checks

Google indexing readiness

SEO-friendly URLs

Basic on-page optimization

The SEO system should use the customer's actual:

Business name

Services

City

Cities/service areas

Neighborhoods where relevant

Service keywords

Business description

Do not generate random keyword spam.

The goal is legitimate local SEO fundamentals, not fake promises of guaranteed rankings.

The dashboard should show customers the status of their SEO basics.

For example:

SEO Setup

✓ Business information
✓ Page titles
✓ Meta descriptions
✓ Sitemap
✓ Indexing configuration
✓ LocalBusiness schema
✓ Service keywords

This should feel like a real product feature, not a checklist that does nothing.

PLAN 3 — $97/month

Position this as the premium WebWarheads plan.

Everything in the $68 plan PLUS premium support and additional growth-oriented benefits.

Potential benefits include:

Priority support

Faster support response

Priority website assistance

Human website edits

Priority troubleshooting

Enhanced SEO assistance

More advanced website customization

Priority access to new features

Direct support channel where operationally supported

Founder-level access/communication where offered

Additional growth tools as they become available

IMPORTANT:

Do not falsely claim guaranteed response times, direct founder access, or services that have not actually been implemented.

Structure the platform so these are plan entitlements that WebWarheads can configure.

The exact operational SLA and founder-access terms can be finalized before launch.

4. PRICING PAGE

Create a highly polished pricing page.

Display:

$37

Website

$68

Website + SEO

$97

Growth / Premium

The pricing page should clearly show:

Monthly price

Included features

Differences between plans

Recommended plan

CTA

FAQ

No confusing technical language

The $68 plan should visually communicate that it is the best value for businesses that want to be found locally.

The $97 plan should feel meaningfully premium rather than simply being the same plan with a higher number.

5. BILLING — WHOP

WebWarheads will use Whop as the intended payment and subscription provider.

Build the billing architecture around Whop.

The system should be prepared for:

Checkout

Subscription creation

Subscription status

Successful payment

Failed payment

Cancellation

Renewal

Webhooks

Plan identification

Customer account synchronization

The WebWarheads application must know which plan a customer has purchased.

For example:

Customer
   ↓
Subscription
   ↓
Plan
   ↓
Entitlements


Do not hard-code permissions separately throughout the application.

Use a centralized entitlement/feature system.

Example:

plan = basic
seo = false
priority_support = false

plan = seo
seo = true
priority_support = false

plan = premium
seo = true
priority_support = true


This will allow plans and features to evolve later.

Do not expose secret Whop API keys in frontend code.

Do not fake successful payments.

If Whop credentials/API configuration are not available yet, create the integration architecture and clearly indicate what needs to be connected.

6. PLAN-BASED FEATURE ACCESS

This is a critical requirement.

The platform must automatically recognize what the customer has purchased.

For example:

$37 customer

Can access:

Website

Editor

Domain

Leads

Basic website functionality

Cannot access premium SEO features.

$68 customer

Automatically receives:

Everything in $37

SEO features

Local SEO configuration

SEO dashboard

$97 customer

Automatically receives:

Everything in $68

Premium support

Priority features

Premium assistance

The customer should never have to manually activate these features after purchasing.

If a customer upgrades:

New features become available automatically.

If a subscription changes:

Access should update automatically according to the new plan.

7. WEBSITE GENERATION — NO AI-GENERATED WEBSITES

This is one of the most important requirements.

DO NOT build an AI website generator.

Customer websites are generated using:

Business Data + Prebuilt Template + Customizations

AI may eventually assist with marketing/content, but the actual website layout must be based on controlled WebWarheads templates.

This ensures:

Consistency

Quality

Performance

Predictability

SEO control

Easy maintenance

Template switching

Scalability

8. TEMPLATE SYSTEM

WebWarheads will have professionally designed templates.

Initially:

Cleaning Template 01

Additional templates will be added later.

The architecture must support:

Multiple templates

Multiple niches

Template versions

Template previews

Template activation/deactivation

Template categories

Template-specific sections

Template usage tracking

Template switching

Potential future categories:

Cleaning

Roofing

Landscaping

Plumbing

Painting

HVAC

Construction

Home services

Other local businesses

9. TEMPLATE APPROVAL REQUIREMENT

IMPORTANT:

Do NOT automatically add new templates to the production template library.

Any newly generated/built template must first be presented for human approval.

The WebWarheads team must be able to:

Preview template

Review template

Edit template

Approve template

Reject template

Publish template

Only approved templates can become available to customers.

This prevents low-quality or inconsistent templates from reaching production.

10. CUSTOMER BRANDING

Every customer website must feel like their business, not like a copy of another WebWarheads customer.

Each business may have:

Different logo

Different primary color

Different secondary color

Different images

Different business name

Different typography settings where appropriate

Different content

Different services

Different service areas

The template provides the structure.

The customer's brand data provides the identity.

Example:

Template:
Cleaning Template 01

Customer A:
Blue branding
ABC Cleaning logo
Charlotte images

Customer B:
Green branding
Sparkle Clean logo
Dallas images


The same underlying template can therefore produce visually distinct websites.

Do NOT create a single universal color scheme across every customer website.

Do NOT use the WebWarheads logo on customer websites unless the product explicitly calls for WebWarheads branding.

11. WEBSITE ENGINE

The website engine should follow:

Business
+
Template
+
Brand Settings
+
Content
+
Customization
=
Published Website


Customer data must be separate from template structure.

This allows:

Template switching

Global template improvements

New templates

Different customer branding

Easier maintenance

Scalable hosting

Do not create a separate codebase/project for every customer.

12. WEBSITE EDITOR

Create a simple customer-facing website editor.

It should feel intuitive for a non-technical business owner.

Allow editing of:

Text

Images

Logo

Colors

Services

Contact information

Business information

Basic sections

CTA text

Business hours

Service areas

Do not create a complex freeform website builder.

Do not expose HTML/CSS/code controls to normal customers.

Preserve the professional template structure.

Include:

Save

and

Save & Publish

with clear draft/published states.

13. CUSTOMER DASHBOARD

Build a polished SaaS dashboard.

Primary navigation:

Dashboard

Website status

Website URL

Leads

SEO status depending on plan

Quick actions

Website

Edit

Preview

Publish

Template

Website settings

Business

Business information

Services

Hours

Service areas

Contact information

Media

Logo

Images

Gallery

SEO

Visible to $68 and $97 customers.

Include:

SEO overview

Keyword targets

Pages

SEO checklist

Indexing status

Sitemap status

Technical SEO

Local SEO information

For $37 customers, show a tasteful upgrade prompt explaining what the SEO plan provides.

Domains

Existing domain

Connect domain

Buy domain

Domain status

SSL status

Leads

All leads

New leads

Lead status

Lead details

Analytics

Visitors

Leads

Conversion information

Billing

Current plan

Subscription status

Upgrade/downgrade

Payment status

Support

Support tickets

Need Help

Settings

Account

Business

Notifications

Security

14. ADMIN DASHBOARD

Build a powerful internal WebWarheads administration system.

Overview

Display real platform data:

MRR

Active customers

New customers

Cancellations

Websites online

Leads

Support tickets

Failed payments

Plan distribution

Never invent production metrics.

Customers

Admins can:

Search

View

Edit

Preview

Manage website

Change template

View plan

View billing

View domains

View leads

View support

Suspend/reactivate where authorized

Websites

Manage:

Website

Customer

Template

Status

Domain

Published version

Created date

Updated date

Actions:

Preview

Publish

Unpublish

Suspend

Change template

Templates

Admins can:

Create

Preview

Edit

Duplicate

Submit for approval

Approve

Reject

Publish

Unpublish

Assign niche

View usage

Leads

Search

Filter

Customer

Date

Status

Export

Domains

Connected

Pending

DNS

SSL

Registration

Renewal

Errors

Billing

Customers

Plans

Subscriptions

Revenue

Failed payments

Cancellations

Upgrades

Downgrades

Support

Tickets

Assignment

Status

Internal notes

Customer information

Website information

15. SEO ENGINE

SEO is not simply a marketing page.

Build the foundation for actual technical and local SEO functionality.

For eligible plans, use business information to configure:

On-page SEO

Page title

Meta description

H1

H2 structure

Image alt text

Internal links

SEO-friendly URLs

Local SEO

Use:

Business name

Primary service

Secondary services

City

Service areas

Relevant locations

Create sensible combinations such as:

House Cleaning in Charlotte, NC

rather than stuffing dozens of keywords into pages.

Technical SEO

Support:

XML sitemap

Robots.txt

Canonicals

Structured data

LocalBusiness schema

Service schema

Open Graph metadata

Mobile responsiveness

Fast-loading pages

Indexing readiness

Do not promise rankings.

Do not promise guaranteed Google placement.

The product provides SEO fundamentals and optimization tools.

16. GOOGLE BUSINESS PROFILE

Prepare an integration system for Google Business Profile.

Customers should eventually be able to:

Connect Google account

Connect Google Business Profile

Retrieve business information

Display Google reviews

Use business information for local SEO

Eventually manage additional Google functionality

Do not fabricate Google reviews or business data.

If API credentials are not configured, show the integration as not connected rather than pretending it works.

17. LEAD GENERATION

Every customer website should have professional lead capture.

Potential fields:

Name

Phone

Email

Service

Message

Preferred date/time

Store leads securely and associate every lead with the correct business.

Customer dashboard:

New Lead

Admin dashboard:

Lead received for ABC Cleaning

Prepare the system for future:

CRM

SMS

Email automation

Lead qualification

Follow-ups

18. DOMAIN SYSTEM

Support:

Existing domains

Customer can connect a domain they already own.

Domains purchased through WebWarheads

Architect for registrar API integration.

Potential providers may include:

Cloudflare

OpenSRS

ResellerClub

The platform should eventually allow:

Search → Purchase → Connect → SSL → Website Live

Do not fake domain purchasing.

If the registrar integration isn't configured yet, show the appropriate "Coming Soon" or configuration state.

19. SUPPORT AS A PRODUCT FEATURE

Human support is an important WebWarheads differentiator.

Every customer should have a prominent:

Need Help?

button.

Examples:

"Can you change my homepage image?"

"I need help connecting my domain."

"Can you add another service?"

Create a proper support system.

Premium plans should support priority handling.

The admin team should be able to manage customer websites where authorized.

All administrative changes should eventually be auditable.

20. FUTURE SOCIAL MEDIA PRODUCT

Architect the product so social media management can be added later.

Potential features:

Facebook

Instagram

Google Business

Content calendar

AI-generated posts

Post approval

Scheduling

Publishing

Analytics

Potential workflow:

Business Information
↓
AI Content Generation
↓
WebWarheads Review
↓
Customer Approval
↓
Schedule
↓
Publish


Initially, do not implement autonomous AI posting.

Human review should come first.

Claude or another AI system may eventually be used behind the scenes for content generation.

21. FUTURE CRM / MARKETING

Prepare the architecture for:

CRM

Contacts

Leads

Pipeline

Follow-ups

Conversations

Marketing

Email

SMS

Booking

Automation

Reviews

SEO

Social media

GoHighLevel or another third-party system may eventually power parts of this functionality.

Do not tightly couple the core platform to GHL before the integration requirements have been finalized.

22. BRANDING RULES — TWO DISTINCT LEVELS

There are two different brands:

WebWarheads SaaS

This uses the official WebWarheads brand/logo/design system.

Customer websites

These use:

Customer logo

Customer business name

Customer colors

Customer images

Customer content

The customer websites should NOT all look identical.

Templates provide consistency in quality and structure, while customer branding creates individuality.

23. VISUAL DESIGN

The WebWarheads application should feel like a polished modern SaaS product.

Use the supplied WebWarheads logo as the brand source.

Create:

Professional typography

Consistent spacing

Strong hierarchy

Restrained colors

Professional navigation

Clean cards

Clear buttons

High-quality forms

Tables

Modals

Empty states

Loading states

Error states

Success states

Take general UX inspiration from mature products such as Hostinger, Google, Stripe and Linear.

Do not copy their designs.

24. ABSOLUTELY NO AI SLOP

This requirement applies to both the WebWarheads SaaS interface and customer websites.

Avoid:

Random purple gradients

Excessive glassmorphism

Giant headings

Generic AI illustrations

Floating blobs

Excessive rounded cards

Excessive shadows

Emoji-heavy interfaces

Decorative elements everywhere

Unnecessary animations

Generic stock-style layouts

Fake dashboard metrics

Fake testimonials

Fake integrations

Fake reviews

Fake customer logos

Placeholder content presented as real

Every element must have a purpose.

The final product should look like a real company spent serious time designing it.

25. RESPONSIVENESS

Everything must work on:

Desktop

Laptop

Tablet

Mobile

Customer websites must be fully responsive.

The editor and dashboard must also be usable on smaller screens.

26. DATABASE / DATA MODEL

Build a proper relational architecture around:

Users

Businesses

Memberships

Roles

Websites

Templates

Template versions

Website customizations

Media/assets

Domains

Leads

SEO settings

SEO targets

Integrations

Google connections

Reviews

Subscriptions

Plans

Entitlements

Support tickets

Notifications

Activity logs

Business data should not be hardcoded into templates.

27. MULTI-TENANCY

This is a critical architectural requirement.

One WebWarheads platform should support many customers.

Do not create separate applications for each customer.

Conceptually:

WEBWARHEADS
    ↓
Website Engine
    ↓
Business A → Site A
Business B → Site B
Business C → Site C
Business D → Site D


Every customer must have isolated data.

Implement proper authorization and Supabase Row Level Security.

28. HOSTING

For the initial product, use Lovable hosting where practical.

We intentionally want to avoid unnecessary infrastructure complexity during the initial launch.

However:

Do not architect the product as permanently dependent on Lovable.

The source code should remain portable.

Use GitHub for source control.

Keep persistent data in infrastructure we control, such as Supabase.

The application should be designed so that hosting can eventually migrate to another provider if scale, cost or technical requirements justify it.

Do not introduce unnecessary AWS/Kubernetes/DevOps complexity for V1.

29. AUTHENTICATION & SECURITY

Implement:

Authentication

Authorization

Customer/admin roles

Tenant isolation

Supabase Row Level Security

Secure API access

Input validation

Secure file uploads

Rate limiting considerations

Audit logs

Secure admin actions

Proper secrets management

Never rely solely on frontend authorization.

30. REAL FUNCTIONALITY

Do not build a fake prototype.

Avoid:

Fake buttons

Fake metrics

Fake integrations

Fake payment states

Fake Google reviews

Fake domain purchases

Fake SEO results

If an external integration isn't configured yet:

Build the UI and architecture for it and clearly mark the integration as pending/configuration required.

31. DEVELOPMENT PHILOSOPHY

The product will be built using AI-assisted development.

Lovable is the primary application builder.

The project should remain compatible with GitHub and standard web development practices.

The codebase should be:

Modular

Maintainable

Reusable

Scalable

Secure

Understandable

Portable

Avoid massive monolithic components.

Avoid unnecessary duplication.

Avoid hardcoded business information.

Avoid hardcoded customer-specific websites.

32. IMPORTANT — DO NOT FINALIZE NEW TEMPLATES WITHOUT APPROVAL

When creating future templates:

Build the template.

Preview it.

Present it to the WebWarheads team.

Wait for approval.

Only then make it available in the production template library.

The same principle applies to major customer-facing design changes.

33. INITIAL PRODUCT PRIORITIES

Build the platform progressively while keeping the complete architecture in mind.

Initial core:

WebWarheads branding

Authentication

Customer accounts

Admin accounts

Multi-tenant database

Customer onboarding

Business profiles

Cleaning niche

Cleaning Template 01

Template engine

Customer website rendering

Website editor

Save & Publish

Customer dashboard

Admin dashboard

Pricing plans

Plan entitlements

Whop billing architecture

Leads

Domains

SEO foundation

Support

Then progressively activate:

Google Business Profile

Reviews

Advanced SEO

Social media

AI content

CRM

Marketing automation

Additional niches/templates

34. THE CORE BUSINESS LOOP

Everything should ultimately support this loop:

Visitor
   ↓
WebWarheads Homepage
   ↓
Pricing
   ↓
Sign Up
   ↓
Choose Plan
   ↓
Whop Checkout
   ↓
Onboarding
   ↓
Business Information
   ↓
Choose Template
   ↓
Website Created
   ↓
Customize
   ↓
Save & Publish
   ↓
Connect/Buy Domain
   ↓
Website Live
   ↓
Leads
   ↓
SEO / Growth
   ↓
Upgrade


This is the core commercial journey.

35. PRODUCT PHILOSOPHY

WebWarheads should make website ownership feel simple.

The customer should think:

"I give WebWarheads my business information and it handles the complicated stuff."

They should not need to understand:

Hosting

Servers

DNS

SSL

HTML

CSS

SEO implementation

Website deployment

WebWarheads handles the complexity behind the scenes.

36. FINAL DESIGN STANDARD

Before considering any screen complete, ask:

Would a serious SaaS company ship this UI?

Would a local business owner trust this product?

Does it look intentionally designed rather than AI-generated?

Is the hierarchy clear?

Does every button actually do something?

Does the interface work on mobile?

Does the experience make the customer want to continue?

If the answer is no, improve it.

FIRST IMPLEMENTATION

Start by building the actual WebWarheads SaaS foundation, not merely a marketing mockup.

Begin with:

Branded WebWarheads application shell

Conversion-focused homepage

Pricing section with $37 / $68 / $97 plans

Authentication

Customer dashboard

Admin dashboard

Supabase architecture

Multi-tenant database foundation

Plan/entitlement system

Customer onboarding

Cleaning-business data model

Template architecture

Cleaning Template 01 foundation

Website rendering engine

Basic website editor

Save & Publish flow

Leads architecture

SEO architecture

Domain architecture

Whop billing architecture

Support architecture

Build this as the foundation of the actual WebWarheads company.

Do not create a shallow visual demo.

Do not use AI to randomly generate customer websites.

Do not add unapproved templates to production.

Do not produce AI-slop UI.

Prioritize product quality, usability, scalability, security, conversion and maintainability.

# PRODUCTION DEPLOYMENT

WebWarheads is hosted and served by Lovable. GitHub is the source of truth for the
code, and Lovable Cloud (Supabase) provides the database, authentication, storage
and server-side functions.

**Lovable (build) → GitHub `main` (version control) → Lovable hosting (live site)**

## 1. Hosting

- Publish from Lovable to make the current build live.
- Frontend changes go live when the project is published again.
- Backend changes (migrations, server functions) apply immediately.
- No separate Node host, process manager, port or reverse proxy is required.

## 2. Domain

- `webwarheads.com` and `www.webwarheads.com` are connected in
  Project settings → Domains.
- DNS: `A @ → 185.158.133.1`, `A www → 185.158.133.1`, plus the `_lovable`
  TXT verification records shown in the Domains screen.
- One domain is set as primary; the other redirects to it.
- SSL is issued automatically after verification.

## 3. Authentication

- Auth site URL: `https://webwarheads.com`
- Allowed redirect: `https://webwarheads.com/**` (plus the Lovable preview URL)
- Google sign-in must list the same origin and callback in Google Cloud.
- OAuth returns to the site root; the app then routes staff to `/admin` and
  customers to `/dashboard`.

## 4. Environment variables

- Backend URL/keys are provisioned automatically by Lovable Cloud.
- Additional server-only values (Whop keys, `APP_URL`) are stored as project
  secrets; see `.env.example` for the full list.
- Browser-visible values use the `VITE_` prefix; everything else is server-only
  and read inside server functions.

## 5. Portability

The project stays a standard TanStack Start app: npm, a single
`package-lock.json`, `npm run build` and `npm start`. Nothing depends on a
Lovable-only runtime, so the repository can be run elsewhere if ever needed.


This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/362e92ae-4e40-4d93-99ce-21db7c8eabfc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
