import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { UserDAL } from '@/dal/user';

export async function GET(request: NextRequest) {
  try {
    const user = AuthService.getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({
        error: 'Não autenticado'
      }, { status: 401 });
    }
    
    // Get fresh user data from database
    const userData = await UserDAL.getUserById(user.userId);
    
    if (!userData) {
      return NextResponse.json({
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      user: userData
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}