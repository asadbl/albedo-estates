#!/usr/bin/env python3
"""Mean pixel difference between the last frame of one shot and the first of the next: seam.py a.mp4 b.mp4
Under ~8 is a clean join; 8-20 is a visible nudge (build_frames.py blends it); above 20 the next shot did not start
on the previous shot's last frame."""
import subprocess, sys, tempfile, os
from PIL import Image, ImageChops, ImageStat
t = tempfile.mkdtemp()
a, b = os.path.join(t, "a.png"), os.path.join(t, "b.png")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-sseof", "-0.05", "-i", sys.argv[1], "-frames:v", "1", "-vf", "scale=480:-2", a], check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", sys.argv[2], "-frames:v", "1", "-vf", "scale=480:-2", b], check=True)
d = ImageStat.Stat(ImageChops.difference(Image.open(a).convert("RGB"), Image.open(b).convert("RGB"))).mean
print(round(sum(d) / 3, 1))
