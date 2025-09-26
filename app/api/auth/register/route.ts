import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// CPF validation function
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // All same digits

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

// Phone validation function
function validateBrazilianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, "");
  // Brazilian mobile numbers: 11 digits, area code (2 digits) + 9 + 8 digits
  // Example: (47) 99261-1819 = 47992611819
  return cleanPhone.length === 11 && /^[1-9][1-9]9[0-9]{8}$/.test(cleanPhone);
}

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  phoneNumber: z.string().min(1, "Telefone é obrigatório"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Clean and validate CPF
    const cleanCPF = validatedData.cpf.replace(/\D/g, "");
    if (!validateCPF(cleanCPF)) {
      return NextResponse.json(
        {
          error: "CPF inválido",
        },
        { status: 400 }
      );
    }

    // Clean and validate phone
    const cleanPhone = validatedData.phoneNumber.replace(/\D/g, "");
    if (!validateBrazilianPhone(cleanPhone)) {
      return NextResponse.json(
        {
          error: "Telefone inválido. Use o formato (11) 99999-9999",
        },
        { status: 400 }
      );
    }

    // Validate birth date (must be at least 18 years old)
    const birthDate = new Date(validatedData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      age < 18 ||
      (age === 18 && monthDiff < 0) ||
      (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      return NextResponse.json(
        {
          error: "Você deve ter pelo menos 18 anos para se cadastrar",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Este email já está cadastrado. Tente fazer login ou use outro email.",
        },
        { status: 400 }
      );
    }

    // Check if CPF already exists
    const existingCPF = await prisma.user.findUnique({
      where: { cpf: cleanCPF },
    });

    if (existingCPF) {
      return NextResponse.json(
        {
          error:
            "Este CPF já está cadastrado. Cada CPF pode ter apenas uma conta.",
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        cpf: cleanCPF,
        birthDate: birthDate,
        phoneNumber: cleanPhone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        birthDate: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Usuário criado com sucesso",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        {
          error: firstError.message,
        },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      if (error.message.includes("email")) {
        return NextResponse.json(
          {
            error:
              "Este email já está cadastrado. Tente fazer login ou use outro email.",
          },
          { status: 400 }
        );
      }
      if (error.message.includes("cpf")) {
        return NextResponse.json(
          {
            error:
              "Este CPF já está cadastrado. Cada CPF pode ter apenas uma conta.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Erro interno do servidor. Tente novamente em alguns instantes. " +
          (error as Error).message,
      },
      { status: 500 }
    );
  }
}
