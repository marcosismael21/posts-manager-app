export interface Comment {
  _id: string;
  postId: string;
  name: string;
  email: string;
  body: string;
  userId: string;
  createdAt: string;
}

export interface CreateCommentDto {
  postId: string;
  body: string;
}
