# Under Street — Product Requirements Doc

## Problem Statement
"Quiero una pagina ecommerce, para una tienda de indumentaria juvenil, estilo streetwear"

## User Choices (Feb 2026)
- Brand name: **Under Street**
- Visual style: Dark / urbano agresivo (negros, neones, grafiti)
- Payment: MercadoPago (mocked UI flow)
- Auth: Google Login via Emergent Auth
- Admin panel required to manage orders (paid / pending)

## Architecture
- Frontend: React + React Router + Tailwind + Shadcn primitives, Anton + Outfit fonts, neo-brutalist dark theme
- Backend: FastAPI + MongoDB (motor)
- Mock MercadoPago (client-side modal → POST /api/orders → POST /api/orders/:id/mock-pay)

## Core Implemented (2026-04-24)
- Product catalog with 12 seeded products (5 categories: hoodies, tees, pants, jackets, caps)
- Home page: hero, marquee, categories, featured drops, graffiti manifesto, full catalog grid
- Shop page with category filters, sort (newest/price_asc/price_desc), search param support
- Product detail page with size & quantity selector, add to cart
- Cart drawer with qty update / remove / subtotal persistence in localStorage
- Checkout page with shipping form + MercadoPago mock modal
- Order success page (supports pending + paid)
- Emergent Google OAuth login (session stored httpOnly cookie + sessions collection)
- My orders page (requires login)
- Admin dashboard: stats (total/pending/paid/shipped/revenue), orders table, status actions (mark paid / shipped / cancelled), filters

## Backlog / Next Items
- P1: Real MercadoPago integration (switch from mock when user provides Access Token)
- P1: Product admin (CRUD products, upload images, stock management)
- P2: Email notifications on order status change (Resend / SendGrid)
- P2: Product detail image gallery + related products
- P2: Coupons / discount codes
- P2: Wishlist / favorites
- P3: Reviews & ratings
- P3: Inventory history & low-stock alerts
