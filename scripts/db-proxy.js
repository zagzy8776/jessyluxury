const net = require('net');

const LOCAL_PORT = 5439;
const TARGET_HOST = 'ep-silent-forest-azug0wa0-pooler.c-3.ap-southeast-1.aws.neon.tech';
const TARGET_PORT = 5432;

const server = net.createServer((localSocket) => {
  const remoteSocket = net.connect(TARGET_PORT, TARGET_HOST, () => {
    localSocket.pipe(remoteSocket);
    remoteSocket.pipe(localSocket);
  });

  localSocket.on('error', (err) => {});
  remoteSocket.on('error', (err) => {});
  localSocket.on('close', () => remoteSocket.end());
  remoteSocket.on('close', () => localSocket.end());
});

server.listen(LOCAL_PORT, () => {
  console.log(`[Proxy Server] Tunneling loopback:${LOCAL_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`);
});
