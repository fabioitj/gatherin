import { NextRequest, NextResponse } from 'next/server';
import { UserDAL } from '@/dal/user';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    
    // Login user
    const { user, token } = await UserDAL.loginUser(validatedData);
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user,
      token
    });
    
    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Erro no login:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({
        error: error.message
      }, { status: 401 });
    }
    
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}