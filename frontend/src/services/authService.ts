import type { LoginRequest, LoginResponse } from '../types/auth'

export async function login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch('https://localhost:7086/api/Auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        throw new Error('Invalid Login or Password.')
    }

    const result: LoginResponse = await response.json()

    return result
}