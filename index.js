const express = require('express');
const redis = require('redis');
const axios = require('axios');
const util = require('util');

const redisConnectionUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisConnectionUrl);

client.set = util.promisify(client.set);
client.get = util.promisify(client.get);

const app = express();

const port = process.env.PORT || 6767;
const host = process.env.PORT || '0.0.0.0';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//setting data to redis
app.post('/set', async (req, res) => {
  const { redis_key, redis_value } = req.body;
  const response = await client.set(redis_key, redis_value);
  return res.status(200).json(response);
});

//retrieving data from redis
app.get('/get', async (req, res) => {
  const { redis_key } = req.body;
  const value = await client.get(redis_key);
  return res.status(200).json(value);
});

//retrieving data from redis
app.get('/', async (req, res) => {
  const { key } = req.body;
  const value = await client.get(key);
  return res.status(200).json(value);
});

app.get('/posts/:id', async (req, res) => {
  const { id } = req.params;

  //implement caching
  const cachedResponse = await client.get(`post:${id}`);
  if (cachedResponse) {
    return res.status(200).json(JSON.parse(cachedResponse));
  }

  const response = await axios.get(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  await client.set(`post:${id}`, JSON.stringify(response.data), 'EX', 5);
  return res.status(200).json(response.data);
});

app.listen(port, host, () => {
  console.log(`Server is running on port ${host}:${port}`);
});
