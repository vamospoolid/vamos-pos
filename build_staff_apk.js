const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const staffDir = path.join(__dirname, 'vamos-staff-app');
const androidDir = path.join(staffDir, 'android');

console.log('0. Building Staff App Web Assets...');
execSync('npm run build', { cwd: staffDir, stdio: 'inherit' });

console.log('1. Syncing Capacitor in', staffDir);
execSync('npx cap sync android', { cwd: staffDir, stdio: 'inherit' });

console.log('2. Building Release APK...');
const env = {
    ...process.env,
    JAVA_HOME: 'C:\\Program Files\\Android\\Android Studio\\jbr',
    PATH: `C:\\Program Files\\Android\\Android Studio\\jbr\\bin;${process.env.PATH}`,
    ANDROID_HOME: 'C:\\Users\\Balanipastudio\\AppData\\Local\\Android\\Sdk'
};

const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
execSync(`${gradlew} assembleRelease`, { cwd: androidDir, env, stdio: 'inherit' });

const apkSource = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const apkDest = path.join(__dirname, 'VamosStaff.apk');

if (fs.existsSync(apkSource)) {
    fs.copyFileSync(apkSource, apkDest);
    console.log(`✅ Success! Copied APK to ${apkDest} (${fs.statSync(apkDest).size} bytes)`);
} else {
    console.error('❌ Could not find output APK at', apkSource);
}
