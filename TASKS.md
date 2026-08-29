# SteriLab - Task List Implementasi

Dokumen ini adalah pedoman kerja AI/implementor berdasarkan `docs/prd/`, ADR, `CONTEXT.md`, proposal di `docs/raw/`, dan materi/soal sumber. Istilah **Screen** dipakai untuk halaman produk; istilah *scene* hanya dipakai untuk scene internal Phaser. Urutan berikut mengikuti perjalanan Analyst dari awal sampai Completion.

## Aturan Path: SPA Satu Path (`/`)

**App ini hanya punya satu path: `/`.** Tidak ada `react-router`, tidak ada URL per Screen, dan URL tidak pernah berubah selama sesi berjalan (`docs/adr/0005-single-path-spa-navigation.md`).

- Perpindahan Screen memakai in-memory stack di `src/app/navigation.tsx` — `goTo(screen, params?)` untuk maju, `goBack()` untuk mundur. `src/app/ScreenRouter.tsx` adalah satu-satunya tempat `ScreenId` dipetakan ke komponen.
- `ScreenId` yang tersedia: `splash`, `case`, `briefing`, `guide`, `missions`, `stage`, `evidence`, `evaluation`, `reflection`, `completion`. Kelima Stage praktik memakai satu Screen `stage` dengan parameter, bukan sepuluh Screen berbeda: `goTo('stage', { stageId })` dengan `StageId` = `apd` | `area-aseptik` | `media-kultur` | `teknik-aseptik` | `pengelolaan-limbah` (`src/core/types/index.ts`).
- Penulisan `/case`, `/missions`, `/missions/apd`, dan sejenisnya di dokumen ini **bukan rute** — itu peninggalan draf awal yang sudah diganti notasi `goTo(...)` di bawah. Jangan menambah `react-router` atau `history.pushState` untuk memenuhi butir mana pun.
- Konsekuensi yang sudah ditangani: fullscreen cukup di-request sekali (navigasi tidak pernah unmount `<html>`/`<body>`), dan browser back tidak dipakai sebagai mekanisme navigasi produk.
- Konsekuensi yang **belum** ditangani: refresh browser selalu kembali ke `splash` karena posisi Screen tidak ikut disimpan ke `localStorage`. Lihat butir persistence di Aturan Lintas Screen.

## Snapshot Validasi (29 Agustus 2026, sesi terakhir)

- Validasi dilakukan terhadap kode aktual pada `lab/src/`, bukan sekadar struktur navigasi atau komentar kode.
- `npm run build` lulus: TypeScript dan production build Vite berhasil. Vite masih memberi peringatan chunk Phaser 1.20 MB (321 KB gzip), sehingga target optimasi bundle belum dapat dinyatakan selesai.
- `npm run lint` lulus; satu warning lama yang dibiarkan: `src/app/navigation.tsx:62` (`react(only-export-components)` — file mengekspor `useNavigation` bersama provider-nya).
- `npm run test:e2e` lulus: **66 test run (11 spesifikasi × 6 project viewport), 51 lulus, 15 skip sesuai orientasi.** File: `tests/splash-and-case.spec.ts` (3), `tests/missions.spec.ts` (7), `tests/portrait-block.spec.ts` (1), plus helper `tests/settle.ts`.
- Screen yang benar-benar sudah ada isinya: **Splash & Cover, Case, Missions**. Sisanya (`briefing`, `guide`, `stage`, `evidence`, `evaluation`, `reflection`, `completion`) masih stub satu heading — `stage` hanya mem-boot Phaser kosong.
- Hanya butir checklist yang implementasinya lengkap dan dapat dibuktikan diberi tanda selesai.

## Sesi Terakhir - Missions dan Transisi Case (29 Agustus 2026)

- **Screen 5 (Missions) dibangun penuh** dari Figma node `29:2435` "Scene 03: Navigasi (Menu Utama)" (frame `42:36`, 1920×1080). `MissionsPage.tsx` sebelumnya stub 7 baris. Posisi diambil dari geometri Figma, bukan dikira-kira: kartu di `y=421.195/1080`, `x = 252.878 + (n-1)·291.098` dari 1920; pill di `y=787.783`; note card grup `42:677`.
- **Progress unlock berurutan** ditambahkan di `src/core/progress/levelProgress.ts` (baru): key `sterilab:levelProgress`, payload versioned, bentuk fungsi + listener sama seperti `audioSettings.ts`. `markLevelCompleted(n)` menolak level terkunci sehingga rantai unlock tidak bisa dilompati. Kartu `completed` tetap bisa dibuka ulang.
- **Transisi masuk/keluar** diseragamkan di tiga Screen yang sudah jadi. Missions dan Case memakai tangga stagger 110 ms, `bubble-in` masuk / `bubble-out` keluar, urutan keluar persis kebalikan urutan masuk. Semua jalan keluar (home, back, CTA) lewat satu fungsi `leaveTo()`; sebelumnya di `CasePage` tiap tombol memanggil `goTo` langsung sehingga transisi keluar tidak pernah jalan.
- `PulseButton` sebelumnya tidak punya slot animasi sama sekali — ditambah `animationClassName`/`animationDelayMs` dengan kontrak sama seperti `IconButton`. Class-nya menempel di wrapper ber-`position: absolute`, bukan di `<button>`, supaya animasi ber-`fill: both` tidak mengalahkan `transform: scale()` milik hover/press.
- Keyframe baru di `src/index.css`: `sterilab-rise-in-fade` / `sterilab-fall-out-fade` (note card Missions naik dari luar viewport) dan `sterilab-slide-out-fade` (kartu Berita Terkini Case keluar geser ke kiri). Semuanya masuk daftar `prefers-reduced-motion`.
- **Bug nyata yang ditemukan dan diperbaiki lewat pengujian**, dua-duanya juga ada di `CasePage`: ikon top-bar yang di-floor ke 44 px saling bertumpuk di 568×320, dan ikon suara terdorong keluar tepi kanan. Di `MissionsPage` offset-nya ikut di-floor/di-cap (`max(64px, 7.609%)`, `min(93.931%, 100% - 52px)`). **`CasePage` belum ikut diperbaiki** — lihat butir terbuka di Screen 2.
- Komentar `presentation/components/Stage.tsx` dikoreksi. Sebelumnya mengklaim persentase memetakan titik yang sama di layer background dan layer konten; itu hanya benar pada viewport 16:9. Trade-off-nya sekarang ditulis eksplisit di sana.
- CTA "Lanjut Briefing" di Case dialihkan ke `goTo('missions')`. Figma mengurutkan 01 Splash/Home → 02 Hook (Case) → 03 Navigasi tanpa frame briefing, dan `briefing` masih stub — merutekan ke sana berarti dead end.

## Audit dan Perbaikan Besar (29 Agustus 2026, sesi sebelumnya)

- `react-router-dom` dihapus sepenuhnya. Seluruh app kini berjalan di satu path (`/`), navigasi antar Screen memakai in-memory stack (`src/app/navigation.tsx` — `NavigationProvider`/`useNavigation`, `ScreenRouter`), bukan URL. Lihat `docs/adr/0005-single-path-spa-navigation.md`.
- Screen 1 (Splash & Cover) dan Screen 2 (Case) dikonfirmasi sebagai dua Screen berurutan pada state machine yang sama (bukan dua route terpisah). Splash+Cover yang sebelumnya dua Phaser scene (`BootScene` → `HomeScene`) di-porting jadi satu komponen React (`SplashPage.tsx`) — memperbaiki deviasi dari ADR-0001 (Phaser seharusnya hanya untuk 5 Stage) dan mengeluarkan Phaser dari initial bundle sepenuhnya (`vite build` sekarang menaruh Phaser di chunk lazy terpisah, hanya diambil saat Stage dibuka).
- Fullscreen di-request sekali di gesture "Ketuk di mana saja" pada `SplashPage`, dan bertahan lintas Screen karena navigasi tidak pernah unmount `<html>`/`<body>`.
- Target sentuh ikon top-bar (home/back/sound) sebelumnya bisa mengecil sampai ~21px pada viewport landscape terkecil (568×320) karena memakai persentase mentah dari kanvas Figma 1920×1080 — diperbaiki lewat `IconButton` (`presentation/components/IconButton.tsx`, dipakai `SplashPage` dan `CasePage`) yang memakai `max(44px, …)` sehingga tidak pernah di bawah target WCAG 2.2 AA 44×44px.
- Portrait block diperketat: `OrientationGuard` (`presentation/components/OrientationGuard.tsx`) menambahkan atribut `inert` pada konten app saat portrait (di atas overlay `RotatePrompt` yang sudah ada), sehingga screen reader/focus keyboard tidak bisa lagi menjangkau konten di baliknya; copy `RotatePrompt` diperjelas dengan nama app dan jaminan progres tersimpan.
- Item lintas-Screen yang masih belum diverifikasi lewat pengujian nyata di berbagai device (lihat Aturan Lintas Screen dan QA/Release) tetap dibiarkan checklist kosong sampai ada bukti Playwright/manual.

## Aturan Lintas Screen

- [x] Gunakan React + Vite + TypeScript untuk app shell dan seluruh Screen non-simulasi; gunakan Phaser 3 hanya pada lima Stage praktik.
- [ ] Pisahkan aturan pembelajaran, validasi, skor, progres, dan persistence pada layer `domain`/`application`; layer tersebut tidak boleh mengimpor React, Phaser, DOM, atau API browser.
- [x] Komunikasikan React dan Phaser melalui typed command/event bus (`core/events/eventBus.ts`, dipakai `LabScene`/`ResultScene`). React tidak boleh memanipulasi game object Phaser secara langsung, dan Phaser tidak boleh mencari/memanipulasi DOM secara langsung — diverifikasi tidak ada pelanggaran di kode saat ini.
- [ ] Implementasikan lifecycle Phaser `BootScene -> PreloadScene -> MainMenuScene -> LabScene -> ResultScene`; gunakan satu `LabScene` data-driven untuk semua Stage, bukan scene per Stage atau per langkah. (Scene terdaftar dan `MainMenu -> Lab` sudah tersambung; `Lab -> Result` dan `ExperimentRunner` data-driven belum ada — menyusul bersama konten Stage.)
- [ ] Terapkan visual Quality Control laboratory sesuai token desain: teal sebagai aksi, amber untuk perhatian, warna sukses/bahaya selalu disertai teks dan ikon, serta font Inter/Manrope/system sans-serif.
- [x] Buat app landscape-only. Saat portrait, tampilkan rotate-prompt full-screen, hentikan input dan audio, pause Phaser tanpa mereset progres, lalu pulihkan otomatis saat landscape. (Sebelumnya `App.tsx` meng-unmount `RouterProvider` saat portrait sehingga game Phaser malah di-destroy, bukan di-pause — sudah diperbaiki: `RotatePrompt` kini hanya overlay, dan `PhaserGame.ts` men-pause semua scene + mute audio + `input.enabled = false` lewat `core/orientation/orientationGate.ts`, lalu pulih otomatis saat landscape.)
- [ ] Penuhi breakpoint landscape: phone 568-767px, tablet 768-1023px, desktop >=1024px; jangan merender layout konten portrait. Terbukti untuk tiga Screen yang sudah ada (Splash, Case, Missions) lewat Playwright di 568×320, 667×375, 1024×768, 1366×768, 1440×900; belum bisa ditutup sampai Screen sisanya ada. Helper viewport: `core/viewport/mobileGate.ts` + `presentation/hooks/useIsMobile.ts` (breakpoint 1024px).
- [ ] Sediakan top bar konsisten: identitas SteriLab, progress, bantuan/glosarium, dan kontrol suara dengan kondisi suara default mati. Trio home/back/sound sudah konsisten dipakai `SplashPage`/`CasePage`/`MissionsPage` lewat `IconButton`, dan default suara mati sudah benar di `audioSettings.ts`. Belum ada: identitas SteriLab, indikator progress, dan bantuan/glosarium di top bar. **Posisi tombol back belum seragam** — `CasePage` memakai `left: 9.5%`, `MissionsPage` memakai `7.609%` sesuai frame Figma-nya sendiri, jadi tombolnya melompat saat pindah Screen. Perlu satu keputusan angka.
- [ ] Pastikan setiap Screen memiliki navigasi lanjut, kembali atau Missions yang tidak menghasilkan dead end; browser back tidak boleh menghapus state. Rantai Splash → Case → Missions → (`stage`/`evaluation`/`reflection`) sudah tersambung dua arah lewat `goTo`/`goBack`. Semua Screen stub masih dead end karena tidak punya tombol apa pun.
- [ ] Terapkan target WCAG 2.2 AA: heading/landmark benar, focus visible, target sentuh minimal 44x44px, kontras memadai, reduced motion, alt text, caption/transcript, dan live region untuk feedback. Sudah: target sentuh 44×44 di-floor oleh `IconButton` dan diuji Playwright pada Splash/Case/Missions; seluruh animasi masuk/keluar dihormati `prefers-reduced-motion` (CSS + `core/a11y/motion.ts`); alt text ada di setiap art; kartu Missions yang terkunci punya alasan pada nama aksesibelnya, bukan sekadar warna abu-abu. Belum: caption/transcript, live region, audit kontras, dan heading/landmark yang benar di Screen stub. Catatan: teks utama Missions dan Case dipanggang ke dalam PNG, jadi hanya terwakili lewat `alt`/sr-only heading — bukan teks yang bisa diperbesar atau diseleksi.
- [ ] Audio hanya diputar setelah interaksi pengguna; sediakan mute, caption/transcript, dan fallback jika audio gagal dimuat.
- [ ] Tampilkan disclaimer bahwa seluruh CFU, threshold, suhu, waktu, dan data sampel adalah **nilai simulasi**, bukan standar mikrobiologi dunia nyata.
- [ ] Minta sign-off ahli APHP/mikrobiologi terhadap prosedur, klasifikasi limbah, kata-kata safety, CFU/threshold, suhu, dan waktu sebelum release.
- [ ] Simpan session versioned ke `localStorage` setelah perubahan Screen, jawaban, Stage selesai, Evidence Decision, evaluasi, dan refleksi; jika storage tidak tersedia, gunakan state in-memory dan tampilkan peringatan. Baru dua potong state yang tersimpan, keduanya versioned dan sudah menangani storage yang tidak tersedia (fallback in-memory, `try`/`catch`): `sterilab:audioEnabled` (`core/audio/audioSettings.ts`) dan `sterilab:levelProgress` (`core/progress/levelProgress.ts`). Belum ada: posisi Screen (refresh selalu balik ke `splash`), jawaban, skor, Evidence Decision, refleksi, dan **peringatan yang terlihat** saat storage mati — saat ini gagal senyap.
- [ ] Implementasikan reset dengan modal konfirmasi, auto-save/resume/retry, dan status Stage `locked`, `available`, `in_progress`, `completed`. Status `locked`/`available`/`completed` sudah jalan dan tampil di kartu Missions; `resetLevelProgress()` sudah ada di core tetapi **belum punya UI maupun modal konfirmasi**. `in_progress`, auto-save, dan resume belum ada karena belum ada Stage yang bisa melaporkannya.
- [ ] Jadikan skor aktivitas dan kredit retry configurable; refleksi completion-based dan tidak dihitung sebagai jawaban benar/salah.
- [ ] Lazy-load Phaser dan aset tiap Stage ketika Stage dibuka; kompres gambar/audio dan siapkan PWA offline shell agar perjalanan inti bisa berjalan setelah load pertama.

## Screen 1 - Splash & Cover (Screen awal, `SplashPage.tsx`)
- [x] splash scene dengan loading progressbar asset (`BootScene`: preload asli dengan `this.load.*`, progress bar + label `X% Memuat Konten`, tidak lanjut sebelum asset benar-benar termuat — diverifikasi cocok pixel-akurat dengan Figma node `9:500` "Loading").
- [ ] Buat hero split landscape dengan copy SteriLab, hook kasus, CTA **Mulai Menjelajah**, Petunjuk, Profil, dan kontrol audio. Catatan: frame Figma final "Home" (node `2:3`) tidak menyertakan tombol Petunjuk maupun Profil — hanya Mulai Menjelajah, Keluar, dan kontrol suara. Butir ini perlu konfirmasi PM/desain: apakah Petunjuk/Profil masih diperlukan (berarti frame Figma perlu ditambah) atau baris ini disesuaikan mengikuti Figma final.
- [x] Gunakan visual laboratorium mikrobiologi pangan modern: analis ber-APD, mikroskop, Laminar Air Flow, logo/cawan petri/tabung reaksi (`splash_bg.png`/`home_bg.png`, diverifikasi cocok dengan Figma).
- [ ] Tampilkan narasi pembuka dari storyboard dan ambience laboratorium setelah pengguna berinteraksi. Narasi pembuka sudah tampil (bubble `greeting.png` di Home berisi naskah storyboard persis dari `05-content-and-storyboard.md` > Cover); ambience laboratorium belum — belum ada aset audio ambience di `lab/assets/sounds/` untuk dimuat.
- [x] Implementasikan animasi logo/elemen foreground staggered; background full-bleed tetap statis dan tidak ikut bubble transition.
- [x] Tambahkan hover dan press feedback pada CTA/ikon sesuai token motion; dukung keyboard dan touch. (Hover/press sudah ada; sesi ini menambah dukungan keyboard — Tab/Shift+Tab memindah focus ring di antara tombol, Enter/Space menjalankan aksi yang sama dengan pointerdown. Tween hover/bubble juga kini menghormati `prefers-reduced-motion`.)
- [x] Arahkan CTA utama ke `goTo('case')`; pastikan aset Cover tidak memuat aset Stage resolusi penuh.

## Screen 2 - Case: Briefing Kasus (`goTo('case')`, `CasePage.tsx`)

Frame Figma: node `20:1295` "Scene 02: Hook", frame `20:1296` (sebelum klik) dan `29:1297` (setelah klik).

- [x] Sajikan dugaan keracunan pangan pada kegiatan sekolah, penerimaan sampel, peran Analyst, serta konsekuensi hasil uji yang tidak akurat. Keempatnya ada di `news_information.png` (kartu "Berita Terkini" yang muncul setelah **Baca Selengkapnya**), termasuk kalimat peran ("kamu adalah analis laboratorium yang bertugas menangani pengujian tersebut") dan paragraf konsekuensi hasil uji tidak akurat.
- [ ] Tampilkan ilustrasi ruang briefing dan monitor berita; sediakan narasi bertahap, caption/transcript, dan area narasi yang dapat discroll bila diperlukan. Ilustrasi, monitor, dan narasi dua tahap (sebelum/sesudah **Baca Selengkapnya**) sudah ada. Belum ada caption/transcript: seluruh naskah dipanggang ke dalam `news_information.png`, sehingga hanya terwakili oleh satu `alt` ringkas dan tidak bisa diseleksi, diperbesar, atau dibacakan utuh. Butuh keputusan: naskah dipindah ke DOM di atas art, atau disediakan transcript terpisah. Catatan teknis: class `.sterilab-scroll` di `src/index.css` ditulis untuk kolom narasi Screen ini tetapi **tidak dipakai di mana pun** — hapus atau pakai.
- [ ] Tambahkan SFX notifikasi berita dan ambience opsional setelah opt-in suara. Belum ada asetnya — `lab/assets/sounds/` baru berisi `01_reusable/short/click.webm`.
- [x] Sediakan CTA **Lanjut Briefing** tanpa memaksa narasi/audio selesai. CTA aktif begitu kartu berita dibuka dan tidak menunggu apa pun. **Tujuannya kini `goTo('missions')`, bukan `briefing`** — lihat catatan sesi terakhir.
- [x] Terapkan transisi masuk saat Screen dimuat dan transisi keluar saat berpindah, pada tombol reusable (home/back/sound) maupun CTA **Baca Selengkapnya** dan **Lanjut Briefing**. Tangga stagger 110 ms: masuk `home → back → sound → Baca Selengkapnya`; **Lanjut Briefing** masuk 130 ms setelah kartu berita dibuka, bukan dihitung dari mount. Keluar persis kebalikannya (`lanjut → news → baca → sound → back → home`) dan tangganya menyusut otomatis kalau kartu berita belum pernah dibuka. Diuji lewat `tests/splash-and-case.spec.ts` ("Case holds its content for the staggered exit before Missions mounts").
- [ ] Samakan penanganan tepi top-bar dengan `MissionsPage`: pada 568×320 ikon home/back di `CasePage` saling bertumpuk dan ikon suara terdorong keluar tepi kanan, karena `left`-nya masih persentase mentah tanpa `max()`/`min()`. Bug lama, ditemukan saat mengerjakan Missions, belum diperbaiki di sini.

## Screen 3 - Briefing Lead QC (`goTo('briefing')`, `BriefingPage.tsx` - masih stub)

- [ ] Tulis dan tampilkan briefing Lead QC yang menjelaskan tujuan investigasi, prosedur, nilai ketelitian/integritas, dan pentingnya teknik aseptik.
- [ ] Perjelas misi: siapkan diri dan area kerja, buat media, lakukan inokulasi aseptik, kelola limbah, lalu ambil Evidence Decision.
- [ ] Sediakan caption/narasi opsional, CTA **Lanjut Investigasi**, dan jalur kembali yang mempertahankan progres.
- [ ] Arahkan CTA ke `goTo('guide')` agar panduan alat/K3 dipelajari sebelum Stage.

## Screen 4 - Guide: Alat, APD, K3, dan Limbah (`goTo('guide')`, `GuidePage.tsx` - masih stub)

- [ ] Bangun grid kartu yang dapat difilter untuk alat laboratorium, APD, aturan K3, simbol/jenis limbah, dan penggunaan tiap item pada Stage.
- [ ] Setiap kartu harus memiliki visual, nama, fungsi, safety note, stage usage, alt text, serta tooltip/glosarium yang dapat diakses keyboard.
- [ ] Masukkan minimal LAF, Bunsen/spiritus, jarum ose, cawan petri, tabung reaksi, alkohol 70%, autoklaf, bin limbah, jas lab, sarung tangan, masker, goggles, dan hair cover.
- [ ] Pastikan konten tidak menyajikan parameter operasional simulasi sebagai prosedur standar tervalidasi.
- [ ] Sediakan CTA ke `goTo('missions')` setelah Analyst memahami panduan.

## Screen 5 - Missions (`goTo('missions')`, `MissionsPage.tsx`)

Frame Figma final: node `29:2435` "Scene 03: Navigasi (Menu Utama)" (frame `42:36`, 1920x1080). `MissionsPage.tsx` di-slice terhadap frame itu dan diverifikasi lewat `tests/missions.spec.ts` (5 viewport landscape).

- [x] Tampilkan dashboard lab dengan kartu Stage bernomor dan CTA per kartu (lima kartu `level_*_card.png` + pill `start_btn`/`locked_btn`, posisi diambil dari x/y frame Figma). **Progress keseluruhan, stepper, tujuan, dan estimasi durasi tidak ada di frame Figma final** — butir itu perlu keputusan PM/desain sebelum ditambahkan di atas art yang sudah jadi.
- [ ] Urutkan unlock: Stage 1 APD -> Stage 2 Area Kerja Aseptik -> Stage 3 Media Kultur -> Stage 4 Teknik Kerja Aseptik -> Stage 5 Limbah -> Evidence -> Evaluation -> Reflection -> Completion. Mekanisme unlock berurutan sudah jalan (`core/progress/levelProgress.ts`), tetapi **isi menunya berbeda dari baris ini**: frame Figma hanya memuat lima kartu — Teknik Kerja Aseptik, Pembuatan Media Kultur Mikroba, Pengelolaan Limbah Laboratorium, Evaluasi, dan kartu ke-5 (ilustrasi refleksi, sementara dirutekan ke `reflection`). Tidak ada kartu APD maupun Area Kerja Aseptik, dan tidak ada Evidence. Perlu konfirmasi PM/desain: art yang ditambah, atau daftar Stage yang disesuaikan.
- [x] Izinkan Stage yang completed dibuka kembali; Stage yang belum eligible harus locked dengan alasan yang jelas, bukan sekadar warna abu-abu (kartu `completed` tetap aktif dengan label "Ulangi Misi N"; kartu `locked` memakai `disabled` + nama aksesibel "terkunci. Selesaikan Misi N-1 lebih dulu").
- [ ] Sinkronkan status kartu dengan persistence dan tampilkan resume untuk Stage yang `in_progress`. Persistence + sinkronisasi status sudah ada (`sterilab:levelProgress`, versioned, dengan listener); state `in_progress`/resume belum — belum ada Stage yang bisa melaporkannya, dan `markLevelCompleted()` belum dipanggil dari mana pun kecuali test.
- [x] Pastikan tampilan mission grid responsif: satu baris lima kartu di semua breakpoint landscape sesuai frame Figma. Diverifikasi di 568x320, 667x375, 1024x768, 1366x768, 1440x900 — posisi/proporsi kartu dan note card diuji terhadap koordinat Figma, dan kartu tidak pernah bertabrakan dengan top bar maupun note card.
- [ ] Kartu dan note card melayang ~20-75px dari fitur background yang menaunginya pada viewport non-16:9 (paling terlihat di tablet 1024x768), karena `Stage` merender background sebagai `cover` dan konten sebagai `contain`. Ini trade-off arsitektural lintas Screen (lihat komentar di `presentation/components/Stage.tsx`), bukan khusus Screen 5 — butuh keputusan tersendiri.

## Screen 6 - Stage 1: Persiapan APD (`goTo('stage', { stageId: 'apd' })`)

- [ ] Author storyboard yang belum ada di proposal: visual ruang persiapan, narasi singkat tujuan APD, feedback safety, SFX, dan acceptance criteria konten.
- [ ] Konfigurasikan Stage data-driven dengan objek jas lab, sarung tangan, masker, goggles, hair cover, sandal, perhiasan, serta makanan/minuman.
- [ ] Buat canvas Phaser yang memungkinkan Analyst memilih APD dan mengenakannya pada siluet analis; beri selected state dan hit-area minimal 44px.
- [ ] Buat kontrol DOM paralel yang fungsional setara: pilih item dengan keyboard/tap lalu jalankan aksi **Kenakan**; semua aksi harus mengirim completion event yang sama dengan canvas.
- [ ] Validasi bahwa APD wajib dipakai dan distractor/objek terlarang dikenali; jangan mendasarkan validasi pada posisi sprite.
- [ ] Beri feedback "Belum tepat" yang menjelaskan fungsi APD atau risiko objek terlarang, retry yang aman, skor, dan CTA Stage berikutnya.

## Screen 7 - Stage 2: Area Kerja Aseptik (`goTo('stage', { stageId: 'area-aseptik' })`)

- [ ] Author storyboard yang belum ada di proposal: visual meja kerja, narasi, objek, urutan aman, feedback risiko kontaminasi, SFX, dan acceptance criteria konten.
- [ ] Konfigurasikan urutan: disinfeksi meja, siapkan LAF, tata alat, gunakan Bunsen/spiritus bila relevan, cek alkohol 70%, lalu singkirkan benda yang tidak perlu.
- [ ] Implementasikan canvas Phaser untuk ordering dan penempatan objek pada area kerja.
- [ ] Implementasikan kontrol DOM paralel: urutkan langkah memakai tombol naik/turun keyboard atau tap-pilih-tempat; jalur ini harus dapat menyelesaikan Stage sepenuhnya.
- [ ] Validasi urutan/penempatan lewat aturan domain dan berikan koreksi yang mengaitkan kesalahan dengan risiko kontaminasi.
- [ ] Tambahkan state instruksi, progres langkah, retry, skor, completed, serta CTA ke Stage 3.

## Screen 8 - Stage 3: Pembuatan Media Kultur (`goTo('stage', { stageId: 'media-kultur' })`)

- [ ] Konfigurasikan urutan data-driven: timbang media -> tambah aquades -> panaskan/larutkan -> homogenkan -> bagi media -> sterilisasi autoklaf.
- [ ] Buat canvas animasi proses dengan indikator suhu/waktu yang jelas bertanda simulasi, tanpa membuat angka operasional sebelum divalidasi ahli.
- [ ] Implementasikan drag-to-order/tap selection pada canvas dengan feedback otomatis per jawaban.
- [ ] Implementasikan daftar DOM yang dapat di-reorder dengan keyboard dan touch; hasilnya harus memanggil validasi dan completion event yang sama.
- [ ] Sajikan narasi mengenai pentingnya media kultur, SFX timbangan/air/autoklaf opsional, caption, dan reduced-motion fallback.
- [ ] Simpan attempt, skor, status selesai, dan lakukan unlock Stage 4 setelah urutan valid.

## Screen 9 - Stage 4: Teknik Kerja Aseptik (`goTo('stage', { stageId: 'teknik-aseptik' })`)

- [ ] Buat config Stage 4 berisi tepat 11 langkah linear, bukan tiga kategori besar: cuci tangan; pakai APD; nyalakan LAF + semprot alkohol; nyalakan Bunsen; sterilisasi jarum ose; dinginkan jarum ose; ambil sampel; inokulasi ke media; tutup tabung + label; inkubasi; bersihkan area kerja.
- [ ] Gunakan satu `LabScene` dan `ExperimentRunner`; penambahan/perubahan langkah harus dilakukan pada data config, bukan membuat scene/state hardcoded baru.
- [ ] Bangun workspace Phaser berisi LAF, Bunsen/spiritus, jarum ose, media/cawan/tabung, alkohol 70%, APD, inkubator, dan objek pembersihan.
- [ ] Implementasikan aksi visual sesuai setiap langkah: wastafel, checklist APD, LAF/semprotan, api, jarum membara, pendinginan steril, ambil sampel, streak inokulasi, label, inkubasi, serta penutupan/pembersihan area.
- [ ] Tolak aksi di luar urutan dengan correction feedback yang menjelaskan risiko kontaminasi tetapi memungkinkan Analyst memperbaiki dan melanjutkan.
- [ ] Pastikan kondisi khusus tervalidasi: jarum tidak langsung dipakai saat panas dan tidak menyentuh permukaan non-steril ketika pendinginan.
- [ ] Buat kontrol DOM paralel berupa daftar 11 langkah bernomor dengan aksi pilih/jalankan via keyboard atau tap; kontrol ini harus menyelesaikan Stage tanpa menyentuh canvas.
- [ ] Gunakan daftar 11 langkah yang sama sebagai sumber data untuk soal ordering dan error-detection pada Evaluation.
- [ ] Tambahkan narasi, SFX terkontrol, caption, feedback, retry/score, persistence, dan unlock Stage 5.

## Screen 10 - Stage 5: Pengelolaan Limbah (`goTo('stage', { stageId: 'pengelolaan-limbah' })`)

- [ ] Konfigurasikan objek: cawan petri bekas, sarung tangan, loop/jarum, botol media, plastik, kertas, dan kultur mikroba, beserta kategori bin dan metode penanganannya.
- [ ] Validasi seluruh klasifikasi bin/metode dengan ahli APHP/mikrobiologi sebelum konten dikunci.
- [ ] Buat canvas Phaser drag-to-bin dengan bin berlabel, bukan hanya dibedakan warna.
- [ ] Buat kontrol DOM paralel: pilih item lalu pilih bin dari daftar melalui keyboard/tap; kirim event validasi/completion yang sama dengan jalur canvas.
- [ ] Beri feedback edukatif tentang pemisahan limbah, benda tajam, dan kultur mikroba; gunakan copy tidak menghakimi dan retry aman.
- [ ] Simpan skor/completion dan buka `goTo('evidence')` hanya setelah lima Stage selesai.

## Screen 11 - Evidence: Dashboard Hasil dan Evidence Decision (`goTo('evidence')`, `EvidencePage.tsx` - masih stub)

- [ ] Buat layout evidence tiga kolom landscape: fakta sampel di kiri, bukti kultur di tengah, dan panel keputusan di kanan; pada tablet panel keputusan boleh turun setelah bukti.
- [ ] Tampilkan data simulasi SM-025: Roti Isi Cokelat, asal kegiatan sekolah dasar, Analyst peserta didik, foto/ilustrasi kultur, koloni/CFU, kondisi media, dan catatan pengamatan.
- [ ] Letakkan disclaimer nilai simulasi pada data dan jangan tetapkan CFU/threshold final sebelum sign-off ahli.
- [ ] Pastikan seluruh evidence dapat diperiksa sebelum tombol **Produk Aman** atau **Produk Tidak Aman** tersedia/dikirim.
- [ ] Setelah memilih **Produk Aman**, tampilkan pertanyaan alasan dengan opsi jumlah koloni memenuhi standar, teknik aseptik benar, tidak ada kontaminasi, atau semua benar; implementasikan feedback branch-specific.
- [ ] Setelah memilih **Produk Tidak Aman**, tampilkan pertanyaan dasar keputusan dengan opsi jumlah koloni melebihi batas, terjadi kontaminasi, media rusak, atau semua benar; implementasikan feedback branch-specific.
- [ ] Simpan keputusan, alasan, attempt, dan skor; berikan penjelasan ilmiah yang sesuai branch serta CTA ke `goTo('evaluation')`.

## Screen 12 - Evaluation (`goTo('evaluation')`, `EvaluationPage.tsx` - masih stub)

- [ ] Implementasikan Evaluation sepenuhnya sebagai DOM, satu kartu soal per langkah dengan counter, progress, submit, feedback, retry/next, dan skor otomatis.
- [ ] Author/configure 3 item teknik aseptik (MC + ordering), termasuk reuse data 11 langkah Stage 4 untuk mengurutkan prosedur dan mendeteksi langkah salah/hilang.
- [ ] Author/configure 3 item media kultur (ordering + fill in the blank).
- [ ] Author/configure 3 item limbah (matching/drag-drop yang juga memiliki alternatif keyboard/tap).
- [ ] Sertakan Evidence Decision sebagai area evaluasi branching dengan dua branch, sehingga bobot keseluruhan mengikuti 25% teknik aseptik, 25% media kultur, 25% limbah, 25% evidence.
- [ ] Pastikan type aktivitas single/multiple choice, sorting, drag-drop, fill blank, dan true/false memiliki feedback benar/salah/parsial, jawaban dapat diakses keyboard, serta alasan koreksi.
- [ ] Persist jawaban dan skor saat submit; hitung label kualitatif skor akhir dan arahkan ke `goTo('reflection')` setelah selesai.

## Screen 13 - Reflection (`goTo('reflection')`, `ReflectionPage.tsx` - masih stub)

- [ ] Sajikan suasana lab tenang dengan tiga textarea: keterampilan baru, alasan teknik aseptik penting, dan penerapan saat praktikum nyata.
- [ ] Tambahkan prompt tentang kesalahan paling berisiko bila diminta oleh alur refleksi; jaga fokus pada ketelitian, integritas, dan kepatuhan prosedur.
- [ ] Sanitasi input, jangan kirim isi refleksi sebagai analytics, dan beri batas/validasi yang ramah agar respons dapat disimpan offline.
- [ ] Perlakukan refleksi sebagai completion-based, tampilkan apresiasi setelah seluruh respons yang diwajibkan terisi, lalu simpan dan lanjut ke `goTo('completion')`.

## Screen 14 - Completion (`goTo('completion')`, `CompletionPage.tsx` - masih stub)

- [ ] Tampilkan ringkasan progres 100%, skor akhir, label kualitatif, Stage yang selesai, badge/sertifikat sederhana **SteriLab Explorer**, dan pesan penutup.
- [ ] Sediakan aksi **Ulangi Pembelajaran**, **Menu Utama**, serta cetak/simpan sertifikat; aksi ulangi/reset wajib meminta konfirmasi.
- [ ] Pastikan sertifikat dan halaman completion tetap dapat diakses, dicetak, dan tidak bergantung pada audio/animasi.
- [ ] Catat event completion view tanpa data pribadi atau isi refleksi bila analytics opsional diaktifkan.

## QA dan Release

Infrastruktur test yang sudah ada: Playwright (`lab/playwright.config.ts`, `npm run test:e2e`) dengan 6 project viewport — 568×320, 667×375, 1024×768, 1366×768, 1440×900, plus 375×667 khusus portrait-block. Belum ada test runner unit (tidak ada Vitest/Jest di `package.json`), jadi seluruh butir unit-test di bawah masih nol.

- [ ] Unit-test aturan domain/application: validasi tiap Stage, urutan langkah, skor, kondisi selesai, unlock, Evidence Decision, dan persistence tanpa memulai Phaser/browser. Belum ada test runner unit sama sekali. `core/progress/levelProgress.ts` saat ini hanya teruji tidak langsung lewat Playwright — logika unlock-nya murni dan gampang di-unit-test begitu runner-nya dipasang.
- [ ] Uji Phaser khusus untuk input mouse/touch, lifecycle scene, visual feedback, objek, pause/resume saat rotasi, dan event bus.
- [ ] Uji setiap Stage melalui dua jalur: canvas dan kontrol DOM paralel; verifikasi keyboard-only dapat menyelesaikan seluruh Stage.
- [ ] Uji core journey dan refresh pada 568x320, 667x375, 1024x768, 1366x768, dan 1440x900; uji portrait hanya untuk rotate-prompt dan pemulihan state. Kelima viewport landscape sudah terpasang sebagai project Playwright dan journey Splash → Home → Case → Missions sudah diuji utuh di kelimanya, termasuk posisi/proporsi terhadap koordinat Figma, target sentuh, tabrakan antar elemen, dan transisi keluar. Portrait sudah punya `tests/portrait-block.spec.ts`. Belum: journey setelah Missions (Screen-nya belum ada) dan **uji refresh** — saat ini refresh selalu balik ke `splash` karena posisi Screen tidak disimpan.
- [ ] Uji offline setelah first load, service worker/PWA shell, localStorage tidak tersedia, lazy loading Stage, bundle Phaser, dan target Lighthouse mobile >=80 serta LCP <3 detik pada koneksi sekolah representatif.
- [ ] Lakukan audit keyboard focus, screen reader label, aria-live feedback, caption, alt text, kontras, touch target, dan prefers-reduced-motion.
- [ ] Validasi konten bersama guru sejawat dan ahli APHP/mikrobiologi, terutama Stage 1-2 yang perlu storyboard baru serta seluruh nilai/prosedur simulasi.
- [ ] Pastikan tidak ada placeholder, link/asset rusak, console error, Screen buntu, autoplay terblokir yang merusak fungsi, atau data pribadi pada MVP. Masih ada 7 Screen stub yang persis placeholder dan buntu: `briefing`, `guide`, `stage`, `evidence`, `evaluation`, `reflection`, `completion`. Tiga di antaranya — `stage`, `evaluation`, `reflection` — sudah bisa dicapai dari kartu Missions, jadi Analyst bisa masuk ke Screen kosong tanpa jalan kembali.
- [ ] Siapkan teacher guide, privacy notice bila analytics aktif, disclaimer simulated data, build production HTTPS, dan backup repository konten sebelum rilis.

## Referensi Utama

- `docs/prd/02-product-requirements.md` - scope, requirement, acceptance criteria.
- `docs/prd/03-information-architecture.md` - urutan route, layout, dan responsive landscape.
- `docs/prd/05-content-and-storyboard.md` - naskah/visual/audio per Screen.
- `docs/prd/06-learning-interactions.md` - mekanik lima Stage, Evidence Decision, dan Evaluasi.
- `docs/prd/07-technical-spec.md` serta `docs/adr/` - batas arsitektur dan data-driven `LabScene`.
- `docs/raw/PROPOSAL LAB MAYA KODE AG_APHP_5 RISATUL MUNAWAROH_SMKN 1 PACET.pdf` dan `docs/raw/MATERI DAN SOAL STERILAB.docx` - sumber materi dan storyboard awal.
