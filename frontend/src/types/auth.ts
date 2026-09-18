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
  accountType: "Student" | "Coach";
  birthDate: string | null;
  canCoachStrength: boolean;
  canCoachRunning: boolean;
};

export type RegisterResponse = {
  message: string;
  accountType: "Student" | "Coach";
};