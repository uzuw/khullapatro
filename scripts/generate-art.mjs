import { mkdir, writeFile } from 'node:fs/promises';

// Original ordered-dither illustrations: shade is quantized with a Bayer matrix.
const bayer = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const width = 720,
  height = 300,
  pixel = 3;
await mkdir('public/art', { recursive: true });
for (const kind of ['mountains', 'moon', 'metals']) {
  const palette =
    kind === 'mountains'
      ? ['#f3eded', '#d6aeb2', '#b66a77', '#843a4a']
      : kind === 'moon'
        ? ['#efedf7', '#c6bddb', '#8a7aa7', '#514565']
        : ['#f7f2e8', '#dac697', '#b69856', '#71603b'];
  const paths = ['', '', ''];
  for (let y = 0; y < height; y += pixel)
    for (let x = 0; x < width; x += pixel) {
      const u = x / width,
        v = y / height;
      let shade = 0;
      if (kind === 'mountains') {
        const far = 0.73 - 0.5 * Math.exp(-(((u - 0.56) / 0.19) ** 2)) + 0.065 * Math.sin(u * 37);
        const near = 0.9 - 0.35 * Math.exp(-(((u - 0.25) / 0.21) ** 2)) + 0.035 * Math.sin(u * 43);
        shade = v > near ? 2.0 + v * 0.5 : v > far ? 0.8 + (v - far) * 2.5 : 0.16 + v * 0.15;
        const sun = Math.hypot((u - 0.8) * 2.4, v - 0.25);
        if (sun < 0.13) shade = 0.95 - sun * 3;
      } else if (kind === 'moon') {
        const r = Math.hypot((u - 0.62) * 2.4, v - 0.47);
        shade = 0.1;
        if (r < 0.34) shade = 1.15 + r * 3 + 0.25 * Math.sin(u * 100) * Math.cos(v * 63);
        if (Math.hypot((u - 0.72) * 2.4, v - 0.37) < 0.29) shade = 0.09;
        if (y % 63 < 4 && x % 87 < 4) shade = 2.3;
        if (v > 0.85 + 0.07 * Math.sin(u * 19)) shade = 0.7 + v;
      } else {
        const a = (u - 0.51) * 2.4,
          b = v - 0.53;
        const r = Math.hypot(a, b);
        shade = 0.08;
        if (r < 0.34) shade = 0.7 + r * 3 + (a > 0 ? 0.4 : -0.2);
        if (r > 0.28 && r < 0.32) shade = 2.5;
        if (Math.abs(a) < 0.13 && Math.abs(b) < 0.1) shade = 1.8;
        const barX = u - 0.77,
          barY = v - 0.73;
        if (Math.abs(barX) < 0.12 && Math.abs(barY + barX * 0.45) < 0.11) shade = 1.0 + barY * 3;
        if (v > 0.9) shade = 0.2;
      }
      const level = Math.min(
        3,
        Math.max(0, Math.floor(shade + bayer[(y / pixel) % 4][(x / pixel) % 4] / 16)),
      );
      if (level) paths[level - 1] += `M${x} ${y}h${pixel}v${pixel}h-${pixel}z`;
    }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${palette[0]}"/>${paths.map((d, i) => `<path fill="${palette[i + 1]}" d="${d}"/>`).join('')}</svg>`;
  await writeFile(`public/art/${kind}.svg`, svg);
}
console.log('Generated three original ordered-dither artworks.');
