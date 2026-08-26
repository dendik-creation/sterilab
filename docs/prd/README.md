# SteriLab Website PRD

Dokumentasi PRD untuk laboratorium maya interaktif SteriLab berbasis website (Phaser 3 + React/Vite/TypeScript, Clean Architecture, local-first, PWA-ready, landscape-only). Direstrukturisasi dari proposal Lab Maya SteriLab (`docs/raw_proposal/`) untuk materi AG_APHP_5, mempertahankan alur pembelajaran kasus, simulasi aseptik, media kultur, limbah, evaluasi, refleksi, dan sertifikat.

Istilah baku (Screen, Stage, Analyst, Lead QC, Evidence Decision, Simulated Value) ada di [`../../CONTEXT.md`](../../CONTEXT.md). Keputusan yang menyimpang dari proposal sumber (platform, orientasi, arsitektur, alur Stage 4) dicatat sebagai ADR di [`../adr/`](../adr/).

## Isi paket

- `00-overview.md` - ringkasan produk, cakupan materi, peta dokumen.
- `01-learning-design.md` - model pembelajaran, langkah guru, asesmen, jadwal produksi.
- `02-product-requirements.md` - kebutuhan produk dan acceptance criteria.
- `03-information-architecture.md` - sitemap, layout, dan breakpoint landscape.
- `04-design-system.md` - design system, komponen, dan color palette.
- `05-content-and-storyboard.md` - naskah per layar: visual, narasi, SFX, interaksi.
- `06-learning-interactions.md` - mekanik tiap Stage, evidence branching, evaluasi.
- `07-technical-spec.md` - arsitektur Phaser+React/Vite, rute, dan data.
- `08-quality-assurance-and-roadmap.md` - QA, validasi, roadmap, dan risiko.

Keputusan utama: output final wajib website responsif landscape-only, bukan aplikasi native dan bukan screenshot desain. Lima Stage hands-on dirender di canvas Phaser dengan kontrol DOM paralel wajib; seluruh layar lain murni DOM (React).
