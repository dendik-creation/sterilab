import { useVoiceOver } from '../../core/audio/voiceOver';

export function CompletionPage() {
  useVoiceOver('closing');
  return (
    <main>
      <h1>Completion</h1>
    </main>
  );
}
