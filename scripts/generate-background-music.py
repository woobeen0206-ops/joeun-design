"""Generate an original, light classical-style piano waltz (no sampled music)."""
import array
import math
from pathlib import Path
import wave

RATE = 32000
BEAT = 60 / 112
# Eight-bar phrases, with a contrasting middle phrase and a returning cadence.
MELODY = [
    [76, 79, 77, 76, 74, 72], [74, 77, 76, 74, 71, 67],
    [72, 76, 79, 81, 79, 76], [77, 76, 74, 72, 71, 74],
    [76, 79, 84, 83, 81, 79], [81, 79, 77, 76, 74, 77],
    [76, 74, 72, 71, 74, 71], [72, None, 76, 79, 76, None],
    [81, 84, 83, 81, 79, 76], [79, 83, 81, 79, 77, 74],
    [77, 81, 79, 77, 76, 72], [76, 79, 77, 76, 74, 71],
    [74, 77, 81, 79, 77, 74], [79, 77, 76, 74, 71, 67],
    [72, 76, 79, 76, 74, 71], [72, None, None, 67, 71, 74],
    [76, 79, 77, 76, 74, 72], [74, 77, 76, 74, 71, 67],
    [72, 76, 79, 81, 79, 76], [77, 76, 74, 72, 71, 74],
    [76, 79, 84, 83, 81, 79], [81, 79, 77, 76, 74, 77],
    [76, 74, 72, 71, 74, 71], [72, None, None, None, None, None],
]
C, G, F, AM, DM = [48, 60, 64, 67], [43, 59, 62, 67], [41, 57, 60, 65], [45, 57, 60, 64], [50, 57, 62, 65]
CHORDS = [C, G, C, G, C, F, G, C, AM, G, F, C, DM, G, C, G, C, G, C, G, C, F, G, C]
length = int((len(MELODY) * 3 * BEAT + 2.5) * RATE)
samples = [0.0] * length

def note(midi, start, hold, strength):
    frequency = 440 * 2 ** ((midi - 69) / 12)
    duration = hold + 1.15
    offset = int(start * RATE)
    for i in range(int(duration * RATE)):
        if offset + i >= length:
            break
        t = i / RATE
        attack = min(1, t / .006)
        release = math.exp(-max(0, t - hold) * 7)
        # Different decay times for each partial give a soft piano-like attack.
        value = sum(weight * math.sin(2 * math.pi * frequency * harmonic * t)
                    * math.exp(-t * decay)
                    for harmonic, weight, decay in [(1, 1, 1.1), (2, .4, 2.4), (3, .16, 3.8), (4, .055, 5.5)])
        value *= attack * release * strength
        samples[offset + i] += value
        echo = offset + i + int(.09 * RATE)
        if echo < length:
            samples[echo] += value * .13

for bar, (melody, chord) in enumerate(zip(MELODY, CHORDS)):
    start = bar * 3 * BEAT
    note(chord[0], start, BEAT * .8, .13)
    for beat in [1, 2]:
        for key in chord[1:]:
            note(key, start + beat * BEAT, BEAT * .55, .038)
    for step, key in enumerate(melody):
        if key is not None:
            hold = BEAT * (.9 if step < 5 and melody[step + 1] is None else .43)
            note(key, start + step * BEAT / 2, hold, .15 if step % 2 == 0 else .125)

peak = max(abs(x) for x in samples)
pcm = array.array('h', (int(x / peak * 22000) for x in samples))
root = Path(__file__).resolve().parents[1]
for folder in ['frontend/public/cases', 'design-preview']:
    target = root / folder / 'projects-assets/music/classical-waltz.wav'
    target.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(target), 'wb') as output:
        output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        output.writeframes(pcm.tobytes())
    print(target)
