# SteriLab - Task List Implementasi

Dokumen ini adalah pedoman kerja AI/implementor berdasarkan `docs/prd/`, ADR, `CONTEXT.md`, proposal di `docs/raw/`, dan materi/soal sumber. Istilah **Screen** dipakai untuk halaman/rute produk; istilah *scene* hanya dipakai untuk scene internal Phaser. Urutan berikut mengikuti perjalanan Analyst dari awal sampai Completion.

## Snapshot Validasi (29 Agustus 2026)

- Validasi dilakukan terhadap kode aktual pada `lab/src/`, bukan sekadar struktur rute atau komentar kode.
- `npm run build` lulus: TypeScript dan production build Vite berhasil. Vite masih memberi peringatan chunk Phaser berukuran 1.21 MB (328 KB gzip), sehingga target optimasi bundle belum dapat dinyatakan selesai.
- `npm run lint` lulus tanpa temuan.
- Hanya butir checklist yang implementasinya lengkap dan dapat dibuktikan diberi tanda selesai. Halaman selain Cover, kelima Stage, domain/application layer, progres pembelajaran, persistence sesi, PWA, dan pengujian otomatis masih belum selesai.
- Update sesi ini: `HomeScene`/`BootScene` diverifikasi pixel-match terhadap Figma "Sterilab-APHP" (node `9:500`/`9:501`/`2:3`) lewat `get_design_context`; ditemukan dan diperbaiki bug nyata — portrait dip sebelumnya men-destroy game Phaser (`RouterProvider` di-unmount total oleh `App.tsx`) alih-alih pause, dan default suara tersimpan `true` padahal PRD mensyaratkan default mati. Lihat perubahan di `App.tsx`, `PhaserGame.ts`, `audioSettings.ts`, `orientationGate.ts` (baru), `core/a11y/motion.ts` (baru).

## Aturan Lintas Screen

- [x] Gunakan React + Vite + TypeScript untuk app shell dan seluruh Screen non-simulasi; gunakan Phaser 3 hanya pada lima Stage praktik.
- [ ] Pisahkan aturan pembelajaran, validasi, skor, progres, dan persistence pada layer `domain`/`application`; layer tersebut tidak boleh mengimpor React, Phaser, DOM, atau API browser.
- [x] Komunikasikan React dan Phaser melalui typed command/event bus (`core/events/eventBus.ts`, dipakai `LabScene`/`ResultScene`). React tidak boleh memanipulasi game object Phaser secara langsung, dan Phaser tidak boleh mencari/memanipulasi DOM secara langsung — diverifikasi tidak ada pelanggaran di kode saat ini.
- [ ] Implementasikan lifecycle Phaser `BootScene -> PreloadScene -> MainMenuScene -> LabScene -> ResultScene`; gunakan satu `LabScene` data-driven untuk semua Stage, bukan scene per Stage atau per langkah. (Scene terdaftar dan `MainMenu -> Lab` sudah tersambung; `Lab -> Result` dan `ExperimentRunner` data-driven belum ada — menyusul bersama konten Stage.)
- [ ] Terapkan visual Quality Control laboratory sesuai token desain: teal sebagai aksi, amber untuk perhatian, warna sukses/bahaya selalu disertai teks dan ikon, serta font Inter/Manrope/system sans-serif.
- [x] Buat app landscape-only. Saat portrait, tampilkan rotate-prompt full-screen, hentikan input dan audio, pause Phaser tanpa mereset progres, lalu pulihkan otomatis saat landscape. (Sebelumnya `App.tsx` meng-unmount `RouterProvider` saat portrait sehingga game Phaser malah di-destroy, bukan di-pause — sudah diperbaiki: `RotatePrompt` kini hanya overlay, dan `PhaserGame.ts` men-pause semua scene + mute audio + `input.enabled = false` lewat `core/orientation/orientationGate.ts`, lalu pulih otomatis saat landscape.)
- [ ] Penuhi breakpoint landscape: phone 568-767px, tablet 768-1023px, desktop >=1024px; jangan merender layout konten portrait.
- [ ] Sediakan top bar konsisten: identitas SteriLab, progress, bantuan/glosarium, dan kontrol suara dengan kondisi suara default mati. (Top bar itu sendiri belum ada; state suara default mati sendiri sudah dibetulkan di `audioSettings.ts` — sebelumnya default `true`.)
- [ ] Pastikan setiap Screen memiliki navigasi lanjut, kembali atau Missions yang tidak menghasilkan dead end; browser back tidak boleh menghapus state.
- [ ] Terapkan target WCAG 2.2 AA: heading/landmark benar, focus visible, target sentuh minimal 44x44px, kontras memadai, reduced motion, alt text, caption/transcript, dan live region untuk feedback.
- [ ] Audio hanya diputar setelah interaksi pengguna; sediakan mute, caption/transcript, dan fallback jika audio gagal dimuat.
- [ ] Tampilkan disclaimer bahwa seluruh CFU, threshold, suhu, waktu, dan data sampel adalah **nilai simulasi**, bukan standar mikrobiologi dunia nyata.
- [ ] Minta sign-off ahli APHP/mikrobiologi terhadap prosedur, klasifikasi limbah, kata-kata safety, CFU/threshold, suhu, dan waktu sebelum release.
- [ ] Simpan session versioned ke `localStorage` setelah perubahan rute, jawaban, Stage selesai, Evidence Decision, evaluasi, dan refleksi; jika storage tidak tersedia, gunakan state in-memory dan tampilkan peringatan.
- [ ] Implementasikan reset dengan modal konfirmasi, auto-save/resume/retry, dan status Stage `locked`, `available`, `in_progress`, `completed`.
- [ ] Jadikan skor aktivitas dan kredit retry configurable; refleksi completion-based dan tidak dihitung sebagai jawaban benar/salah.
- [ ] Lazy-load Phaser dan aset tiap Stage ketika Stage dibuka; kompres gambar/audio dan siapkan PWA offline shell agar perjalanan inti bisa berjalan setelah load pertama.

## Screen 1 - Splash & Cover (`/`)
- [x] splash scene dengan loading progressbar asset (`BootScene`: preload asli dengan `this.load.*`, progress bar + label `X% Memuat Konten`, tidak lanjut sebelum asset benar-benar termuat — diverifikasi cocok pixel-akurat dengan Figma node `9:500` "Loading").
- [ ] Buat hero split landscape dengan copy SteriLab, hook kasus, CTA **Mulai Menjelajah**, Petunjuk, Profil, dan kontrol audio. Catatan: frame Figma final "Home" (node `2:3`) tidak menyertakan tombol Petunjuk maupun Profil — hanya Mulai Menjelajah, Keluar, dan kontrol suara. Butir ini perlu konfirmasi PM/desain: apakah Petunjuk/Profil masih diperlukan (berarti frame Figma perlu ditambah) atau baris ini disesuaikan mengikuti Figma final.
- [x] Gunakan visual laboratorium mikrobiologi pangan modern: analis ber-APD, mikroskop, Laminar Air Flow, logo/cawan petri/tabung reaksi (`splash_bg.png`/`home_bg.png`, diverifikasi cocok dengan Figma).
- [ ] Tampilkan narasi pembuka dari storyboard dan ambience laboratorium setelah pengguna berinteraksi. Narasi pembuka sudah tampil (bubble `greeting.png` di Home berisi naskah storyboard persis dari `05-content-and-storyboard.md` > Cover); ambience laboratorium belum — belum ada aset audio ambience di `lab/assets/sounds/` untuk dimuat.
- [x] Implementasikan animasi logo/elemen foreground staggered; background full-bleed tetap statis dan tidak ikut bubble transition.
- [x] Tambahkan hover dan press feedback pada CTA/ikon sesuai token motion; dukung keyboard dan touch. (Hover/press sudah ada; sesi ini menambah dukungan keyboard — Tab/Shift+Tab memindah focus ring di antara tombol, Enter/Space menjalankan aksi yang sama dengan pointerdown. Tween hover/bubble juga kini menghormati `prefers-reduced-motion`.)
- [x] Arahkan CTA utama ke `/case`; pastikan aset Cover tidak memuat aset Stage resolusi penuh.

## Screen 2 - Case: Briefing Kasus (`/case`)

- [ ] Sajikan dugaan keracunan pangan pada kegiatan sekolah, penerimaan sampel, peran Analyst, serta konsekuensi hasil uji yang tidak akurat.
- [ ] Tampilkan ilustrasi ruang briefing dan monitor berita; sediakan narasi bertahap, caption/transcript, dan area narasi yang dapat discroll bila diperlukan.
- [ ] Tambahkan SFX notifikasi berita dan ambience opsional setelah opt-in suara.
- [ ] Sediakan CTA **Lanjut Briefing** menuju `/briefing` tanpa memaksa narasi/audio selesai.

## Screen 3 - Briefing Lead QC (`/briefing`)

- [ ] Tulis dan tampilkan briefing Lead QC yang menjelaskan tujuan investigasi, prosedur, nilai ketelitian/integritas, dan pentingnya teknik aseptik.
- [ ] Perjelas misi: siapkan diri dan area kerja, buat media, lakukan inokulasi aseptik, kelola limbah, lalu ambil Evidence Decision.
- [ ] Sediakan caption/narasi opsional, CTA **Lanjut Investigasi**, dan jalur kembali yang mempertahankan progres.
- [ ] Arahkan CTA ke `/guide` agar panduan alat/K3 dipelajari sebelum Stage.

## Screen 4 - Guide: Alat, APD, K3, dan Limbah (`/guide`)

- [ ] Bangun grid kartu yang dapat difilter untuk alat laboratorium, APD, aturan K3, simbol/jenis limbah, dan penggunaan tiap item pada Stage.
- [ ] Setiap kartu harus memiliki visual, nama, fungsi, safety note, stage usage, alt text, serta tooltip/glosarium yang dapat diakses keyboard.
- [ ] Masukkan minimal LAF, Bunsen/spiritus, jarum ose, cawan petri, tabung reaksi, alkohol 70%, autoklaf, bin limbah, jas lab, sarung tangan, masker, goggles, dan hair cover.
- [ ] Pastikan konten tidak menyajikan parameter operasional simulasi sebagai prosedur standar tervalidasi.
- [ ] Sediakan CTA ke `/missions` setelah Analyst memahami panduan.

## Screen 5 - Missions (`/missions`)

- [ ] Tampilkan dashboard lab dengan progress keseluruhan, stepper Stage, dan kartu Stage bernomor berisi tujuan, estimasi durasi, status, serta CTA.
- [ ] Urutkan unlock: Stage 1 APD -> Stage 2 Area Kerja Aseptik -> Stage 3 Media Kultur -> Stage 4 Teknik Kerja Aseptik -> Stage 5 Limbah -> Evidence -> Evaluation -> Reflection -> Completion.
- [ ] Izinkan Stage yang completed dibuka kembali; Stage yang belum eligible harus locked dengan alasan yang jelas, bukan sekadar warna abu-abu.
- [ ] Sinkronkan status kartu dengan persistence dan tampilkan resume untuk Stage yang `in_progress`.
- [ ] Pastikan tampilan mission grid responsif: desktop grid, tablet dua kolom, dan phone landscape dengan stepper horizontal serta CTA sticky bila diperlukan.

## Screen 6 - Stage 1: Persiapan APD (`/missions/apd`)

- [ ] Author storyboard yang belum ada di proposal: visual ruang persiapan, narasi singkat tujuan APD, feedback safety, SFX, dan acceptance criteria konten.
- [ ] Konfigurasikan Stage data-driven dengan objek jas lab, sarung tangan, masker, goggles, hair cover, sandal, perhiasan, serta makanan/minuman.
- [ ] Buat canvas Phaser yang memungkinkan Analyst memilih APD dan mengenakannya pada siluet analis; beri selected state dan hit-area minimal 44px.
- [ ] Buat kontrol DOM paralel yang fungsional setara: pilih item dengan keyboard/tap lalu jalankan aksi **Kenakan**; semua aksi harus mengirim completion event yang sama dengan canvas.
- [ ] Validasi bahwa APD wajib dipakai dan distractor/objek terlarang dikenali; jangan mendasarkan validasi pada posisi sprite.
- [ ] Beri feedback "Belum tepat" yang menjelaskan fungsi APD atau risiko objek terlarang, retry yang aman, skor, dan CTA Stage berikutnya.

## Screen 7 - Stage 2: Area Kerja Aseptik (`/missions/area-aseptik`)

- [ ] Author storyboard yang belum ada di proposal: visual meja kerja, narasi, objek, urutan aman, feedback risiko kontaminasi, SFX, dan acceptance criteria konten.
- [ ] Konfigurasikan urutan: disinfeksi meja, siapkan LAF, tata alat, gunakan Bunsen/spiritus bila relevan, cek alkohol 70%, lalu singkirkan benda yang tidak perlu.
- [ ] Implementasikan canvas Phaser untuk ordering dan penempatan objek pada area kerja.
- [ ] Implementasikan kontrol DOM paralel: urutkan langkah memakai tombol naik/turun keyboard atau tap-pilih-tempat; jalur ini harus dapat menyelesaikan Stage sepenuhnya.
- [ ] Validasi urutan/penempatan lewat aturan domain dan berikan koreksi yang mengaitkan kesalahan dengan risiko kontaminasi.
- [ ] Tambahkan state instruksi, progres langkah, retry, skor, completed, serta CTA ke Stage 3.

## Screen 8 - Stage 3: Pembuatan Media Kultur (`/missions/media-kultur`)

- [ ] Konfigurasikan urutan data-driven: timbang media -> tambah aquades -> panaskan/larutkan -> homogenkan -> bagi media -> sterilisasi autoklaf.
- [ ] Buat canvas animasi proses dengan indikator suhu/waktu yang jelas bertanda simulasi, tanpa membuat angka operasional sebelum divalidasi ahli.
- [ ] Implementasikan drag-to-order/tap selection pada canvas dengan feedback otomatis per jawaban.
- [ ] Implementasikan daftar DOM yang dapat di-reorder dengan keyboard dan touch; hasilnya harus memanggil validasi dan completion event yang sama.
- [ ] Sajikan narasi mengenai pentingnya media kultur, SFX timbangan/air/autoklaf opsional, caption, dan reduced-motion fallback.
- [ ] Simpan attempt, skor, status selesai, dan lakukan unlock Stage 4 setelah urutan valid.

## Screen 9 - Stage 4: Teknik Kerja Aseptik (`/missions/teknik-aseptik`)

- [ ] Buat config Stage 4 berisi tepat 11 langkah linear, bukan tiga kategori besar: cuci tangan; pakai APD; nyalakan LAF + semprot alkohol; nyalakan Bunsen; sterilisasi jarum ose; dinginkan jarum ose; ambil sampel; inokulasi ke media; tutup tabung + label; inkubasi; bersihkan area kerja.
- [ ] Gunakan satu `LabScene` dan `ExperimentRunner`; penambahan/perubahan langkah harus dilakukan pada data config, bukan membuat scene/state hardcoded baru.
- [ ] Bangun workspace Phaser berisi LAF, Bunsen/spiritus, jarum ose, media/cawan/tabung, alkohol 70%, APD, inkubator, dan objek pembersihan.
- [ ] Implementasikan aksi visual sesuai setiap langkah: wastafel, checklist APD, LAF/semprotan, api, jarum membara, pendinginan steril, ambil sampel, streak inokulasi, label, inkubasi, serta penutupan/pembersihan area.
- [ ] Tolak aksi di luar urutan dengan correction feedback yang menjelaskan risiko kontaminasi tetapi memungkinkan Analyst memperbaiki dan melanjutkan.
- [ ] Pastikan kondisi khusus tervalidasi: jarum tidak langsung dipakai saat panas dan tidak menyentuh permukaan non-steril ketika pendinginan.
- [ ] Buat kontrol DOM paralel berupa daftar 11 langkah bernomor dengan aksi pilih/jalankan via keyboard atau tap; kontrol ini harus menyelesaikan Stage tanpa menyentuh canvas.
- [ ] Gunakan daftar 11 langkah yang sama sebagai sumber data untuk soal ordering dan error-detection pada Evaluation.
- [ ] Tambahkan narasi, SFX terkontrol, caption, feedback, retry/score, persistence, dan unlock Stage 5.

## Screen 10 - Stage 5: Pengelolaan Limbah (`/missions/limbah`)

- [ ] Konfigurasikan objek: cawan petri bekas, sarung tangan, loop/jarum, botol media, plastik, kertas, dan kultur mikroba, beserta kategori bin dan metode penanganannya.
- [ ] Validasi seluruh klasifikasi bin/metode dengan ahli APHP/mikrobiologi sebelum konten dikunci.
- [ ] Buat canvas Phaser drag-to-bin dengan bin berlabel, bukan hanya dibedakan warna.
- [ ] Buat kontrol DOM paralel: pilih item lalu pilih bin dari daftar melalui keyboard/tap; kirim event validasi/completion yang sama dengan jalur canvas.
- [ ] Beri feedback edukatif tentang pemisahan limbah, benda tajam, dan kultur mikroba; gunakan copy tidak menghakimi dan retry aman.
- [ ] Simpan skor/completion dan buka `/evidence` hanya setelah lima Stage selesai.

## Screen 11 - Evidence: Dashboard Hasil dan Evidence Decision (`/evidence`)

- [ ] Buat layout evidence tiga kolom landscape: fakta sampel di kiri, bukti kultur di tengah, dan panel keputusan di kanan; pada tablet panel keputusan boleh turun setelah bukti.
- [ ] Tampilkan data simulasi SM-025: Roti Isi Cokelat, asal kegiatan sekolah dasar, Analyst peserta didik, foto/ilustrasi kultur, koloni/CFU, kondisi media, dan catatan pengamatan.
- [ ] Letakkan disclaimer nilai simulasi pada data dan jangan tetapkan CFU/threshold final sebelum sign-off ahli.
- [ ] Pastikan seluruh evidence dapat diperiksa sebelum tombol **Produk Aman** atau **Produk Tidak Aman** tersedia/dikirim.
- [ ] Setelah memilih **Produk Aman**, tampilkan pertanyaan alasan dengan opsi jumlah koloni memenuhi standar, teknik aseptik benar, tidak ada kontaminasi, atau semua benar; implementasikan feedback branch-specific.
- [ ] Setelah memilih **Produk Tidak Aman**, tampilkan pertanyaan dasar keputusan dengan opsi jumlah koloni melebihi batas, terjadi kontaminasi, media rusak, atau semua benar; implementasikan feedback branch-specific.
- [ ] Simpan keputusan, alasan, attempt, dan skor; berikan penjelasan ilmiah yang sesuai branch serta CTA ke `/evaluation`.

## Screen 12 - Evaluation (`/evaluation`)

- [ ] Implementasikan Evaluation sepenuhnya sebagai DOM, satu kartu soal per langkah dengan counter, progress, submit, feedback, retry/next, dan skor otomatis.
- [ ] Author/configure 3 item teknik aseptik (MC + ordering), termasuk reuse data 11 langkah Stage 4 untuk mengurutkan prosedur dan mendeteksi langkah salah/hilang.
- [ ] Author/configure 3 item media kultur (ordering + fill in the blank).
- [ ] Author/configure 3 item limbah (matching/drag-drop yang juga memiliki alternatif keyboard/tap).
- [ ] Sertakan Evidence Decision sebagai area evaluasi branching dengan dua branch, sehingga bobot keseluruhan mengikuti 25% teknik aseptik, 25% media kultur, 25% limbah, 25% evidence.
- [ ] Pastikan type aktivitas single/multiple choice, sorting, drag-drop, fill blank, dan true/false memiliki feedback benar/salah/parsial, jawaban dapat diakses keyboard, serta alasan koreksi.
- [ ] Persist jawaban dan skor saat submit; hitung label kualitatif skor akhir dan arahkan ke `/reflection` setelah selesai.

## Screen 13 - Reflection (`/reflection`)

- [ ] Sajikan suasana lab tenang dengan tiga textarea: keterampilan baru, alasan teknik aseptik penting, dan penerapan saat praktikum nyata.
- [ ] Tambahkan prompt tentang kesalahan paling berisiko bila diminta oleh alur refleksi; jaga fokus pada ketelitian, integritas, dan kepatuhan prosedur.
- [ ] Sanitasi input, jangan kirim isi refleksi sebagai analytics, dan beri batas/validasi yang ramah agar respons dapat disimpan offline.
- [ ] Perlakukan refleksi sebagai completion-based, tampilkan apresiasi setelah seluruh respons yang diwajibkan terisi, lalu simpan dan lanjut ke `/completion`.

## Screen 14 - Completion (`/completion`)

- [ ] Tampilkan ringkasan progres 100%, skor akhir, label kualitatif, Stage yang selesai, badge/sertifikat sederhana **SteriLab Explorer**, dan pesan penutup.
- [ ] Sediakan aksi **Ulangi Pembelajaran**, **Menu Utama**, serta cetak/simpan sertifikat; aksi ulangi/reset wajib meminta konfirmasi.
- [ ] Pastikan sertifikat dan halaman completion tetap dapat diakses, dicetak, dan tidak bergantung pada audio/animasi.
- [ ] Catat event completion view tanpa data pribadi atau isi refleksi bila analytics opsional diaktifkan.

## QA dan Release

- [ ] Unit-test aturan domain/application: validasi tiap Stage, urutan langkah, skor, kondisi selesai, unlock, Evidence Decision, dan persistence tanpa memulai Phaser/browser.
- [ ] Uji Phaser khusus untuk input mouse/touch, lifecycle scene, visual feedback, objek, pause/resume saat rotasi, dan event bus.
- [ ] Uji setiap Stage melalui dua jalur: canvas dan kontrol DOM paralel; verifikasi keyboard-only dapat menyelesaikan seluruh Stage.
- [ ] Uji core journey dan refresh pada 568x320, 667x375, 1024x768, 1366x768, dan 1440x900; uji portrait hanya untuk rotate-prompt dan pemulihan state.
- [ ] Uji offline setelah first load, service worker/PWA shell, localStorage tidak tersedia, lazy loading Stage, bundle Phaser, dan target Lighthouse mobile >=80 serta LCP <3 detik pada koneksi sekolah representatif.
- [ ] Lakukan audit keyboard focus, screen reader label, aria-live feedback, caption, alt text, kontras, touch target, dan prefers-reduced-motion.
- [ ] Validasi konten bersama guru sejawat dan ahli APHP/mikrobiologi, terutama Stage 1-2 yang perlu storyboard baru serta seluruh nilai/prosedur simulasi.
- [ ] Pastikan tidak ada placeholder, link/asset rusak, console error, rute buntu, autoplay terblokir yang merusak fungsi, atau data pribadi pada MVP.
- [ ] Siapkan teacher guide, privacy notice bila analytics aktif, disclaimer simulated data, build production HTTPS, dan backup repository konten sebelum rilis.

## Referensi Utama

- `docs/prd/02-product-requirements.md` - scope, requirement, acceptance criteria.
- `docs/prd/03-information-architecture.md` - urutan route, layout, dan responsive landscape.
- `docs/prd/05-content-and-storyboard.md` - naskah/visual/audio per Screen.
- `docs/prd/06-learning-interactions.md` - mekanik lima Stage, Evidence Decision, dan Evaluasi.
- `docs/prd/07-technical-spec.md` serta `docs/adr/` - batas arsitektur dan data-driven `LabScene`.
- `docs/raw/PROPOSAL LAB MAYA KODE AG_APHP_5 RISATUL MUNAWAROH_SMKN 1 PACET.pdf` dan `docs/raw/MATERI DAN SOAL STERILAB.docx` - sumber materi dan storyboard awal.
