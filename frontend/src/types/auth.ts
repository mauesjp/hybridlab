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