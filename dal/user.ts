import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserDAL {
  static async createUser(data: CreateUserData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('Email já está em uso');
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao criar usuário');
    }
  }

  static async loginUser(data: LoginData): Promise<{ user: User; token: string }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (!user) {
        throw new Error('Email ou senha inválidos');
      }

      // Verify password
      const isValidPassword = await AuthService.comparePassword(data.password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Email ou senha inválidos');
      }

      // Generate token
      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        name: user.name
      });

      // Return user without password hash
      const { passwordHash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao fazer login');
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw new Error('Falha ao buscar usuário');
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw new Error('Falha ao buscar usuário');
    }
  }

  static async updateUser(id: string, data: Partial<Pick<CreateUserData, 'name' | 'email'>>): Promise<User> {
    try {
      // Check if email is being updated and if it's already in use
      if (data.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: data.email,
            NOT: { id }
          }
        });

        if (existingUser) {
          throw new Error('Email já está em uso');
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao atualizar usuário');
    }
  }

  static async deleteUser(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw new Error('Falha ao deletar usuário');
    }
  }
}