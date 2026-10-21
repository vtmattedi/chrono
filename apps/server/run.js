import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// process.exit(0); // Disable script execution for safety
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Change directory to ./front (create if doesn't exist)
const frontDir = path.join(__dirname, 'front');
if (!fs.existsSync(frontDir)) {
    fs.mkdirSync(frontDir);
}
else {
    // Clean the directory if it already exists
    fs.rmSync(frontDir, { recursive: true, force: true });
    fs.mkdirSync(frontDir);
}
process.chdir(frontDir);
console.log("Changed working directory to:", process.cwd());

try {
// Run git clone (replace with your repo URL)
const repoUrl = 'https://github.com/vtmattedi/chronoapp.git'; // <-- Change this to your repo
execSync(`git clone ${repoUrl} .`, { stdio: 'inherit' });

// Run npm install
execSync('ls && npm install', { stdio: 'inherit' });

// Run npm run build
execSync('npm run build', { stdio: 'inherit' });

console.log('Build completed successfully.');
} catch (error) {
console.error('Error during build process:', error);
process.exit(1);
}