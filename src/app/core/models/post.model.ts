export interface Post {
  _id: string;
  title: string;
  body: string;
  author: string;
  userId: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}


export interface CreatePostDto {
  title: string;
  body: string;
}

export interface UpdatePostDto {
  title?: string;
  body?: string;
  keepUrls?: string[];
}
