import axios from 'axios';
import { getDb } from './db';

export const loadData = async () => {
  try {
    const [usersRes, postsRes, commentsRes] = await Promise.all([
      axios.get('https://jsonplaceholder.typicode.com/users'),
      axios.get('https://jsonplaceholder.typicode.com/posts'),
      axios.get('https://jsonplaceholder.typicode.com/comments')
    ]);

    const db = getDb();
    await db.collection('users').deleteMany({});
    await db.collection('posts').deleteMany({});
    await db.collection('comments').deleteMany({});

    await db.collection('users').insertMany(usersRes.data);
    await db.collection('posts').insertMany(postsRes.data);
    await db.collection('comments').insertMany(commentsRes.data);

    console.log('✅ Sample data loaded');
  } catch (err) {
    console.error('❌ Failed to load data:', err);
  }
};
