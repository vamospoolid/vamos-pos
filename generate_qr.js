const https = require('https');
const fs = require('fs');
const path = require('path');

const downloadUrl = 'https://app.vamospool.id/VamosPlayer.apk';
const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=' + encodeURIComponent(downloadUrl);
const outputPath = path.join(__dirname, 'QR_VamosPlayer.png');

console.log('Downloading QR code for:', downloadUrl);
console.log('API URL:', qrApiUrl);

const file = fs.createWriteStream(outputPath);

https.get(qrApiUrl, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Failed to get QR code, status code: ${response.statusCode}`);
        return;
    }
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('✅ QR Code generated successfully and saved to:', outputPath);
    });
}).on('error', (err) => {
    fs.unlink(outputPath, () => {});
    console.error('Error downloading QR code:', err.message);
});
