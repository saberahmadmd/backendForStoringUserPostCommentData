import http, { IncomingMessage } from 'http';
import { connectToDb, getDb } from './db';
import { loadData } from './loadData';

const parseJSON = (req: IncomingMessage): Promise<any> =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const db = getDb();
  const usersCol = db.collection('users');
  const postsCol = db.collection('posts');
  const commentsCol = db.collection('comments');

  try {
    // Load mock data
    if (req.method === 'GET' && url.pathname === '/load') {
      await loadData();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Data loaded successfully' }));
    }

    // Get user with posts and comments
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

      res.writeHead(200);
      return res.end(JSON.stringify(user));
    }

    // Create new user
    if (req.method === 'POST' && url.pathname === '/users') {
      const body = await parseJSON(req);
      if (!body.id || !body.name) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'Missing required fields' }));
      }

      const existing = await usersCol.findOne({ id: body.id });
      if (existing) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'User already exists' }));
      }

      await usersCol.insertOne(body);
      res.writeHead(201);
      return res.end(JSON.stringify(body));
    }

    // Delete all users
    if (req.method === 'DELETE' && url.pathname === '/users') {
      await usersCol.deleteMany({});
      await postsCol.deleteMany({});
      await commentsCol.deleteMany({});
      res.writeHead(200);
      return res.end(JSON.stringify({ message: 'All users and data deleted' }));
    }

    // Delete single user
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

    // Default route
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route not found' }));
  } catch (err: any) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

connectToDb().then(() => {
  server.listen(3000, () => {
    console.log('✅ Server running on http://localhost:3000');
  });
});
