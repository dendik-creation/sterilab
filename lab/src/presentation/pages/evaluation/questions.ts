export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
}

export interface Question {
  id: number;
  prompt: string;
  options: QuestionOption[];
  correctKey: QuestionOption['key'];
}

// Full replacement set the user supplied in-session (10 soal pilihan ganda,
// A-E, level kognitif C3-C5) - overrides every "Soal N" text in the Figma
// mock (node 314:2030's 4-option A-D layout was only a placeholder), so the
// answer grid renders 5 rows per soal instead of the mock's 2x2 + a spare.
export const QUESTIONS: Question[] = [
  {
    id: 1,
    prompt:
      'Sebelum memulai praktikum mikrobiologi, seorang siswa akan menyiapkan meja kerja. Tindakan yang paling tepat untuk menerapkan teknik aseptik adalah ....',
    options: [
      { key: 'A', text: 'Membasahi meja dengan akuades' },
      { key: 'B', text: 'Membersihkan meja menggunakan alkohol 70%' },
      { key: 'C', text: 'Menutup meja dengan kertas tanpa membersihkannya' },
      { key: 'D', text: 'Menyemprot meja dengan parfum' },
      { key: 'E', text: 'Membiarkan meja dalam keadaan terbuka' },
    ],
    correctKey: 'B',
  },
  {
    id: 2,
    prompt:
      'Pada saat akan memindahkan kultur mikroba menggunakan jarum Ose, tindakan yang harus dilakukan siswa adalah ....',
    options: [
      { key: 'A', text: 'Memasukkan jarum Ose ke dalam akuades' },
      { key: 'B', text: 'Memijarkan jarum Ose hingga membara sebelum dan sesudah digunakan' },
      { key: 'C', text: 'Membersihkan jarum Ose dengan tisu kering' },
      { key: 'D', text: 'Meletakkan jarum Ose di atas meja kerja' },
      { key: 'E', text: 'Merendam jarum Ose dalam media kultur' },
    ],
    correctKey: 'B',
  },
  {
    id: 3,
    prompt:
      'Seorang siswa akan membuat media kultur padat untuk pertumbuhan mikroorganisme. Berdasarkan komponen media, bahan yang berfungsi sebagai agen pemadat adalah ....',
    options: [
      { key: 'A', text: 'Pepton' },
      { key: 'B', text: 'NaCl' },
      { key: 'C', text: 'Sukrosa' },
      { key: 'D', text: 'Agar-agar' },
      { key: 'E', text: 'Akuades' },
    ],
    correctKey: 'D',
  },
  {
    id: 4,
    prompt:
      'Setelah bahan-bahan media kultur ditimbang, siswa melarutkannya dengan akuades dan memanaskannya sampai larutan tampak homogen. Tahapan berikutnya yang tepat adalah ....',
    options: [
      { key: 'A', text: 'Langsung membuang media' },
      { key: 'B', text: 'Mengatur pH media sesuai kebutuhan mikroorganisme' },
      { key: 'C', text: 'Membuka wadah media selama 24 jam' },
      { key: 'D', text: 'Mencampurkan media dengan limbah kultur' },
      { key: 'E', text: 'Menyimpan media tanpa sterilisasi' },
    ],
    correctKey: 'B',
  },
  {
    id: 5,
    prompt:
      'Dalam suatu praktikum, media kultur yang dibuat memiliki pH 5,2, sedangkan mikroorganisme yang akan ditumbuhkan membutuhkan pH sekitar 6,8-7,2. Jika media tetap digunakan, kemungkinan yang terjadi adalah ....',
    options: [
      { key: 'A', text: 'Pertumbuhan mikroorganisme dapat terganggu' },
      { key: 'B', text: 'Mikroorganisme pasti tumbuh lebih cepat' },
      { key: 'C', text: 'Media menjadi otomatis steril' },
      { key: 'D', text: 'Media tidak dapat mengandung nutrisi' },
      { key: 'E', text: 'Mikroorganisme akan mengubah media menjadi padat' },
    ],
    correctKey: 'A',
  },
  {
    id: 6,
    prompt:
      'Seorang siswa membuka cawan petri terlalu lebar ketika melakukan inokulasi. Beberapa saat kemudian ditemukan koloni mikroorganisme yang tidak sesuai dengan kultur awal. Penyebab yang paling mungkin adalah ....',
    options: [
      { key: 'A', text: 'Media kekurangan agar' },
      { key: 'B', text: 'Terjadi kontaminasi dari lingkungan' },
      { key: 'C', text: 'Media terlalu banyak mengandung nutrisi' },
      { key: 'D', text: 'Suhu ruangan terlalu rendah' },
      { key: 'E', text: 'Cawan petri terlalu bersih' },
    ],
    correctKey: 'B',
  },
  {
    id: 7,
    prompt:
      'Perhatikan kegiatan berikut:\n1. Membersihkan meja dengan alkohol 70%.\n2. Menggunakan jas laboratorium dan sarung tangan.\n3. Membuka cawan petri terlalu lebar.\n4. Memijarkan jarum Ose sebelum digunakan.\nKegiatan yang dapat meningkatkan risiko kontaminasi adalah ....',
    options: [
      { key: 'A', text: '1' },
      { key: 'B', text: '2' },
      { key: 'C', text: '3' },
      { key: 'D', text: '4' },
      { key: 'E', text: '1 dan 4' },
    ],
    correctKey: 'C',
  },
  {
    id: 8,
    prompt:
      'Setelah praktikum selesai, seorang siswa menemukan cawan petri yang masih berisi sisa kultur mikroba. Ia berencana membuangnya langsung ke tempat sampah umum. Berdasarkan prinsip keselamatan laboratorium, keputusan tersebut ....',
    options: [
      { key: 'A', text: 'Tepat karena praktikum telah selesai' },
      { key: 'B', text: 'Tepat jika cawan petri ditutup' },
      { key: 'C', text: 'Tidak tepat karena kultur harus didekontaminasi terlebih dahulu' },
      { key: 'D', text: 'Tepat karena mikroba akan mati dengan sendirinya' },
      { key: 'E', text: 'Tidak tepat hanya jika cawan petri pecah' },
    ],
    correctKey: 'C',
  },
  {
    id: 9,
    prompt:
      'Laboratorium menghasilkan limbah cair yang masih mengandung mikroorganisme. Seorang siswa mengusulkan agar limbah tersebut langsung dibuang ke saluran air. Evaluasi yang paling tepat terhadap usulan tersebut adalah ....',
    options: [
      { key: 'A', text: 'Setuju, karena limbah berbentuk cair tidak berbahaya' },
      { key: 'B', text: 'Setuju, karena mikroorganisme akan mati di saluran air' },
      { key: 'C', text: 'Tidak setuju, karena limbah perlu didekontaminasi atau diolah terlebih dahulu' },
      { key: 'D', text: 'Setuju, jika limbah tidak berwarna' },
      { key: 'E', text: 'Tidak setuju hanya jika limbah berbau' },
    ],
    correctKey: 'C',
  },
  {
    id: 10,
    prompt:
      'Guru mengamati prosedur praktikum seorang siswa. Siswa tersebut sudah menggunakan jas laboratorium dan membersihkan meja dengan alkohol 70%, tetapi ia tidak mensterilkan jarum Ose setelah selesai digunakan. Penilaian yang paling tepat adalah ....',
    options: [
      { key: 'A', text: 'Prosedur sudah sepenuhnya benar' },
      { key: 'B', text: 'Prosedur kurang tepat karena alat harus disterilkan setelah digunakan' },
      { key: 'C', text: 'Prosedur benar karena jarum Ose hanya perlu disterilkan sebelum digunakan' },
      { key: 'D', text: 'Prosedur benar jika kultur tidak terlihat keruh' },
      { key: 'E', text: 'Prosedur tidak masalah selama menggunakan sarung tangan' },
    ],
    correctKey: 'B',
  },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;
export const POINTS_PER_QUESTION = 10;
export const MAX_SCORE = TOTAL_QUESTIONS * POINTS_PER_QUESTION;

// "Random soal yang sudah ada, tidak berurutan" - a fresh shuffle per
// attempt (called once, when the Analyst clicks "Mulai Evaluasi"), not on
// every render. Fisher-Yates so every ordering is equally likely.
export function shuffledQuestions(): Question[] {
  const copy = [...QUESTIONS];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
