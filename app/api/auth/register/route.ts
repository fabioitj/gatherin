import { NextRequest, NextResponse } from 'next/server';
import { UserDAL } from '@/dal/user';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Create user
    const user = await UserDAL.createUser(validatedData);
    
    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    if (error instanceof Error) {
      return NextResponse.json({
        error: error.message
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}