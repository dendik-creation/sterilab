# Quality Assurance and Roadmap

## Test strategy

Functional: Cover CTA, navigasi Case/Briefing, Guide, Stage gating, semua activity state (canvas DAN kontrol DOM paralel), retry/score, refresh persistence, Evidence Decision branching, Evaluation, Reflection, Completion, reset.

Responsive (landscape only): 568x320, 667x375, 1024x768, 1366x768, 1440x900. Portrait pada tiap lebar di atas hanya diuji untuk memastikan rotate-prompt muncul, bukan layout konten.

Accessibility: core journey keyboard-only termasuk tiap Stage lewat kontrol DOM paralel (bukan canvas); focus order/ring; screen-reader labels untuk elemen DOM dan aria-live untuk feedback Stage; reduced motion (CSS transition dan Phaser tween); caption; touch target 44px termasuk hit-area sprite Phaser.

Content validation: guru sejawat dan ahli APHP/mikrobiologi review istilah, prosedur, safety wording, klasifikasi limbah, evidence simulasi, CFU/threshold, dan alignment kurikulum.

Unit test (tanpa Phaser/browser): validasi Stage, step progression, scoring, completion condition, progress persistence — hidup di layer domain/application (lihat `07-technical-spec.md`). Phaser-specific test: interaction, scene lifecycle, object behavior, input handling. PWA/offline: core journey Cover-Completion diuji tanpa network setelah first load.

## Definition of Done

Fitur cocok dengan token/layout; berjalan di desktop/tablet/phone landscape; setiap Stage punya kontrol DOM paralel yang teruji setara dengan canvas; state tersimpan; loading/error/success/retry/completed tersedia; expert sign-off ada; QA lulus; tidak ada placeholder, broken asset, console error, atau dead-end route; rotate-prompt teruji di semua breakpoint.

## Validation gates

Alpha: internal navigation, interaction (canvas + DOM fallback), copy, rendering, accessibility. Expert validation: guru dan ahli APHP/mikrobiologi. Beta: uji siswa Fase E dan perangkat landscape. Final: perbaikan, optimasi, regression, HTTPS publish, teacher guide.

## Roadmap 8 minggu

| Minggu | Fokus | Output |
|---:|---|---|
| 1 | Analisis/perencanaan | PRD, learning map, flow, content inventory |
| 2 | Konten/aset | copy reviewed, rencana ilustrasi/audio, storyboard lengkap termasuk Stage 1-2 (lihat gap di `05-content-and-storyboard.md`) |
| 3 | Website foundation | shell React/Vite, routes, tokens, orientation lock, layout landscape |
| 4 | Core interaction | Phaser Stage engine (5 Stage), kontrol DOM paralel, sorting, drag-drop fallback, feedback, Stage 4 6-step data-driven config (lihat `07-technical-spec.md` dan ADR-0006) |
| 5 | Assessment/result | Evidence Decision, branching, Evaluation, Reflection |
| 6 | Alpha | expert review dan prioritas perbaikan |
| 7 | Beta | temuan siswa dan issue log |
| 8 | Finalisasi | optimasi bundle Phaser, teacher guide, release checklist |

## Risiko dan mitigasi

| Risiko | Impact | Mitigasi |
|---|---|---|
| Parameter belum tervalidasi | High | expert sign-off sebelum build/release |
| Canvas Phaser tidak accessible ke screen reader | High | kontrol DOM paralel wajib di setiap Stage (lihat ADR-0001), diuji sebagai bagian dari accessibility test |
| Website/bundle Phaser terlalu berat | High | lazy-load per Stage, kompres asset/texture, device test |
| Drag-drop gagal touch | High | tap/keyboard first-class sejak awal, bukan fallback belakangan |
| Simulasi dianggap nasihat nyata | High | disclaimer pendidikan yang jelas |
| Autoplay audio diblokir | Medium | sound optional dan caption |
| Refresh menghapus progres | Medium | versioned persistence dan recovery test |
| Narasi terlalu panjang | Medium | progressive disclosure |
| Orientation lock mengganggu di device tanpa sensor rotasi jelas | Medium | rotate-prompt jelas + izinkan override manual bila device tak melaporkan orientasi |

## Release checklist

- [ ] Production build dan HTTPS berhasil.
- [ ] Direct route dan refresh berhasil, termasuk saat orientationLocked true.
- [ ] Core journey lulus desktop/tablet/phone landscape.
- [ ] Lima Stage dan Evaluation berjalan lewat canvas DAN kontrol DOM paralel.
- [ ] Keyboard/touch fallback lulus di setiap Stage.
- [ ] Rotate-prompt muncul & pulih otomatis di semua breakpoint portrait.
- [ ] Audio optional dan caption tersedia.
- [ ] Expert sign-off tercatat.
- [ ] Privacy notice dan simulated-data disclaimer tersedia.
- [ ] MVP tidak membutuhkan data pribadi siswa.
- [ ] Repository konten dibackup.
