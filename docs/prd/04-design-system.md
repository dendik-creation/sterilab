# Design System

## Arah visual

Modern Quality Control laboratory: bersih, terstruktur, tepercaya, aman, tetapi tetap ramah siswa. Teal menjadi warna teknologi/aksi; amber untuk perhatian; merah/hijau untuk feedback dengan teks dan ikon. Token warna & tipografi di bawah dipakai konsisten baik di DOM (React) maupun render teks/UI dalam canvas Phaser tiap Stage.

## Typography

Font stack: Inter, Manrope, system sans-serif. Untuk Phaser, load font yang sama sebagai web font sebelum Stage dirender agar teks canvas cocok dengan token DOM.

| Token | Ukuran/line-height | Weight | Penggunaan |
|---|---|---:|---|
| display-xl | 48/1.08 | 800 | hero desktop |
| display-lg | 40/1.10 | 800 | hero section |
| heading-1 | 32/1.20 | 750 | page title |
| heading-2 | 24/1.25 | 700 | section |
| heading-3 | 20/1.30 | 700 | card title |
| body-lg | 18/1.60 | 400 | narasi |
| body | 16/1.55 | 400 | konten |
| body-sm | 14/1.45 | 400 | helper |
| caption | 12/1.35 | 600 | metadata |

## Spacing, shape, elevation

Base unit 4px: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px. Touch target minimum 44x44px (berlaku juga untuk hit-area objek canvas Phaser). Tombol utama 48px desktop dan 52px phone landscape. Radius kontrol 10px, kartu 18px, hero 24px, pill 999px. Border 1px border-subtle. Shadow kartu: 0 8px 24px rgba(15,42,58,.08).

## Komponen

- App shell: top bar berisi logo, judul, progress, help, sound; compact di phone landscape.
- Button: primary teal, secondary light surface/border, tertiary text-only, destructive untuk reset/exit.
- Mission card: nomor, judul, tujuan, durasi, status, ikon, action.
- Progress: persentase plus stage dots berlabel; jangan hanya bar warna.
- Instruction panel: langkah bernomor, safety note, caption/narration, satu action utama, dan kontrol DOM paralel untuk Stage (lihat `03-information-architecture.md`).
- Lab object card / canvas sprite: visual, nama, fungsi, safety note, selected state — versi DOM dan versi sprite Phaser harus konsisten secara visual.
- Feedback panel: status, ikon, penjelasan, next action.
- Data card: label/value, unit, status chip, interpretation expandable.
- Quiz card: counter, prompt, answer area, submit, feedback, retry/next.
- Modal/drawer: glossary, safety, zoom, reset, sertifikat; focus trap dan Escape.
- Rotate-prompt overlay: ikon putar perangkat, pesan singkat, full-screen, muncul otomatis saat portrait.

## Imagery, icon, motion

Gunakan satu rounded line-icon family sekitar 1.75px. Ilustrasi: APD, LAF, spirit/Bunsen, loop, Petri dish, tabung, alkohol 70%, autoklaf, bin limbah. Hindari visual kontaminasi yang mengganggu. Transisi 180-240ms, hover 120ms, progress 300ms; hormati prefers-reduced-motion baik di CSS maupun tween Phaser.

## Accessibility

Target WCAG 2.2 AA, visible focus, keyboard/touch equivalent untuk setiap interaksi canvas Phaser (lihat FR-08 di `02-product-requirements.md`), caption/transcript, live-region feedback, heading hierarchy, landmark bermakna, dan tidak memakai warna sebagai satu-satunya sinyal.

## Color — Brand

| Token | Hex | Role |
|---|---|---|
| brand-900 | #073B4C | deep lab blue |
| brand-700 | #0B6477 | dark teal |
| brand-600 | #0F7C86 | primary action |
| brand-500 | #16A6A1 | highlight/hover |
| brand-100 | #DDF5F2 | soft teal |
| brand-50 | #F1FBFA | light teal |

## Color — Neutrals

| Token | Hex | Role |
|---|---|---|
| ink-950 | #102A36 | primary text |
| ink-700 | #3C5661 | secondary text |
| ink-500 | #6E858D | metadata |
| border-subtle | #D7E5E8 | divider |
| surface-0 | #FFFFFF | cards |
| surface-50 | #F7FAFA | page background |
| surface-100 | #EDF4F4 | inset panel |
| surface-dark | #12313D | hero/footer |

## Color — Semantic

| Token | Hex | Role |
|---|---|---|
| success-700 | #16704A | correct/safe |
| success-100 | #DDF5E9 | correct surface |
| warning-700 | #8A5A00 | caution/review |
| warning-100 | #FFF1C7 | caution surface |
| danger-700 | #A62B32 | incorrect/unsafe |
| danger-100 | #FDE4E3 | error surface |
| info-700 | #205A91 | information |
| info-100 | #E3F0FC | information surface |

## Color usage rules

CTA: brand-600, hover brand-700, pressed brand-900. Body text ink-950. Page surface-50, cards surface-0. Locked Stage memakai neutral gray dan lock icon. Safe/unsafe memakai green/red hanya di Evidence Decision dan selalu disertai teks serta ikon. Hero gradient yang disarankan: linear-gradient(135deg,#073B4C 0%,#0F7C86 58%,#16A6A1 100%). Dark mode bukan scope MVP.
