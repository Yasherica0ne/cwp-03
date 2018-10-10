const net = require('net');
const fs = require('fs');
const path = require('path');
const port = 8124;

const clientStartStr = 'FILES';
const serverAcceptStr = 'ACK';
const serverDeclineStr = 'DEC';
const resFiles = 'GetNextFile';
const nextDir = 'NextDir';
const defaultDir = process.env.JSPath;
let seed = 0;

const server = net.createServer((client) => {
    client.id = Date.now() + seed++;
    fs.mkdir(defaultDir + path.sep + client.id);
    console.log('Client connected id: ' + client.id + '\r\n');
    let isStartingConnection = true;
    client.setEncoding('utf8');
    let fileNames = [];

    client.on('data', (data) => {
        if (isStartingConnection) {
            if (data === clientStartStr) {
                client.write(serverAcceptStr);
                isStartingConnection = false;
            }
            else {
                client.write(serverDeclineStr);
                client.write('close');
            }
        }
        else {
            if (fileNames.length === 0) {
                fileNames = data.split(' ');
                client.write(resFiles);
            }
            else if (data === nextDir) {
                fileNames = [];
                client.write(resFiles);
            }
            else {
                let buf = Buffer.from(data, 'hex');
                let filePath = defaultDir + path.sep + client.id + path.sep + fileNames.pop();
                let fil = fs.createWriteStream(filePath);
                fil.write(buf);
                fil.close();
                client.write(resFiles);
            }
        }
    });

    client.on('end', () => console.log(`Client id: ${client.id} disconnected\r\n`));

});

server.listen(port, () => {
    console.log(`Server listening on localhost: ${port}\r\n`);
});