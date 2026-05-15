const sharp = require('sharp');
const path = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#080C0F"/>
  <rect x="10" y="10" width="492" height="492" rx="75" fill="none" stroke="#2ECC9A" stroke-width="20"/>
  <rect x="40" y="40" width="432" height="432" rx="60" fill="#2ECC9A" fill-opacity="0.08"/>
  <path d="M256 80L432 176V336L256 432L80 336V176L256 80Z" stroke="#2ECC9A" stroke-width="18" stroke-linejoin="round" fill="none"/>
  <circle cx="256" cy="256" r="52" fill="#2ECC9A"/>
</svg>`;

const sizes = [
  { size: 192, output: 'public/icon-192.png' },
  { size: 512, output: 'public/icon-512.png' },
];

async function generate() {
  for (const { size, output } of sizes) {
    const dest = path.join(__dirname, '..', output);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(dest);
    console.log(`Generated ${output} (${size}x${size})`);
  }
}

generate().catch(err => { console.error(err); process.exit(1); });
