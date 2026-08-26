# Product Requirements Document

## Ringkasan

SteriLab adalah laboratorium maya interaktif berbasis website responsif (landscape-only) untuk siswa kelas X SMK Fase E, Program Keahlian Agribisnis Pengolahan Hasil Pertanian. Siswa berperan sebagai Analyst mikrobiologi pangan dalam kasus dugaan keracunan makanan.

Platform: web app Phaser 3 (5 Stage hands-on, lihat `06-learning-interactions.md`) + React/Vite/TypeScript (seluruh layar lain), Clean Architecture (domain/application terpisah dari React dan Phaser), local-first, PWA-ready. Durasi: 60-90 menit. Model: Problem Based Learning, blended learning, pengalaman autentik (detail pedagogis di `01-learning-design.md`, detail teknis di `07-technical-spec.md`). Keputusan platform dan orientasi dicatat di `../adr/0001-phaser-react-vite-scoped-to-stages.md`, `../adr/0002-landscape-only-orientation-lock.md`, dan `../adr/0003-clean-architecture-typescript-data-driven-scenes.md`.

## Tujuan pembelajaran

Siswa mampu menjelaskan pentingnya teknik aseptik, memilih APD dan menerapkan K3, mengenali alat mikrobiologi, menyusun pembuatan media kultur, melakukan urutan inokulasi sederhana, memilah limbah, menganalisis data kultur, mengambil Evidence Decision berbasis bukti, dan merefleksikan integritas serta ketelitian analis.

## Prinsip produk

- Safe to fail: kesalahan bisa diulang dan dijelaskan.
- Evidence before decision: data ditampilkan sebelum pilihan pada Evidence Decision.
- Procedure matters: urutan dan kebersihan memengaruhi validitas Stage.
- Scientific but approachable: istilah ilmiah memakai bahasa siswa.
- Accessible by default: setiap Stage berbasis canvas Phaser wajib punya kontrol DOM paralel; keyboard, touch, kontras, caption, reduced motion didukung di seluruh layar.
- Website-first, landscape-only: fitur inti berjalan di browser tanpa instalasi, terkunci orientasi landscape dengan rotate-prompt saat portrait.

## Scope MVP

Termasuk: Cover, Case, Briefing Lead QC, Guide (panduan alat/APD/K3/limbah), Missions dashboard, Stage 1-5 (APD, Area Aseptik, Media Kultur, Teknik Aseptik, Limbah), Evidence dashboard sampel SM-025, Evidence Decision Produk Aman/Tidak Aman, Evaluation (multiple choice/sorting/drag-drop/fill blank/true-false), Reflection, skor, badge, sertifikat digital sederhana, local progress, rotate-prompt orientasi, dan kontrol DOM paralel keyboard/touch pada tiap Stage.

Tidak termasuk: login, kelas, dashboard guru, sinkronisasi perangkat, multiplayer, simulasi 3D penuh, integrasi LMS, kredensial formal, dukungan portrait, serta diagnosis atau rekomendasi pangan dunia nyata.

## Alur utama

Cover → Case → Briefing Lead QC → Guide → Missions → Stage 1-5 → Evidence → Evaluation → Reflection → Completion.

Stage yang selesai dapat dibuka kembali. Stage yang belum selesai dibuka berurutan.

## Requirements

- FR-01 navigasi maju/kembali/home/progress.
- FR-02 status Stage locked/available/in progress/completed.
- FR-03 auto-save, resume, dan retry.
- FR-04 konfirmasi saat keluar dari aktivitas.
- FR-05 setiap unit (Stage/Evaluation item) memiliki tujuan, instruksi, aktivitas, feedback, next.
- FR-06 glossary/tooltips dan caption/transcript/alt text.
- FR-07 single/multiple choice, sorting, drag-drop, text input, true-false, branching.
- FR-08 setiap Stage berbasis canvas Phaser wajib punya kontrol DOM paralel yang fungsional setara (keyboard/tap dapat menyelesaikan Stage tanpa menyentuh canvas); feedback menjelaskan alasan.
- FR-09 skor Stage dan keseluruhan configurable.
- FR-10 evidence tampil sebelum keputusan; pertanyaan alasan muncul setelah Evidence Decision.
- FR-11 Completion menampilkan skor, badge, ulangi, menu utama, cetak/simpan.
- FR-12 orientasi terkunci landscape; tampilkan rotate-prompt penuh layar saat perangkat portrait dan blokir interaksi sampai kembali landscape.
- NFR: responsive landscape 568-1440px (lihat `03-information-architecture.md`), no-plugin, asset terkompresi, target WCAG 2.2 AA, no personal data in MVP, simulated-data disclaimer (lihat `../../CONTEXT.md` → Simulated Value), localStorage fallback, local-first (jalan penuh offline setelah load pertama), PWA-ready (installable, offline shell caching).

## Success metrics

80% siswa pilot selesai tanpa bantuan teknis; 75% benar pada Evidence Decision dan alasan; 80% memberi nilai usability minimal 4/5; tidak ada blocker pada perangkat uji landscape.

## Acceptance criteria

Pengguna mencapai Completion tanpa dead end. Lima Stage unlock dan complete akurat. Setiap aktivitas memiliki instruksi, respons, feedback, dan jalur lanjut. Setiap Stage berfungsi lewat mouse, touch, DAN keyboard/kontrol DOM paralel — bukan hanya drag pada canvas. Refresh mempertahankan progres. Skor akhir konsisten. Website usable di smartphone landscape, tablet landscape, dan desktop; portrait menampilkan rotate-prompt, bukan layout rusak. Tidak ada placeholder, link mati, alt hilang, atau tombol ambigu.

## Open decisions

Nilai CFU, threshold, dan parameter prosedur harus disetujui ahli APHP/mikrobiologi (lihat `../../CONTEXT.md` → Simulated Value). Storyboard Stage 1 (APD) dan Stage 2 (Area Kerja Aseptik) belum tersedia di proposal sumber — perlu ditulis sebelum produksi (lihat gap di `05-content-and-storyboard.md`). Fase berikutnya dapat menambahkan ekspor guru, bilingual, dan sertifikat bernama.
