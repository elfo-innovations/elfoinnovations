
# Web Portal CMS — Implementation Plan

Goal: Give the admin end-to-end control over the public ELFO INNOVATIONS website — content, images, sections, pricing, offers, banners, FAQs, reviews — without touching code. All public pages become data-driven.

I'll ship this in **four phases** so each phase is testable on its own. You approve, I build phase 1, we validate, then continue.

---

## Phase 1 — Foundation (DB + Media Library + Section Manager)

**Database migrations**
- Extend `website_sections`: `key` (hero/services/portfolio/pricing/offers/banners/testimonials/faq/about/cta/footer/navbar), `title`, `subtitle`, `sort_order`, `is_enabled`, `content jsonb` (flexible per-section fields), `draft_content jsonb`, `published_at`, `published_by`.
- New `hero_content` singleton row (heading, highlight, description, cta text/link, image_url, effects, trust items).
- New `nav_links` (label, href, sort_order, is_enabled).
- New `promo_banners` (position enum, title, description, image_url, cta_text, cta_link, start_at, end_at, is_active).
- New `about_content` singleton (title, description, mission, vision, image_url, stats jsonb, why_us jsonb).
- Extend `offers` with image_url, banner_image_url, background_image_url, cta_text, cta_link, discount fields, start/end, is_active.
- Extend `services`, `portfolio_projects`, `pricing_plans`, `testimonials`, `faqs` with `is_visible`, `sort_order`, image fields as needed (most already exist).
- `media_library` already exists — add `tags text[]`, `folder text`, `alt_text`.
- All tables: admin write via `has_role(auth.uid(),'admin')`; public read via narrow `anon` SELECT policies filtered by `is_enabled/is_visible/is_active` + date windows.

**Storage**
- New public bucket `website-media` for CMS images (hero, portfolio, offers, banners, about).

**Admin UI**
- New sidebar group **Web Portal** under `/admin/web-portal/*`:
  - Overview, Section Manager, Hero, Navbar, Services, Portfolio, Before & After, Pricing, Offers, Banners, About, FAQ, Reviews, Media Library, Section Builder, Preview, Publish.
- **Media Library** route: grid, upload (drag-drop), search, tag/folder filter, preview, delete, "select" mode reusable from any editor via a dialog picker.
- **Section Manager** route: list of all sections with toggle enable/disable + drag-to-reorder (dnd-kit).

## Phase 2 — Content editors

- **Hero editor**: form with live preview panel; image picker from Media Library.
- **Navbar editor**: reorder + add/remove/rename links.
- **Services / Portfolio / Pricing / FAQ / Testimonials / Offers / Banners / About** editors: CRUD tables + edit dialogs with image picker, visibility toggle, drag-to-reorder.
- Offers: date scheduler; auto-inactive when `end_at < now()` via computed `is_live` in a view.
- Testimonials: approve/reject action; only approved show publicly.

## Phase 3 — Public site becomes data-driven

Rewrite these components to read from Supabase (React Query, already wired):
- `Navbar` → `nav_links`
- `Hero` → `hero_content`
- `ServicesSection` → `services`
- `PortfolioSection` / `BeforeAfterShowcase` → `portfolio_projects`
- `PricingSection` → `pricing_plans`
- `TestimonialsSection` → `testimonials` (already)
- `FaqSection` → `faqs` (already)
- `AboutSection` → `about_content`
- `CtaBanner` → `promo_banners` (position=footer_cta)
- Homepage renders sections in `website_sections.sort_order`, skipping disabled ones.
- Announcement bar + hero promo banners pulled from `promo_banners` by position, filtered by active date window.

## Phase 4 — Draft/Publish + Preview + Section Builder

- **Draft/Publish model**: each editable row has `draft_*` + published columns (or a `content_versions` table keyed by section/id). Admin edits write to draft; **Publish Changes** page shows a diff/list of pending changes and copies draft → published + stamps `published_at`, `published_by`.
- **Preview** route: renders the public site using **draft** data via a `?preview=1` param; desktop/tablet/mobile frame switcher (iframe with fixed widths).
- **Section Builder**: visual drag-drop of homepage sections (dnd-kit) writing to `website_sections.sort_order`.
- **Overview** page: counts, last published, published-by, quick links.

---

## Technical notes

- Stack: TanStack Start + Supabase (already in place). React Query for reads, `createServerFn` with `requireSupabaseAuth` for admin writes that need role checks; direct client writes for anything scoped by `has_role` RLS.
- Drag-drop: `@dnd-kit/core` + `@dnd-kit/sortable`.
- Image picker: reusable `<MediaPickerDialog />` used across all editors.
- Realtime: Supabase realtime on `website_sections`, `promo_banners`, `offers` so live site updates without refresh after Publish.
- Grants: every new public table gets explicit `GRANT SELECT TO anon` (where public read is intended) and `GRANT ALL TO authenticated` + `service_role`; RLS locks writes to admin.

---

## Scope check before I start

This is roughly 25–35 new files and ~8 migrations. Two questions:

1. **Draft/publish**: do you want a strict draft→publish workflow (edits invisible until you click Publish), or **live edits** (changes appear immediately, no publish step)? Live is simpler and faster to build; draft/publish is safer.
2. **Start point**: should I build **Phase 1 (DB + Media Library + Section Manager)** first so you can see the foundation, then continue phases 2–4 in follow-ups? Or push straight through all 4 phases in one large build?
