import { appendFile, readFile, writeFile } from 'fs';

import express from 'express';

const app = express();
const PORT = 5702;

const STORAGE_PATH = '/data/storage.log';

app.use(express.json());

const upsertFile = (path = STORAGE_PATH) => {
  readFile(path, 'utf8', (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        writeFile(path, '', (writeErr) => {
          if (writeErr) console.error(writeErr);
        });
      } else {
        console.error(err);
      }
    }
  });
};

const writeLog = (record) => {
  appendFile(STORAGE_PATH, `${record}\n`, err => {
    if (err) {
      console.error(err);
      throw err;
    }
  })
}

app.post('/log', (req, res) => {
  try {
    writeLog(req.body.record);
    res.status(200).send('Log entry added');
  } catch (err) {
    res.status(500).send('Internal error');
  }
});

app.get('/log', (req, res) => {
  try {
    readFile(STORAGE_PATH, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }
      res.type('text/plain');
      res.status(200).send(data);
    });
  } catch (err) {
    res.status(500).send('Internal error');
  }
});

app.use((req, res) => {
  res.status(404).send('Not found')
})

app.listen(PORT, () => {
  upsertFile();
});