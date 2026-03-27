const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('ps aux | grep node', (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('data', (data) => { output += data; });
    stream.on('close', () => {
      console.log('--- PROSES NODE DI SERVER ---');
      console.log(output);
      console.log('------------------------------');
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('Koneksi Gagal:', err);
}).connect({
  host: '5.189.165.222',
  port: 22,
  username: 'root',
  password: 'Ahmaddcc07'
});
