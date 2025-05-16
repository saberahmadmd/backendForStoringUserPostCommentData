export interface Comment {
  id: number;
  name: string;
  email: string;
  body: string;
  postId: number;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}
