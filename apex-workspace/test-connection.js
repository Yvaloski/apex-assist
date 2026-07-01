const { io } = require('socket.io-client');

console.log('Connecting to APEX WebSocket backend on http://localhost:3000...');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('✔ Connected successfully! ID:', socket.id);

  // Send a test prompt
  console.log('Sending test prompt: "Hello APEX!"');
  socket.emit('prompt', { prompt: 'Hello APEX!' });
});

socket.on('system-metrics', (metrics) => {
  console.log('⚡ Metric Received - CPU:', metrics.cpu.toFixed(2) + '%, RAM:', metrics.ram.toFixed(2) + '%');
});

socket.on('ai-stream', (chunk) => {
  if (chunk.done) {
    console.log('\n✔ AI Response Stream Completed.');
    socket.disconnect();
    process.exit(0);
  } else {
    process.stdout.write(chunk.content);
  }
});

socket.on('stream-error', (err) => {
  console.error('❌ Stream Error:', err);
  socket.disconnect();
  process.exit(1);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection Failed:', err.message);
  process.exit(1);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.log('Connection timeout.');
  socket.disconnect();
  process.exit(1);
}, 15000);
