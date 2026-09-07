# SteriLab

SteriLab is a landscape-only web laboratory for Grade X vocational students in the Agribusiness of Agricultural Product Processing program (APHP, Fase E). The Analyst investigates a suspected food-poisoning case, practices microbiology procedures, reviews simulated evidence, and makes an Evidence Decision.

The application is learning software, not a source of real laboratory operating values or food-safety advice. Any displayed CFU count, threshold, duration, or temperature is simulated data and needs approval from an APHP or microbiology expert before release.

## Peta isi

| Bagian | Isi | Tautan |
| --- | --- | --- |
| Produk | Tujuan, peran, dan cakupan pembelajaran | [Tentang](#tentang) |
| Alur | Urutan Screen dan lima Stage | [Alur pembelajaran](#alur-pembelajaran) |
| Status | Batas implementasi saat ini | [Status implementasi](#status-implementasi) |
| Arsitektur | SPA, React, Phaser, dan aset | [Arsitektur](#arsitektur) |
| Struktur | Peta direktori utama | [Struktur repository](#struktur-repository) |
| Menjalankan | Instalasi, pengembangan, build, dan pengujian | [Pengembangan lokal](#pengembangan-lokal) |
| Rilis | Optimasi aset dan deploy Vercel | [Build dan deployment](#build-dan-deployment) |
| Referensi | PRD, ADR, dan daftar kerja | [Dokumentasi](#dokumentasi) |

## Tentang

Analyst berperan sebagai analis mikrobiologi pangan. Pembelajaran memakai Problem Based Learning: kasus memberi konteks, Stage memberi latihan prosedural, lalu Evidence Decision meminta Analyst membaca bukti sebelum memilih keputusan.

Materi yang dicakup:

- teknik kerja aseptik dan K3 laboratorium;
- persiapan ruang kerja dan APD;
- pembuatan serta sterilisasi media kultur;
- inokulasi sederhana secara aseptik;
- dampak kontaminasi pada hasil kultur; dan
- pengelolaan limbah laboratorium.

Istilah yang dipakai di produk:

| Istilah | Makna |
| --- | --- |
| Screen | Halaman yang dapat dinavigasi, seperti Case atau Missions. |
| Stage | Satu dari lima aktivitas praktik. Jangan menyebutnya level atau scene. |
| Analyst | Peran peserta didik di dalam cerita. Narasi menggunakan kata `kamu`. |
| Lead QC | Pembimbing di dalam cerita yang memberi briefing. |
| Evidence Decision | Pilihan Produk Aman atau Produk Tidak Aman berdasarkan evidence. |
| Simulated Value | Nilai ilustratif untuk skenario, bukan standar laboratorium nyata. |

## Alur pembelajaran

```text
Splash dan Cover
  -> Case
  -> Briefing Lead QC
  -> Guide
  -> Missions
  -> Stage 1 sampai 5
  -> Evidence Decision
  -> Evaluation
  -> Reflection
  -> Completion
```

Lima Stage yang direncanakan:

| Stage | Fokus |
| --- | --- |
| Persiapan APD | Memilih dan mengenakan APD yang sesuai. |
| Area Kerja Aseptik | Menyiapkan area, alat, dan urutan kerja. |
| Pembuatan Media Kultur | Mengurutkan pembuatan hingga sterilisasi media. |
| Teknik Kerja Aseptik | Menjalankan enam prosedur linear. |
| Pengelolaan Limbah | Mengelompokkan limbah ke penanganan yang tepat. |

Stage Teknik Kerja Aseptik memakai enam prosedur: cuci tangan, memakai APD, membersihkan meja kerja, menyalakan Bunsen, memijarkan jarum ose, serta mengambil dan menginokulasi kultur. Urutan internal seperti memanaskan lalu mendinginkan jarum ose tetap divalidasi di dalam prosedur terkait.

## Status implementasi

Repository ini masih dalam pengembangan. Splash dan Cover, Case, Missions, serta Stage Teknik Kerja Aseptik menjadi bagian yang telah dibangun paling jauh. Source tree saat ini memuat enam komponen prosedur untuk Stage tersebut.

Briefing, Guide, Evidence, Evaluation, Reflection, Completion, dan empat Stage lain masih membutuhkan penyelesaian sesuai daftar kerja. [`TASKS.md`](TASKS.md) adalah catatan implementasi dan verifikasi yang harus dipakai saat memilih pekerjaan berikutnya.

## Arsitektur

- Aplikasi adalah SPA pada satu path, `/`. Navigasi memakai stack in-memory di `lab/src/app/navigation.tsx`, bukan `react-router` dan bukan URL per Screen.
- React, Vite, dan TypeScript menangani shell aplikasi, navigasi, halaman naratif, kontrol, dan aksesibilitas DOM.
- Phaser 3 dipakai untuk lapisan simulasi 2D ketika sebuah Stage membutuhkannya. Phaser tidak menjadi pengelola state aplikasi.
- Aturan belajar, progres, validasi, dan skor dipisahkan dari renderer sejauh implementasi Stage memerlukannya.
- Semua Stage berbasis canvas harus memiliki jalur kontrol DOM yang setara untuk keyboard dan touch. Canvas tidak boleh menjadi satu-satunya cara menyelesaikan aktivitas.
- Aplikasi hanya dirender pada landscape. Saat portrait, rotate prompt memblokir interaksi sampai orientasi kembali landscape.
- Progres dirancang local-first. Saat ini refresh masih kembali ke Splash karena posisi Screen belum disimpan.

Stage Teknik Kerja Aseptik menggunakan konfigurasi data di `lab/src/data/stages/teknikAseptik.ts`. Registry prosedur memilih workspace berdasarkan id prosedur, sehingga urutan data tidak bergantung pada posisi komponen.

## Struktur repository

```text
.
|-- CONTEXT.md              # istilah produk dan batas makna
|-- TASKS.md                # checklist implementasi dan catatan verifikasi
|-- docs/
|   |-- prd/                # kebutuhan produk, desain, interaksi, QA
|   `-- adr/                # keputusan arsitektur
|-- scripts/
|   `-- optimize-assets.py  # generator WebP non-destruktif
|-- lab/
|   |-- assets/             # aset sumber yang dilacak Git
|   |-- assets-optimized/   # WebP hasil build, diabaikan Git
|   |-- src/                # aplikasi React, Phaser, data, dan presentasi
|   |-- tests/              # pengujian Playwright
|   `-- package.json        # perintah Node.js proyek
|-- requirements.txt        # dependensi Python untuk optimasi aset
`-- vercel.json             # menonaktifkan deploy Git otomatis Vercel
```

## Pengembangan lokal

Gunakan Node.js 22 atau versi LTS yang kompatibel dengan Vite 8. Python hanya diperlukan ketika menjalankan optimasi aset.

```bash
cd lab
npm ci
npm run dev
```

Perintah yang tersedia dari direktori `lab/`:

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan Vite. |
| `npm run build` | Menjalankan pemeriksaan TypeScript dan membuat build produksi. |
| `npm run lint` | Menjalankan Oxlint. |
| `npm run test:e2e` | Menjalankan suite Playwright. |
| `npm run preview` | Menyajikan hasil build lokal. |

Target viewport Playwright mencakup lima ukuran landscape dan satu ukuran portrait untuk memeriksa rotate prompt. Jalankan pengujian e2e setelah perubahan pada navigasi, orientasi, interaksi Stage, atau target sentuh.

## Build dan deployment

### Optimasi aset

Optimizer memindai seluruh `lab/assets/` secara rekursif dan menulis WebP yang lebih kecil ke `lab/assets-optimized/` dengan struktur folder yang sama. Aset sumber tidak pernah ditimpa. GIF animasi dipertahankan, SVG tidak dirasterisasi, dan output yang lebih besar dari sumber tidak dipakai.

```bash
python -m pip install -r requirements.txt
python scripts/optimize-assets.py
```

Vite akan memakai WebP hasil optimasi bila tersedia. Jika file hasil tidak ada atau tidak lebih kecil, import aset asli tetap dipakai. Karena `lab/assets-optimized/` dibuat saat build, direktori ini tidak masuk Git.

### Deployment produksi

[`vercel.json`](vercel.json) menonaktifkan deployment otomatis Vercel dari Git. Production deployment hanya dijalankan oleh [workflow GitHub Actions](.github/workflows/deploy.yml) saat push ke branch `main` atau melalui `workflow_dispatch`.

Urutan workflow:

```text
checkout -> setup Python -> install Pillow -> optimize assets
         -> setup Node.js -> npm ci -> npm run build -> Vercel CLI deploy
```

Tambahkan secret berikut di GitHub repository, pada `Settings -> Secrets and variables -> Actions`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Panduan deployment yang lebih rinci tersedia di [`docs/deployment.md`](docs/deployment.md).

## Aksesibilitas dan batas konten

- Target desain adalah WCAG 2.2 AA, termasuk focus yang terlihat, label, live region untuk feedback, caption atau transkrip audio, dan `prefers-reduced-motion`.
- Target sentuh minimum adalah 44 x 44 px, termasuk area interaktif pada canvas.
- Feedback menjelaskan apa yang perlu diperbaiki tanpa bahasa menghakimi.
- Jangan menulis atau menampilkan parameter prosedur sebagai fakta operasional sebelum ada sign-off ahli.
- MVP tidak meminta data pribadi peserta didik. Isi Reflection tidak boleh dikirim sebagai analytics.

## Dokumentasi

| Dokumen | Kegunaan |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | Kamus istilah produk dan aturan untuk nilai simulasi. |
| [TASKS.md](TASKS.md) | Status pekerjaan, catatan implementasi, dan QA yang belum selesai. |
| [PRD overview](docs/prd/00-overview.md) | Ringkasan produk dan cakupan materi. |
| [Product requirements](docs/prd/02-product-requirements.md) | Scope MVP, requirement, dan acceptance criteria. |
| [Learning interactions](docs/prd/06-learning-interactions.md) | Mekanik Stage, Evidence Decision, dan Evaluation. |
| [Technical specification](docs/prd/07-technical-spec.md) | Batas React, Phaser, domain, state, dan pengujian. |
| [Architecture decisions](docs/adr/) | Keputusan platform, orientasi, navigasi, dan enam prosedur Stage 4. |
| [Deployment guide](docs/deployment.md) | Secret GitHub dan alur deploy Vercel. |
