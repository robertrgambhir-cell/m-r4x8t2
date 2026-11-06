"""Remakes ai/assets/welcome-line9-honest.mp3: the welcome video's line 9 from the staging page without the sentence
"Finish today's, and we'll text you the next one tomorrow morning." (nothing sends texts yet).
The recording is the stand-in voice (Kokoro af_heart) as the staging page has it; nothing is synthesized here. The cut runs
from 1.80 s to 5.58 s of the clip, both points in silence (about -80 dB against -20 dB for speech), with a 30 ms crossfade.
What's left: "The lessons come one a day." then the original 0.52 s pause, then "Ten mornings in, you'll have the
fundamentals down and know our campaign inside and out."
Usage: python3 ai/assets/make-line9.py wdpfxqlsvp/staging/index.html   (needs ffmpeg and numpy)"""
import base64, os, re, subprocess, sys, tempfile, wave
import numpy as np

src = open(sys.argv[1], encoding="utf-8").read()
i = src.find("const WELCOME_AUDIO = [")
clips = re.findall(r'"([A-Za-z0-9+/=]{1000,})"', src[i:src.find("];", i)])
assert len(clips) == 10
tmp = tempfile.mkdtemp()
open(os.path.join(tmp, "in.mp3"), "wb").write(base64.b64decode(clips[8]))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(tmp, "in.mp3"), "-ac", "1", "-ar", "24000", os.path.join(tmp, "in.wav")], check=True)
f = wave.open(os.path.join(tmp, "in.wav"))
sr = f.getframerate()
x = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
A, B, xf = int(1.80 * sr), int(5.58 * sr), int(0.03 * sr)
r = np.linspace(0, 1, xf)
y = np.concatenate([x[:A], x[A:A + xf] * (1 - r) + x[B:B + xf] * r, x[B + xf:]])
w = wave.open(os.path.join(tmp, "out.wav"), "wb")
w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "welcome-line9-honest.mp3")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(tmp, "out.wav"), "-c:a", "libmp3lame", "-b:a", "64k", "-ar", "24000", "-ac", "1", out], check=True)
print("wrote", out, round(len(y) / sr, 3), "s")
