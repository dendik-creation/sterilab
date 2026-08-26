# Learning Interactions

## Content unit

Setiap Stage/Evaluation item memiliki objective, context, instruction, activity, feedback, optional reflection, dan completion rule. Konten dipisahkan dari kode (Phaser scene config + React component), dan direview ahli. Naskah lengkap per Screen ada di `05-content-and-storyboard.md`.

## Stage 1 - Persiapan APD

Objek: jas lab, sarung tangan, masker, goggles, hair cover, sandal, perhiasan, makanan/minuman. Siswa memilih APD atau drag ke siluet analis di canvas Phaser; kontrol DOM paralel: daftar APD dipilih via keyboard/tap lalu "kenakan". Feedback menjelaskan fungsi APD dan risiko objek terlarang. Selesai jika APD wajib dan distractor dikenali.

## Stage 2 - Area Kerja Aseptik

Aksi: disinfeksi meja, siapkan LAF, tata alat, gunakan spirit/Bunsen jika relevan, cek alkohol 70%, singkirkan benda tak perlu. Canvas Phaser pakai ordering dan object placement; kontrol DOM paralel: daftar langkah diurutkan via keyboard (tombol naik/turun) atau tap-pilih-tempat. Feedback menjelaskan risiko kontaminasi.

## Stage 3 - Pembuatan Media Kultur

Urutan: timbang media → tambah aquades → panaskan/larutkan → homogenkan → bagi media → sterilisasi autoklaf. Canvas Phaser pakai drag-to-order dengan indikator suhu/waktu simulasi (animasi); kontrol DOM paralel: list drag-to-order dengan keyboard reorder. Nilai operasional wajib divalidasi ahli dan tidak boleh diada-adakan (lihat `../../CONTEXT.md` → Simulated Value).

## Stage 4 - Teknik Kerja Aseptik

11 step linear (bukan 3 kategori besar) — keputusan dan rationale di `../adr/0004-stage4-eleven-step-linear-sequence.md`, naskah per step di `05-content-and-storyboard.md` → Stage 4:

1. Cuci tangan
2. Pakai APD
3. Nyalakan LAF + semprot alkohol
4. Nyalakan Bunsen
5. Sterilisasi jarum ose
6. Dinginkan jarum ose
7. Ambil sampel
8. Inokulasi ke media
9. Tutup tabung + label
10. Inkubasi
11. Bersihkan area kerja

Analyst menjalankan step aktif via Hit pada objek/aksi yang sesuai; melakukan aksi di luar urutan memicu feedback correction (bukan hard block) yang menjelaskan risiko kontaminasi dari lompat urutan tanpa visual grafis eksplisit. Kontrol DOM paralel: daftar 11 step bernomor, Analyst memilih/menjalankan step sesuai urutan lewat keyboard/tap — jalur fungsional setara dengan canvas (FR-08). Implementasi: data-driven step config di `LabScene` (lihat `07-technical-spec.md` → Data-driven Stage/step configuration), bukan hardcode per state — menambah/mengubah step berarti mengubah config, bukan menulis scene baru.

## Stage 5 - Pengelolaan Limbah

Objek: Petri dish bekas, sarung tangan, loop/needle, botol media, plastik, kertas, kultur mikroba. Canvas Phaser: drag ke bin berlabel; kontrol DOM paralel: select item lalu pilih bin dari daftar. Feedback menjelaskan pemisahan, benda tajam, dan kultur.

## Evidence branching (Evidence Decision)

Sampel SM-025, Roti Isi Cokelat, asal kegiatan sekolah, analis peserta. Evidence: gambar kultur simulasi, colony count/CFU, kondisi media, catatan pengamatan — seluruhnya DOM (bukan Phaser). Flow: tampilkan evidence → Produk Aman/Produk Tidak Aman → alasan → feedback branch dan skor. Semua nilai bersifat simulasi; threshold harus divalidasi.

## Evaluasi

| Area | Format | Count | Weight |
|---|---|---:|---:|
| Teknik aseptik | MC + ordering | 3 | 25% |
| Media kultur | ordering + fill blank | 3 | 25% |
| Limbah | matching/drag-drop | 3 | 25% |
| Evidence decision | branching | 2 branch | 25% |

Evaluation Screen sepenuhnya DOM (tidak memakai canvas Phaser). Item teknik aseptik direuse langsung dari 11 step Stage 4 (mis. "urutkan 11 langkah teknik aseptik", "identifikasi langkah yang salah/hilang dari urutan yang ditampilkan") — tidak perlu konten baru, hanya konfigurasi ordering/error-detection di atas step data yang sama.

## Feedback dan refleksi

Feedback menyatakan apa yang terjadi, mengapa penting, dan satu koreksi. Gunakan "Belum tepat", bukan bahasa menghakimi. Prompt refleksi: keterampilan baru, pentingnya aseptik, kesalahan paling berisiko, dan penerapan pada praktikum. Refleksi completion-based, bukan right/wrong.
