import express from 'express';
import  { createMap } from './src/createMap.js';

const app = express();
const map = createMap('/repos/postgres');


app.get('/data', async (_, res) => {
  return res.status(200).json(await map);
})

const port = 8080;
app.listen(port, () => {
  console.log(`repo-mapper-backend listening on port ${port}`)
});