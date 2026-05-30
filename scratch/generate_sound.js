const fs = require('fs');
const path = require('path');

const sampleRate = 8000;
const duration = 0.08; // 80 ms
const numSamples = sampleRate * duration;
const buffer = Buffer.alloc(44 + numSamples);

// WAV Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate, 28);
buffer.writeUInt16LE(1, 32);
buffer.writeUInt16LE(8, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples, 40);

// Generate sine wave that decays exponentially
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const frequency = 800 - t * 4000;
  const amplitude = Math.exp(-t * 30);
  const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude;
  const byteValue = Math.floor((sample + 1) * 127);
  buffer.writeUInt8(byteValue, 44 + i);
}

fs.writeFileSync(path.join(__dirname, '../public/click.wav'), buffer);
console.log('Sound generated successfully at public/click.wav!');
