"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  UserPlus,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { signIn } from "next-auth/react";
import { validateCPF, parseDateDDMMYYYY, formatDateToDDMMYYYY, calculateAge } from "@/lib/validators";

interface FormData {
  // Step 1: Account Info
  name: string;
  email: string;
  password: string;
  confirmPassword: string;

  // Step 2: Personal Info
  cpf: string;
  birthDate: string;
  phoneNumber: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  cpf: "",
  birthDate: "",
  phoneNumber: "",
};

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFormValid, setIsFormValid] = useState<boolean | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [birthDateDisplay, setBirthDateDisplay] = useState("");

  const router = useRouter();

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  };

  const validateField = (field: keyof FormData, value: string): string => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Nome é obrigatório";
        if (value.trim().length < 2) return "Nome deve ter pelo menos 2 caracteres";
        return "";
      case "email":
        if (!value.trim()) return "Email é obrigatório";
        if (!/\S+@\S+\.\S+/.test(value)) return "Email inválido";
        return "";
      case "password":
        if (value.length < 6) return "A senha deve ter pelo menos 6 caracteres";
        return "";
      case "confirmPassword":
        if (value !== formData.password) return "As senhas não coincidem";
        return "";
      case "cpf":
        const cleanCPF = value.replace(/\D/g, "");
        if (!cleanCPF) return "CPF é obrigatório";
        if (cleanCPF.length !== 11) return "CPF deve ter 11 dígitos";
        if (!validateCPF(cleanCPF)) return "CPF inválido";
        return "";
      case "birthDate":
        if (!value) return "Data de nascimento é obrigatória";
        const [year, month, day] = value.split('-').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const age = calculateAge(birthDate);
        if (age < 18) return "Você deve ter pelo menos 18 anos para se cadastrar";
        return "";
      case "phoneNumber":
        const cleanPhone = value.replace(/\D/g, "");
        if (!cleanPhone) return "Telefone é obrigatório";
        if (cleanPhone.length !== 11) return "Telefone deve ter 11 dígitos no formato (11) 99999-9999";
        if (!/^[1-9][1-9]9[0-9]{8}$/.test(cleanPhone)) return "Telefone deve ser um número de celular válido no formato (XX) 9XXXX-XXXX";
        return "";
      default:
        return "";
    }
  };

  const handleFieldBlur = (field: keyof FormData) => {
    const error = validateField(field, formData[field]);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      return (
        formData.name.trim() !== "" &&
        formData.email.trim() !== "" &&
        formData.password !== "" &&
        formData.confirmPassword !== "" &&
        !validateField("name", formData.name) &&
        !validateField("email", formData.email) &&
        !validateField("password", formData.password) &&
        !validateField("confirmPassword", formData.confirmPassword)
      );
    } else if (currentStep === 2) {
      return (
        formData.cpf !== "" &&
        formData.birthDate !== "" &&
        formData.phoneNumber !== "" &&
        !validateField("cpf", formData.cpf) &&
        !validateField("birthDate", formData.birthDate) &&
        !validateField("phoneNumber", formData.phoneNumber)
      );
    }
    return false;
  };

  const isNextButtonEnabled = validateCurrentStep();

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    updateFormData("birthDate", inputValue);
    if (inputValue) {
      const [year, month, day] = inputValue.split('-');
      setBirthDateDisplay(`${day}/${month}/${year}`);
    } else {
      setBirthDateDisplay("");
    }
  };

  const validateStep1 = () => {
    const errors: Partial<Record<keyof FormData, string>> = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
      confirmPassword: validateField("confirmPassword", formData.confirmPassword),
    };
    setFieldErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  const validateStep2 = () => {
    const errors: Partial<Record<keyof FormData, string>> = {
      cpf: validateField("cpf", formData.cpf),
      birthDate: validateField("birthDate", formData.birthDate),
      phoneNumber: validateField("phoneNumber", formData.phoneNumber),
    };
    setFieldErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  const handleNext = () => {
    setError("");

    if (currentStep === 1 && !validateStep1()) {
      return;
    }

    if (currentStep === 2 && !validateStep2()) {
      return;
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => prev - 1);
    // Reset validation state when going back
    if (currentStep === 3) {
      setIsFormValid(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Register user
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          cpf: formData.cpf.replace(/\D/g, ""),
          birthDate: formData.birthDate,
          phoneNumber: formData.phoneNumber.replace(/\D/g, ""),
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(registerData.error || "Erro ao criar conta");
      }

      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Conta criada, mas erro ao fazer login automático");
      } else {
        router.push("/news");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Informações da Conta";
      case 2:
        return "Dados Pessoais";
      case 3:
        return "Confirmação";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Crie suas credenciais de acesso";
      case 2:
        return "Complete seu perfil";
      case 3:
        return "Revise suas informações";
      default:
        return "";
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl shadow-xl">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
            GatherIn
          </h1>
          <p className="text-gray-600 text-lg">
            Crie sua conta e comece a investir com conhecimento
          </p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-6 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {getStepTitle()}
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  {getStepDescription()}
                </CardDescription>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <span className="text-purple-700 font-bold text-lg">
                  {currentStep}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Progresso</span>
                <span>{currentStep}/3 etapas</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                      step < currentStep
                        ? "bg-green-500 text-white"
                        : step === currentStep
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step < currentStep ? <Check className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-12 h-0.5 mx-2 transition-all duration-200 ${
                        step < currentStep ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="pb-8">
            <form className="space-y-6">
              {/* Step 1: Account Information */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Nome completo
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      onBlur={() => handleFieldBlur("name")}
                      required
                      disabled={loading}
                      className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                    {fieldErrors.name && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      onBlur={() => handleFieldBlur("email")}
                      required
                      disabled={loading}
                      className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                    {fieldErrors.email && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700"
                    >
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={(e) =>
                          updateFormData("password", e.target.value)
                        }
                        onBlur={() => handleFieldBlur("password")}
                        required
                        disabled={loading}
                        className="h-12 pr-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirmar senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Digite a senha novamente"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          updateFormData("confirmPassword", e.target.value)
                        }
                        onBlur={() => handleFieldBlur("confirmPassword")}
                        required
                        disabled={loading}
                        className="h-12 pr-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Personal Information */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="cpf"
                      className="text-sm font-medium text-gray-700"
                    >
                      CPF
                    </Label>
                    <InputMask
                      id="cpf"
                      mask="999.999.999-99"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => updateFormData("cpf", e.target.value)}
                      onBlur={() => handleFieldBlur("cpf")}
                      required
                      disabled={loading}
                      className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                    {fieldErrors.cpf && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.cpf}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="birthDate"
                      className="text-sm font-medium text-gray-700"
                    >
                      Data de nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleBirthDateChange}
                      onBlur={() => handleFieldBlur("birthDate")}
                      required
                      disabled={loading}
                      className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                    {fieldErrors.birthDate && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.birthDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phoneNumber"
                      className="text-sm font-medium text-gray-700"
                    >
                      Telefone
                    </Label>
                    <InputMask
                      id="phoneNumber"
                      mask="(99) 99999-9999"
                      placeholder="(11) 99999-9999"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        updateFormData("phoneNumber", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("phoneNumber")}
                      required
                      disabled={loading}
                      className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.phoneNumber}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                    <h3 className="font-bold text-purple-900 mb-4 text-lg">
                      Confirme suas informações:
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Informações da Conta
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Nome:</span>
                              <span className="font-medium text-gray-900">
                                {formData.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium text-gray-900">
                                {formData.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Dados Pessoais
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">CPF:</span>
                              <span className="font-medium text-gray-900">
                                {formData.cpf}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Data de nascimento:
                              </span>
                              <span className="font-medium text-gray-900">
                                {birthDateDisplay}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Telefone:</span>
                              <span className="font-medium text-gray-900">
                                {formData.phoneNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-800 text-sm">
                      <strong>Quase lá!</strong> Ao clicar em "Criar conta",
                      você terá acesso completo à plataforma GatherIn e poderá
                      começar a acompanhar as melhores notícias do mercado
                      financeiro brasileiro.
                    </p>
                  </div>

                  {/* Validation Status */}
                  {/* {isFormValid === true ? (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full mr-3">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-green-800 font-semibold text-sm">
                          Tudo pronto! ✨
                        </p>
                        <p className="text-green-700 text-sm">
                          Suas informações estão válidas. Clique em "Criar conta" para finalizar.
                        </p>
                      </div>
                    </div>
                  ) : isFormValid === false ? (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200 flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-500 rounded-full mr-3">
                        <span className="text-white font-bold text-sm">✕</span>
                      </div>
                      <div>
                        <p className="text-red-800 font-semibold text-sm">
                          Informações incompletas
                        </p>
                        <p className="text-red-700 text-sm">
                          Verifique se todos os campos foram preenchidos corretamente.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-amber-500 rounded-full mr-3">
                        <span className="text-white font-bold text-sm">!</span>
                      </div>
                      <div>
                        <p className="text-amber-800 font-semibold text-sm">
                          Verificando informações...
                        </p>
                        <p className="text-amber-700 text-sm">
                          Aguarde enquanto validamos seus dados.
                        </p>
                      </div>
                    </div>
                  )} */}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-6">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1 h-12 border-gray-200 hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={loading || !isNextButtonEnabled}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`flex-1 h-12 shadow-lg transition-all duration-300 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:scale-105 hover:shadow-xl"`}
                  >
                    {/* {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Criando conta...
                      </div>
                    ) : isFormValid !== true ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Validando...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <UserPlus className="w-4 h-4 mr-2" />
                        🚀 Criar minha conta
                      </div>
                    )} */}
                    <div className="flex items-center">
                      <UserPlus className="w-4 h-4 mr-2" />
                      🚀 Criar minha conta
                    </div>
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{" "}
                <Link
                  href="/login"
                  className="font-medium text-purple-600 hover:text-purple-700 transition-colors"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
