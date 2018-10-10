const net = require('net');
const fs = require('fs');
const path = require('path');
const port = 8124;

const client = new net.Socket();

const clientStartStr = 'FILES';
const serverAcceptStr = 'ACK';
const serverDeclineStr = 'DEC';
const resFiles = 'GetNextFile';
const nextDir = 'NextDir';

let isStartingConnection = true;
let dirCounter = 0;
let arrOfFiles = [];

function GetAllPaths() {
    process.argv.forEach((element, index) => {
        if(index > 1)
        {
            arrOfFiles[index - 2] = [];
            readFiles(element);
            ++dirCounter;
        }
    });
    // const paths = ['E:\\GitHub\\CWP\\cwp-01\\cwp-01', 'E:\\GitHub\\CWP\\cwp-01\\CWP'];
    // for (let path of paths) {
    //     arrOfFiles.push([]);
    //     readFiles(path);
    //     ++dirCounter;
    // }
}

function readFiles(dir) {
    let files = fs.readdirSync(dir);
    for (let file of files) {
        let nfile = dir + path.sep + file;
        const stats = fs.lstatSync(nfile);
        if (stats.isFile())
            arrOfFiles[dirCounter].push(nfile);
        else
            readFiles(nfile);
    }
}


client.setEncoding('utf8');

client.connect(port, function () {
    console.log('Connected');
    client.write(clientStartStr);
});

let filesArray;

function SlicePaths(){
    let files = [];
    for(let path of filesArray) {
        files.push(path.split('\\').pop());
    }
    return files;
}

function sendFile() {
    let filePath = filesArray.pop();
    if (!filePath) {
        if(arrOfFiles.length === 0)
        {
            client.destroy();
            return;
        }
        filesArray = arrOfFiles.pop();
        const files = SlicePaths();
        client.write(files.join(' '));
    }
    else {
        fs.readFile(filePath, (err, data) => {
            let buf = data.toString('hex');
            client.write(buf);
        });
    }
}

client.on('data', function (data) {
    if (data === serverDeclineStr) {
        client.destroy();
    }
    else if (data === serverAcceptStr) {
        isStartingConnection = false;
        GetAllPaths();
        filesArray = arrOfFiles.pop();
        const files = SlicePaths();
        client.write(files.join(' '));
    }
    else if (data === resFiles) {
        sendFile();
    }
});

client.on('close', function () {
    console.log('Connection closed');
});