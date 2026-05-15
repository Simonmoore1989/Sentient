const sharp = require('sharp');
const path = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#080C0F"/>
  <rect x="30" y="30" width="452" height="452" rx="80" fill="#2ECC9A" fill-opacity="0.06"/>
  <path d="M256 112L400 190V322L256 400L112 322V190L256 112Z" stroke="#2ECC9A" stroke-width="15" stroke-linejoin="round" fill="none"/>
  <circle cx="256" cy="256" r="50" fill="#2ECC9A"/>
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
