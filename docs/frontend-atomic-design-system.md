# Frontend Atomic Design System

Dokumen ini menjadi source of truth untuk UI frontend chatbot RAG dengan gaya Apple-inspired liquid glass.

## Hierarki Komponen

1. `atoms`: komponen dasar visual dan interaksi.
2. `molecules`: gabungan atom untuk satu fungsi kecil.
3. `organisms`: blok UI utama yang reusable.
4. `templates`: kerangka layout lintas halaman.
5. `pages`: wiring state, data, dan orchestration.

## Mapping Aktual

1. Atoms:
- `frontend/src/components/atoms/GlassSurface.tsx`
- `frontend/src/components/atoms/FocusRing.tsx`
- `frontend/src/components/atoms/GlassCard.tsx`
- `frontend/src/components/atoms/IconButton.tsx`
- `frontend/src/components/atoms/InlineProgress.tsx`

2. Molecules:
- `frontend/src/components/molecules/MessageMeta.tsx`
- `frontend/src/components/molecules/MessageCard.tsx`
- `frontend/src/components/molecules/ChatBubble.tsx`
- `frontend/src/components/molecules/ChatComposer.tsx`

3. Organisms:
- `frontend/src/components/organisms/AppHeader.tsx`
- `frontend/src/components/organisms/KnowledgeSidebar.tsx`
- `frontend/src/components/organisms/ChatThread.tsx`
- `frontend/src/components/planner/*`

4. Templates:
- `frontend/src/components/templates/ChatShellTemplate.tsx`

5. Pages:
- `frontend/src/pages/Chat/Index.tsx`

## Design Tokens

Token global disimpan di `frontend/src/styles/tokens.css`:

1. Surface: `--surface-*`
2. Text: `--text-*`
3. Accent: `--accent-*`
4. Blur, radius, shadow: `--glass-blur-*`, `--radius-*`, `--shadow-*`
5. Motion: `--motion-*`
6. Layering: `--z-*`

## UX Rules Wajib

1. Gunakan token, hindari hardcoded warna/blur/shadow baru.
2. Semua aksi utama mobile minimal area sentuh 44px.
3. Focus ring harus terlihat untuk keyboard users.
4. Hormati `prefers-reduced-motion`.
5. Komponen planner wajib mempertahankan microcopy formal Bahasa Indonesia.

## Development Guardrail

1. Jika membuat komponen baru, tentukan level atomic sebelum coding.
2. Layout baru lintas halaman harus masuk `templates`, bukan langsung di page.
3. Logic data/network tetap di `pages` atau hooks, bukan di atoms/molecules.

## Feature Flag Frontend

1. `VITE_UI_LIQUID_GLASS_V2=1` untuk mengaktifkan mode liquid glass composer/layout.
2. Default tanpa env adalah `off` agar rollout bisa bertahap (staging -> canary -> full).
