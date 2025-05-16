import http, { IncomingMessage, ServerResponse } from 'http';
import { connectToDb, getDb } from './db';
import { loadData } from './loadData';

const parseJSON = (req: IncomingMessage): Promise<any> =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const db = getDb();
  const usersCol = db.collection('users');
  const postsCol = db.collection('posts');
  const commentsCol = db.collection('comments');

  try {
    // 1) LOAD mock data
    if (req.method === 'GET' && url.pathname === '/load') {
      await loadData();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Data loaded successfully' }));
    }

    // 2) GET all users
    if (req.method === 'GET' && url.pathname === '/users') {
      const users = await usersCol.find({}).toArray();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(users));
    }

    // 3) GET single user + posts + comments
    if (req.method === 'GET' && url.pathname.startsWith('/users/')) {
      const userId = Number(url.pathname.split('/')[2]);
      if (isNaN(userId)) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'Invalid user ID' }));
      }

      const user = await usersCol.findOne({ id: userId });
      if (!user) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'User not found' }));
      }

      const posts = await postsCol.find({ userId }).toArray();
      for (const post of posts) {
        const comments = await commentsCol.find({ postId: post.id }).toArray();
        (post as any).comments = comments;
      }
      (user as any).posts = posts;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(user));
    }

    // 4) CREATE new user
    if (req.method === 'POST' && url.pathname === '/users') {
      const body = await parseJSON(req);
      if (!body.id || !body.name) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'Missing required fields (id, name)' }));
      }

      const exists = await usersCol.findOne({ id: body.id });
      if (exists) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'User already exists' }));
      }

      await usersCol.insertOne(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(body));
    }

    // 5) DELETE all users & data
    if (req.method === 'DELETE' && url.pathname === '/users') {
      await usersCol.deleteMany({});
      await postsCol.deleteMany({});
      await commentsCol.deleteMany({});
      res.writeHead(200);
      return res.end(JSON.stringify({ message: 'All users and data deleted' }));
    }

    // 6) DELETE single user + related
    if (req.method === 'DELETE' && url.pathname.startsWith('/users/')) {
      const userId = Number(url.pathname.split('/')[2]);
      const user = await usersCol.findOne({ id: userId });
      if (!user) {
        res.writeHead(404);
        return res.end(JSON.stringify({ error: 'User not found' }));
      }

      const posts = await postsCol.find({ userId }).toArray();
      const postIds = posts.map(p => p.id);
      await usersCol.deleteOne({ id: userId });
      await postsCol.deleteMany({ userId });
      await commentsCol.deleteMany({ postId: { $in: postIds } });

      res.writeHead(200);
      return res.end(JSON.stringify({ message: 'User and related data deleted' }));
    }

    // 7) FALLBACK 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

connectToDb().then(() => {
  server.listen(process.env.PORT || 3000, () => {
    console.log(`✅ Server running on http://localhost:${process.env.PORT || 3000}`);
  });
});
