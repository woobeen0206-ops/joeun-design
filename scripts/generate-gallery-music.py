"""Original quiet gallery underscore: warm sustained chords, no rhythmic lead."""
import array
import math
from pathlib import Path
import wave

RATE = 22050
DURATION = 64
samples = [0.0] * (RATE * DURATION)
# Close, middle-register voicings with slow harmonic motion.
CHORDS = [
    [48, 55, 59, 64], [48, 57, 60, 64],
    [45, 55, 60, 64], [45, 53, 57, 60],
    [41, 53, 57, 64], [43, 55, 60, 64],
    [43, 55, 59, 62], [48, 55, 60, 64],
]

def note(midi, start, strength, duration=11.0):
    frequency = 440 * 2 ** ((midi - 69) / 12)
    offset = int(start * RATE)
    for i in range(int(duration * RATE)):
        t = i / RATE
        # Rounded attack and long release avoid percussive, attention-grabbing notes.
        attack = 1 - math.exp(-t / .38)
        release = .5 * (1 + math.cos(math.pi * t / duration))
        envelope = attack * release * math.exp(-t / 4.8)
        angle = 2 * math.pi * frequency * t
        value = (math.sin(angle) + .13 * math.sin(2 * angle)
                 + .025 * math.sin(3 * angle)) * envelope * strength
        # Wrap tails into the start for a continuous loop without silence or clicks.
        samples[(offset + i) % len(samples)] += value
        samples[(offset + i + int(.19 * RATE)) % len(samples)] += value * .12
        samples[(offset + i + int(.37 * RATE)) % len(samples)] += value * .06

for bar, chord in enumerate(CHORDS):
    for voice, key in enumerate(chord):
        note(key, bar * 8 + voice * .14, .065 if voice == 0 else .045)
    # A quiet inner voice rather than a foreground melody.
    note(chord[2], bar * 8 + 4.7, .013, 6)

peak = max(abs(x) for x in samples)
# A deliberately quiet master (~-14 dBFS peak), even at full player volume.
pcm = array.array('h', (int(x / peak * 6500) for x in samples))
root = Path(__file__).resolve().parents[1]
for folder in ['frontend/public/cases', 'design-preview']:
    target = root / folder / 'projects-assets/music/gallery-calm.wav'
    target.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(target), 'wb') as output:
        output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        output.writeframes(pcm.tobytes())
    print(target)
