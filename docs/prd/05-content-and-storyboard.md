# Content and Storyboard

Naskah per layar (Screen), diadaptasi dari storyboard proposal. Penomoran "Scene" proposal tidak dipakai di sini (lihat [`../../CONTEXT.md`](../../CONTEXT.md) → Screen, yang menjelaskan kenapa); tiap layar diberi nama Screen konsisten dengan `03-information-architecture.md`.

## Cover

**Visual**: Laboratorium mikrobiologi pangan modern, dominan putih-biru. Analis berAPD lengkap memakai mikroskop dan laminar air flow. Logo SteriLab di tengah dengan ilustrasi cawan petri, bakteri, tabung reaksi. Tombol "Mulai Menjelajah" di bawah.

**Narasi**: "Selamat datang di SteriLab, laboratorium virtual interaktif yang akan membawamu merasakan pengalaman menjadi seorang analis mikrobiologi pangan. Yuk, mulai petualanganmu!"

**Suara**: SFX mesin laboratorium & klik tombol; musik futuristik ringan; ambience laboratorium.

**Interaksi**: Hover mengubah warna tombol; Hit tombol menuju Screen Case; animasi logo muncul saat show; drag-drop tidak dipakai.

## Case (Briefing Kasus)

**Visual**: Ruang briefing dengan layar monitor menampilkan berita dugaan keracunan makanan; analis menerima sampel uji.

**Narasi**: "Bayangkan terjadi dugaan keracunan makanan setelah beberapa anak SD mengonsumsi produk pangan pada sebuah kegiatan sekolah. Sampel makanan kemudian dikirim ke laboratorium mikrobiologi untuk diteliti lebih lanjut, dan kamu adalah analis laboratorium yang bertugas menangani pengujian tersebut. Tahukah kamu? Satu hasil uji mikrobiologi yang tidak akurat dapat menyebabkan makanan yang berbahaya dinyatakan aman, atau sebaliknya, produk yang sebenarnya aman justru ditarik dari peredaran. Kesalahan sekecil apa pun selama proses pengujian dapat mengubah hasil analisis... Penasaran bagaimana seorang analis laboratorium menghasilkan data yang akurat, valid, dan dapat dipertanggungjawabkan? Yuk, jelajahi SteriLab!"

**Suara**: SFX notifikasi berita; musik dramatis ringan; ambience laboratorium.

**Interaksi**: Narasi muncul bertahap (normal); swipe menggulir narasi bila perlu; Hit tombol "Lanjut Briefing" menuju Missions.

## Missions (Menu Utama)

**Visual**: Dashboard laboratorium virtual, lima kartu menu interaktif: Teknik Kerja Aseptik, Pembuatan Media Kultur, Pengelolaan Limbah, Evaluasi, Refleksi. Progress bar penyelesaian di atas.

**Narasi**: "Selamat datang di dashboard SteriLab. Pilih menu pembelajaran secara berurutan untuk menyelesaikan setiap misi sebagai analis laboratorium mikrobiologi."

**Suara**: SFX klik tombol & efek popup; musik instrumental ringan; ambience laboratorium.

**Interaksi**: Hover memperbesar & mengubah warna kartu; Hit membuka submenu/Stage; show memunculkan progress belajar otomatis.

> **Gap konten**: proposal tidak menyertakan naskah storyboard terpisah untuk Screen Guide (Panduan Alat & K3) maupun Stage 1 (Persiapan APD) dan Stage 2 (Area Kerja Aseptik) — ketiganya hanya disebut di alur interaksi/flowchart, tanpa visual/narasi/SFX rinci. Perlu ditulis oleh tim konten sebelum produksi; jangan diasumsikan dari Stage lain.

## Stage 4 — Teknik Kerja Aseptik

_Disebut "Simulasi Teknik Kerja Aseptik" pada storyboard proposal._

**Visual**: Meja laboratorium dengan Laminar Air Flow, lampu spiritus/Bunsen, jarum ose, cawan petri, tabung reaksi, alkohol 70%, APD. Objek dapat dipilih interaktif.

**Narasi**: "Teknik kerja aseptik merupakan prosedur dasar untuk mencegah kontaminasi selama pengujian mikrobiologi. Pilih dan lakukan setiap langkah sesuai urutan yang benar."

**Suara**: SFX api menyala, klik alat, notifikasi benar/salah; musik instrumental ringan; ambience laboratorium.

**Interaksi**: Hover memperbesar & mengubah warna menu; Hit memilih alat; show memunculkan feedback; drag/drop menempatkan alat sesuai prosedur. Dirender di canvas Phaser dengan kontrol DOM paralel wajib (lihat `06-learning-interactions.md`).

**Alur (6 step linear)**: Stage ini berjalan dalam **6 langkah** — Cuci tangan; Memakai APD; Membersihkan Meja Kerja; Menyalakan Bunsen; Sterilisasi Jarum Ose; Mengambil dan Menginokulasi Kultur — lihat `../adr/0006-stage4-six-step-sequence.md` untuk keputusan dan pemetaannya (ADR-0004 yang menetapkan 11 langkah sudah di-*supersede*).

Sebelas butir di bawah **tetap berlaku sebagai isi**: masing-masing menjelaskan aksi yang terjadi di dalam salah satu dari enam langkah itu, bukan daftar langkahnya sendiri. Yang dilipat: butir 3 dan 11 masuk ke "Membersihkan Meja Kerja", butir 5 dan 6 ke "Sterilisasi Jarum Ose", dan butir 7-10 ke "Mengambil dan Menginokulasi Kultur". Urutan dan visual per aksi:

1. **Cuci tangan** — Analyst mencuci tangan di wastafel; SFX air mengalir; feedback benar/salah durasi & teknik cuci tangan.
2. **Pakai APD** — konfirmasi checklist APD sudah terpasang (bukan minigame pemilihan APD Stage 1 — di sini murni konfirmasi kesiapan sebelum kerja aseptik dimulai).
3. **Nyalakan LAF + semprot alkohol** — Analyst menyalakan Laminar Air Flow lalu menyemprot area kerja dengan alkohol 70%; SFX kipas LAF & semprotan.
4. **Nyalakan Bunsen** — menyalakan lampu spiritus/Bunsen di dalam area kerja LAF; SFX api menyala.
5. **Sterilisasi jarum ose** — jarum ose dipanaskan di api Bunsen hingga membara; SFX pijar logam; animasi warna jarum berubah.
6. **Dinginkan jarum ose** — jarum didinginkan di area steril (dekat api, tidak menyentuh permukaan non-steril) sebelum dipakai; feedback salah jika Analyst langsung memakai jarum panas atau menyentuhkannya ke permukaan luar.
7. **Ambil sampel** — jarum ose diambil dari sumber sampel/kultur; animasi colek sampel.
8. **Inokulasi ke media** — sampel digoreskan ke media kultur (cawan petri/tabung) dengan teknik goresan/streak yang benar.
9. **Tutup tabung + label** — tabung/cawan ditutup kembali dan diberi label (kode sampel, tanggal); mencegah kontaminasi silang.
10. **Inkubasi** — media dimasukkan ke inkubator; indikator suhu/waktu simulasi.
11. **Bersihkan area kerja** — LAF dan meja kerja dibersihkan/didisinfeksi, alat dirapikan, Bunsen dimatikan; menutup siklus aseptik.

Tiap step: Hit untuk memilih/menjalankan aksi step aktif; step di luar urutan ditolak dengan feedback correction (lihat `06-learning-interactions.md` → Stage 4). Enam langkahnya granular secara sengaja dan dapat direuse langsung sebagai item soal Evaluation (urutkan prosedur, deteksi langkah yang salah/hilang) — lihat `06-learning-interactions.md` → Evaluasi. Aksi yang dilipat ke dalam satu langkah tetap punya urutan internal yang bisa divalidasi di dalam langkah itu (mis. semprot sebelum usap; panaskan sebelum dinginkan).

## Stage 3 — Pembuatan Media Kultur

_Disebut "Simulasi Pembuatan Media Kultur" pada storyboard proposal._

**Visual**: Animasi proses: menimbang media, menambahkan aquades, memanaskan, menghomogenkan, membagi media, sterilisasi autoklaf. Indikator suhu dan waktu.

**Narasi**: "Media kultur yang baik menjadi kunci keberhasilan pertumbuhan mikroorganisme. Susun prosedur pembuatan media sesuai standar laboratorium."

**Suara**: SFX timbangan, air dituangkan, autoklaf; musik instrumental ringan; ambience laboratorium.

**Interaksi**: Hover memperbesar & mengubah warna menu; Hit memilih jawaban; show memunculkan feedback otomatis; drag/drop mengurutkan prosedur.

## Stage 5 — Pengelolaan Limbah

_Disebut "Simulasi Pengelolaan Limbah Laboratorium" pada storyboard proposal._

**Visual**: Jenis limbah: cawan petri bekas, sarung tangan, jarum ose, botol media, plastik, kertas, kultur mikroba. Beberapa tempat limbah berwarna berbeda.

**Narasi**: "Tidak semua limbah laboratorium diperlakukan dengan cara yang sama. Kelompokkan setiap limbah sesuai prosedur pengelolaan yang benar."

**Suara**: SFX klik & drop objek; musik instrumental ringan; ambience laboratorium.

**Interaksi**: Hover memperbesar & mengubah warna menu; Hit mengonfirmasi jawaban; show memunculkan penjelasan otomatis; drag/drop memasukkan limbah ke tempat yang sesuai.

## Evidence (Dashboard Hasil Pengujian & Evidence Decision)

**Visual**: Dashboard mirip QC Laboratorium Mikrobiologi. Kiri: info sampel (Nomor Sampel SM-025, Nama Sampel Roti Isi Cokelat, Asal Sampel Kegiatan Sekolah Dasar, Analis Peserta Didik). Tengah: foto cawan petri hasil kultur, ilustrasi koloni mikroba, data CFU, kondisi media, keterangan pengamatan. Kanan: panel keputusan.

**Narasi**: "Seluruh proses pengujian telah selesai. Kini saatnya kamu mengambil keputusan sebagai analis laboratorium. Amati hasil kultur mikroba dan seluruh data pengujian yang tersedia... Ingat, keputusanmu akan berdampak pada keselamatan konsumen sekaligus kredibilitas perusahaan."

**Branching (Evidence Decision)**:
- Pilih **Produk Aman** → "Apa alasanmu?" → pilihan: jumlah koloni masih memenuhi standar / teknik aseptik sudah benar / tidak ditemukan kontaminasi / semua benar. Benar → feedback hijau "Keputusanmu tepat. Data hasil pengujian menunjukkan produk masih memenuhi standar keamanan pangan." Salah → feedback merah "Periksa kembali data hasil pengujian sebelum mengambil keputusan."
- Pilih **Produk Tidak Aman** → "Apa dasar keputusanmu?" → pilihan: jumlah koloni melebihi batas / terjadi kontaminasi / media rusak / semua benar. Sistem memberi umpan balik sesuai jawaban.

**Suara**: SFX bunyi komputer laboratorium, klik tombol, alarm keputusan, feedback benar/salah; musik instrumental investigasi ringan; ambience Quality Control.

**Interaksi**: Hover memperbesar data pengujian; Hit memilih keputusan; swipe berpindah melihat foto kultur/data pengujian; show memunculkan feedback otomatis beserta penjelasan; drag/drop tidak dipakai.

## Evaluation (Evaluasi Interaktif)

**Visual**: Dashboard laboratorium digital dengan ilustrasi monitor, ikon mikrobiologi, progress penyelesaian soal. Kartu soal interaktif dengan indikator skor otomatis. Aktivitas: Multiple Choice, Drag and Drop, Fill in the Blank, True/False.

**Narasi**: "Saatnya membuktikan kemampuanmu sebagai analis laboratorium. Jawablah setiap tantangan dengan cermat untuk memperoleh hasil terbaik."

**Suara**: SFX klik tombol, notifikasi benar/salah, efek skor bertambah; musik instrumental semangat; ambience laboratorium.

**Interaksi**: Hit memilih jawaban; show menampilkan skor & umpan balik otomatis; drag/drop mengelompokkan/mengurutkan prosedur. Screen ini sepenuhnya DOM (tidak memakai canvas Phaser).

## Reflection (Refleksi Pembelajaran)

**Visual**: Analis mengamati hasil pengujian, latar laboratorium tenang. Kartu refleksi dengan ikon lampu ide dan buku catatan digital.

**Prompt refleksi**: Apa keterampilan baru yang kamu pelajari hari ini? Mengapa teknik kerja aseptik sangat penting? Bagaimana kamu akan menerapkannya saat praktikum nyata?

**Narasi**: "Selamat! Kamu telah menyelesaikan seluruh simulasi. Sekarang, luangkan waktu sejenak untuk merefleksikan pengalaman belajarmu. Apa pengetahuan dan keterampilan baru yang kamu peroleh?"

**Suara**: SFX klik, efek centang; musik instrumental lembut; ambience laboratorium yang tenang.

**Interaksi**: Hover efek fokus pada kolom jawaban; Hit mengirim jawaban; show menampilkan apresiasi setelah refleksi selesai.

## Completion (Penutup)

**Visual**: Laboratorium modern, analis membawa hasil pengujian. Sertifikat digital sederhana / badge "SteriLab Explorer", skor akhir, indikator penyelesaian 100%. Tombol: Ulangi Pembelajaran, Menu Utama, Keluar.

**Narasi**: "Selamat! Kamu telah berhasil menyelesaikan seluruh rangkaian pembelajaran di SteriLab. Ketelitian, integritas, dan kepatuhan terhadap prosedur merupakan kunci utama dalam menghasilkan data mikrobiologi yang valid dan dapat dipertanggungjawabkan. Teruslah berlatih agar siap menjadi analis laboratorium profesional yang berkontribusi dalam menjaga keamanan pangan."

**Suara**: SFX tepuk tangan singkat, efek badge berhasil, klik tombol; musik instrumental inspiratif; ambience laboratorium.

**Interaksi**: Hit menuju Menu Utama / Ulangi Pembelajaran / Keluar; swipe menggulir narasi bila perlu; show memunculkan animasi badge & sertifikat digital.
