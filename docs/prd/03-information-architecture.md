# Information Architecture and Layout

## Sitemap

SteriLab → Cover → Case → Briefing Lead QC → Guide (Alat, APD/K3, Limbah) → Missions → Stage 1 APD → Stage 2 Area Aseptik → Stage 3 Media Kultur → Stage 4 Teknik Aseptik → Stage 5 Limbah → Evidence → Evaluation → Reflection → Completion.

## Orientation lock

Aplikasi landscape-only di seluruh Screen (lihat `../adr/0002-landscape-only-orientation-lock.md`). Saat perangkat portrait: tampilkan overlay rotate-prompt penuh layar (ikon putar perangkat + pesan singkat), blokir interaksi & audio, deteksi via media query orientasi, dan pulih otomatis begitu perangkat kembali landscape tanpa reset progres.

## Layout tokens

Max width 1600px (landscape desktop lebar). Padding desktop 40px, tablet landscape 24px, phone landscape 16px. Grid desktop 12 kolom/24px gutter, tablet landscape 8/20px, phone landscape 4/16px. Narrative/quiz max width 680-760px.

## Responsive (landscape widths only)

Desktop >=1024 (landscape): top bar persisten; Stage workspace canvas 2/3 + instruction panel 1/3; Evidence: sample facts kiri, culture evidence tengah, decision panel kanan; mission grid.

Tablet landscape 768-1023: top bar compact; two-column 60/40; decision panel dapat turun di bawah evidence; mission dua kolom.

Phone landscape 568-767: single scroll region dengan sticky primary action; horizontal Stage stepper; lab object dua kolom; kontrol DOM paralel (list pilih-lalu-tempatkan) jadi jalur utama di lebar ini, bukan sekadar fallback.

Portrait (semua lebar): tidak dirender — tampilkan rotate-prompt (lihat di atas).

## Screen specification

### Cover

Split hero landscape: visual laboratorium kanan, title dan CTA kiri. Logo, descriptor, case hook, Mulai Menjelajah, Petunjuk, Profil, sound off default.

### Case / Briefing Lead QC

Surface dark-blue, case label, narasi, callout "apa yang dipertaruhkan?", optional narration/caption, tombol Lanjut Briefing / Lanjut Investigasi.

### Guide

Filterable card grid. Kartu berisi visual, nama, fungsi, safety note, dan Stage usage.

### Missions

Header progress dan Stage stepper. Kartu menampilkan nomor, objective, durasi, status, action. Stage completed tetap dapat dibuka.

### Stage (canvas + DOM)

Top bar → Stage workspace 2/3 (Phaser canvas) dan instruction panel 1/3 (DOM) → status/retry/next. Instruction panel selalu memuat kontrol DOM paralel yang setara secara fungsional dengan interaksi canvas — lihat FR-08 di `02-product-requirements.md` dan mekanik per Stage di `06-learning-interactions.md`.

### Evidence

Sample facts | culture evidence | decision panel, tiga kolom landscape. CTA jelas: Produk Aman dan Produk Tidak Aman.

### Evaluation, Reflection, Completion

Evaluation: satu question card dengan counter. Reflection: tiga prompt textarea. Completion: memusatkan skor, Stage selesai, badge, pesan, ulangi, menu, print/save.

## Navigation

Journey linear, tetapi Stage selesai revisitable. Browser back tidak boleh menghapus state. Setiap halaman punya jalan jelas ke Missions atau step sebelumnya.
