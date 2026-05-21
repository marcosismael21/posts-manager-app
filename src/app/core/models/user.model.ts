export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUpdateUserDto {
  name: string;
  email: string;
  password: string;
}
