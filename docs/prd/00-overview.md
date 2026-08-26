# Overview

## Tentang SteriLab

SteriLab adalah laboratorium maya interaktif untuk siswa kelas X SMK Fase E, Program Keahlian Agribisnis Pengolahan Hasil Pertanian (APHP), kode materi AG_APHP_5. Siswa berperan sebagai Analyst mikrobiologi pangan yang menginvestigasi dugaan keracunan makanan, mempraktikkan teknik kerja aseptik, pembuatan media kultur, dan pengelolaan limbah laboratorium sebelum mengambil Evidence Decision berbasis bukti.

Sumber: proposal `docs/raw_proposal/PROPOSAL LAB MAYA KODE AG_APHP_5 RISATUL MUNAWAROH_SMKN 1 PACET.pdf`. Paket dokumen ini merestrukturisasi proposal tersebut menjadi requirement produk; istilah baku ada di [`../../CONTEXT.md`](../../CONTEXT.md), keputusan yang menyimpang dari proposal sumber dicatat di [`../adr/`](../adr/).

## Cakupan materi

1. Penerapan teknik kerja aseptik di laboratorium mikrobiologi.
2. Persiapan ruang kerja, penggunaan APD, dan penerapan K3 laboratorium.
3. Pengenalan fungsi dan penggunaan peralatan laboratorium mikrobiologi.
4. Pembuatan dan sterilisasi media kultur mikroba.
5. Teknik inokulasi sederhana secara aseptik.
6. Dampak kesalahan prosedur terhadap kontaminasi kultur mikroba.
7. Pengelolaan limbah laboratorium sesuai prinsip biosafety dan keselamatan kerja.

Sasaran pengguna: murid kelas X SMK Program Keahlian APHP (Fase E).

## Keputusan kunci

- Platform: Phaser 3 (canvas) untuk 5 Stage hands-on, React/Vite/TypeScript (DOM) untuk seluruh layar lain — bukan H5P/Lumi seperti disebut proposal. Lihat ADR-0001.
- Orientasi: landscape-only di seluruh aplikasi, rotate-prompt saat portrait. Lihat ADR-0002.
- Arsitektur: Clean Architecture — domain/application (aturan Stage, skor, progres) terpisah dari React dan Phaser; Phaser scene lifecycle tetap (Boot→Preload→MainMenu→Lab→Result) dengan satu `LabScene` data-driven, bukan satu scene per Stage. Local-first + PWA-ready. Lihat ADR-0003 dan `07-technical-spec.md`.
- Setiap Stage wajib punya jalur kontrol DOM paralel — canvas Phaser tidak pernah jadi satu-satunya cara menyelesaikan Stage.
- Output final wajib website responsif (landscape), bukan aplikasi native dan bukan screenshot desain.

## Peta dokumen

| Dokumen | Isi |
|---|---|
| `01-learning-design.md` | Model pembelajaran, langkah guru, asesmen, jadwal produksi |
| `02-product-requirements.md` | Tujuan produk, scope, requirement, acceptance criteria |
| `03-information-architecture.md` | Sitemap, layout, breakpoint landscape |
| `04-design-system.md` | Typography, warna, komponen, aksesibilitas |
| `05-content-and-storyboard.md` | Naskah per layar: visual, narasi, SFX, interaksi |
| `06-learning-interactions.md` | Mekanik tiap Stage, evidence branching, evaluasi |
| `07-technical-spec.md` | Arsitektur Phaser+React/Vite, rute, state, data |
| `08-quality-assurance-and-roadmap.md` | QA, Definition of Done, roadmap, risiko |
