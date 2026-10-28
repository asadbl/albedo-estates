#!/usr/bin/env python3
"""Turn the chained Seedance shots (scenes/NN-name.mp4) into the scroll image sequence.

Each clip after the first starts on the previous clip's end keyframe, so its first frame is dropped.
Writes public/frames/{d,m}/NNNN.webp and public/frames/manifest.json.
"""
import json, os, glob, shutil, subprocess, sys, tempfile
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = int(os.environ.get("FPS", 24))
SRC = os.environ.get("SRC", "scenes")
BLEND = int(os.environ.get("BLEND", 10))  # frames of overlap at each seam
SIZES = {"d": (1920, 72), "m": (1120, 66)}  # width, webp quality

clips = sorted(glob.glob(os.path.join(ROOT, SRC, "[0-9][0-9]-*.mp4")))
if not clips:
    sys.exit("no clips in scenes/")

tmp = tempfile.mkdtemp()
frames, ranges = [], []
for i, clip in enumerate(clips):
    out = os.path.join(tmp, f"c{i}")
    os.makedirs(out)
    h = int(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=height",
                            "-of", "csv=p=0", clip], capture_output=True, text=True).stdout.strip())
    vf = f"fps={FPS}" + ("" if h >= 1080 else ",scale=1920:1080:flags=lanczos,unsharp=5:5:0.55")
    subprocess.run(["ffmpeg", "-v", "error", "-i", clip, "-vf", vf, "-q:v", "1",
                    os.path.join(out, "%04d.png")], check=True)
    got = sorted(glob.glob(os.path.join(out, "*.png")))
    if i > 0:
        got = got[1:]
        # melt the seam: overlap the previous shot's tail with this shot's head
        k = min(BLEND, len(got), len(frames))
        for j in range(k):
            a = Image.open(frames[len(frames) - k + j]).convert("RGB")
            b = Image.open(got[j]).convert("RGB").resize(a.size)
            t = (j + 1) / (k + 1)
            dst = os.path.join(out, f"blend{j:03d}.png")
            Image.blend(a, b, t * t * (3 - 2 * t)).save(dst)
            frames[len(frames) - k + j] = dst
        got = got[k:]
    start = len(frames)
    frames += got
    ranges.append([start, len(frames) - 1])
    print(f"{os.path.basename(clip)}: {len(got)} frames -> {ranges[-1]}")

def encode(job):
    idx, src, key, w, q = job
    dst = os.path.join(ROOT, "public", "frames", key, f"{idx:04d}.webp")
    subprocess.run(["cwebp", "-quiet", "-q", str(q), "-m", "5", "-resize", str(w), "0", src, "-o", dst], check=True)

jobs = []
for key, (w, q) in SIZES.items():
    d = os.path.join(ROOT, "public", "frames", key)
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d)
    jobs += [(i, f, key, w, q) for i, f in enumerate(frames)]
with ThreadPoolExecutor(os.cpu_count()) as ex:
    list(ex.map(encode, jobs))

manifest = {"count": len(frames), "fps": FPS, "clips": ranges, "sizes": {k: v[0] for k, v in SIZES.items()}}
json.dump(manifest, open(os.path.join(ROOT, "public", "frames", "manifest.json"), "w"), indent=1)
shutil.rmtree(tmp)
print(json.dumps(manifest))
