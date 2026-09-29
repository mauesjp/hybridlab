export interface LoginRequest {
    login: string
    password: string
}

export interface LoginResponse {
    userId: string
    userName: string
    email: string
    role: string
    accessToken: string
    refreshToken: string
}

export type RegisterRequest = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  accountType: "Student";
  birthDate: string;
};

export type RegisterResponse = {
  message: string;
  accountType: "Student";
};