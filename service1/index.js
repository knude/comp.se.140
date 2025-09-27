import { appendFile, statfs } from 'fs';

import express from 'express';
import axios from 'axios';

const SERVICE2_URL = 'http://service2:9292';
const STORAGE_URL = 'http://storage:5702';

const app = express();
const PORT = 8199;

app.use(express.json());

const writeLog = (record) => {
  appendFile('/vStorage', `${record}\n`, err => {
    if (err) {
      console.error(err);
      throw err;
    }
  })
}

const rootSpace = () => {
  return new Promise((resolve, reject) => {
    statfs('/', (err, stats) => {
      if (err) return reject(err);
      resolve((stats.bsize * stats.bfree) / (1024 * 1024));
    })
  })
}

const makeRecord = async () => {
  const timestamp = new Date().toISOString().split('.')[0] + 'Z';
  const uptimeHours = (process.uptime() / 3600);
  const freeSpace = await rootSpace();
  return `${timestamp}: uptime ${uptimeHours} hours, free disk in root: ${freeSpace} MBytes`;
}


app.get('/status', async (req, res) => {
  try {
    const record = await makeRecord(); // 1. Service1 analyses its status and creates the above-described record

    await axios.post(`${STORAGE_URL}/log`, { record }); // 2. Service1 sends the created record to Storage (HTTP POST Storage)

    writeLog(record); // 3. Service1 writes the record to at the end of vStorage

    const service2Response = await axios.get(`${SERVICE2_URL}/status`); // 4. Service1 forward the request to Service2 (HTTP GET Service2)

    // ...

    // 9. Service1 combines the records (record1\nrecord2) end returns as a response (text/plain)
    res.type('text/plain');
    res.status(200).send(`${record}\n${service2Response.data}`);
  } catch (err) {
    res.status(500).send('Internal error');
  }
});

app.get('/log', async (req, res) => {
  try {
    const storageResponse = await axios.get(`${STORAGE_URL}/log`); // 1. Service1 forwards the request to Storage
    // 2. Returns the content of the log in text/plain.
    res.type('text/plain');
    res.status(200).send(storageResponse.data);
  } catch (err) {
    res.status(500).send('Internal error');
  }
});

app.use((req, res) => {
  res.status(404).send('Not found');
})

app.listen(PORT, () => {
  console.log(`Service1 listening at http://localhost:${PORT}`);
}); 