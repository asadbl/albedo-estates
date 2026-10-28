// Where things happen in the film, in seconds of each shot:
// shot 0 = driveway, pivot door, hall, living room; shot 1 = out through the glass to the pool and the bay;
// shot 2 = the drone rise that reveals the whole villa above Port d'Andratx.
// Frame numbers come from the manifest, so a shot can be swapped without touching the logic.
export function makeConfig(m) {
  const last = m.count - 1
  const T = (clip, sec) => {
    if (clip >= m.clips.length) return last
    const c = m.clips[clip]
    return Math.min(c[1], c[0] + sec * m.fps)
  }
  const A = (s) => T(0, s)
  const B = (s) => T(1, s)
  const C = (s) => T(2, s)

  return {
    SPEED: 70, // frames per screen of scroll at normal pace
    // slow-motion stretches: the camera keeps moving, only slower, while a chapter is read
    ZONES: [
      { from: A(0), to: A(1.6), slow: 3.4 },
      { from: A(4.0), to: A(6.0), slow: 2.6 },
      { from: A(10.2), to: B(0.8), slow: 4 },
      { from: B(5.0), to: B(8.0), slow: 3 },
      { from: B(10.2), to: C(2.0), slow: 3.4 },
      { from: C(10.4), to: last, slow: 9, ramp: 8 },
    ],
    PANELS: {
      hero: { from: 0, to: A(1.8), side: 'b' },
      door: { from: A(3.2), to: A(6.6), side: 'l' },
      living: { from: A(9.6), to: B(1.6), side: 'l' },
      terrace: { from: B(4.4), to: B(8.6), side: 'r' },
      bay: { from: B(9.6), to: C(2.6), side: 'l' },
      view: { from: C(9.4), to: last + 999, side: 'c' },
    },
    SWEEPS: [
      { word: 'Arrival', from: A(1.4), to: A(3.8) },
      { word: 'Inside', from: A(6.6), to: A(9.6) },
      { word: 'Outside', from: B(1.8), to: B(4.6) },
      { word: 'Above', from: C(2.8), to: C(9.2) },
    ],
    // labels pinned into the picture: track = [frame, x, y] in image fractions
    SPOTS: [
      { title: 'Oak pivot door', sub: '4 m tall, on a single steel pin', side: 'r', from: A(2.6), to: A(5.2), track: [[A(2.6), 0.53, 0.46], [A(3.2), 0.53, 0.45], [A(4.8), 0.48, 0.42]] },
      { title: 'Santanyí limestone', sub: 'quarried 60 km away', side: 'r', from: A(3.0), to: A(5.0), track: [[A(3.0), 0.61, 0.28], [A(4.8), 0.67, 0.28]] },
      { title: 'Floating stair', sub: 'solid limestone treads', side: 'l', from: A(10.6), to: B(1.2), track: [[A(10.6), 0.8, 0.6], [A(12), 0.8, 0.6], [B(1.2), 0.92, 0.6]] },
      { title: 'Infinity pool', sub: '20 m, heated, salt water', side: 'l', from: B(5.0), to: B(8.4), track: [[B(5.0), 0.44, 0.6], [B(5.5), 0.42, 0.62], [B(7), 0.35, 0.72], [B(8.4), 0.33, 0.74]] },
      { title: 'Port d’Andratx', sub: 'the harbour, 8 min by car', side: 'r', from: B(10), to: C(2.4), track: [[B(10), 0.46, 0.62], [B(11.9), 0.45, 0.62], [C(2.4), 0.5, 0.58]] },
      { title: 'Casa Albedo', sub: '2,400 m² above the bay', side: 'l', from: C(10.4), to: last + 999, track: [[C(10.4), 0.37, 0.66], [last, 0.36, 0.66]] },
      { title: 'Infinity pool', sub: 'facing south-west', side: 'r', from: C(10.6), to: last + 999, track: [[C(10.6), 0.6, 0.69], [last, 0.6, 0.69]] },
    ],
    CHAPTERS: [
      { name: 'Arrival', frame: 0 },
      { name: 'The door', frame: A(5) },
      { name: 'Living', frame: A(11) },
      { name: 'Terrace', frame: B(6) },
      { name: 'The bay', frame: B(11) },
      { name: 'From above', frame: C(10.6) },
    ],
    GLOW: [
      { from: A(8), to: A(12), amount: 0.4 },
      { from: B(7), to: C(4), amount: 0.55 },
    ],
    FX: [
      { from: A(7), to: B(3), amount: 0.5, hue: 'warm' },
    ],
  }
}
