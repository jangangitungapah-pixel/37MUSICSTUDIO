const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();

function run(command, args, label) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ ' + label);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });

  if (result.status !== 0) {
    throw new Error(`${label} gagal dengan exit code ${result.status}`);
  }
}

function ensureFile(relativePath, label) {
  const fullPath = path.join(root, relativePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`${label} tidak ditemukan: ${relativePath}`);
  }
}

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File tidak ditemukan: ${relativePath}`);
  }

  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

console.log('\n🚀 37 Music Studio — Firebase Hosting Deploy\n');

ensureFile('package.json', 'package.json');
ensureFile('firebase.json', 'firebase.json');
ensureFile('.firebaserc', '.firebaserc');

const packageJson = readJson('package.json');
const firebaseJson = readJson('firebase.json');
const firebaseRc = readJson('.firebaserc');

const requiredScripts = ['lint', 'test', 'build'];

for (const scriptName of requiredScripts) {
  if (!packageJson.scripts || !packageJson.scripts[scriptName]) {
    throw new Error(`Script npm "${scriptName}" tidak ditemukan di package.json`);
  }
}

if (!firebaseJson.hosting) {
  throw new Error('Konfigurasi hosting tidak ditemukan di firebase.json');
}

const hostingPublicDir = firebaseJson.hosting.public || 'dist';
const hostingSite = firebaseJson.hosting.site || '(default hosting site)';
const firebaseProject = firebaseRc.projects?.default || '(default project tidak terbaca)';

console.log('Project Firebase : ' + firebaseProject);
console.log('Hosting site     : ' + hostingSite);
console.log('Public dir       : ' + hostingPublicDir);

run('npm', ['run', 'lint'], 'Lint');
run('npm', ['test'], 'Test');
run('npm', ['run', 'build'], 'Build');

ensureFile(hostingPublicDir, 'Folder output build');
ensureFile(path.join(hostingPublicDir, 'index.html'), 'index.html hasil build');

run('firebase', ['deploy', '--only', 'hosting'], 'Deploy Firebase Hosting');

console.log('\n✅ Deploy hosting selesai bro. Situs sudah dikirim ke Firebase Hosting.\n');