import { z } from "zod";

export const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, "L'email è obbligatoria")
      .email("Formato email non valido")
      .max(254, "Email troppo lunga"),
    password: z
      .string()
      .min(12, "La password deve essere di almeno 12 caratteri")
      .max(128, "Password troppo lunga")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "La password deve contenere almeno una maiuscola, una minuscola, un numero e un carattere speciale"
      ),
    confirmPassword: z.string().min(1, "Conferma la password"),
    fullName: z
      .string()
      .min(2, "Il nome completo è obbligatorio")
      .max(200, "Nome troppo lungo")
      .trim(),
    displayName: z
      .string()
      .max(100, "Nome visualizzato troppo lungo")
      .trim()
      .optional(),
    acceptedTerms: z.boolean().refine((val) => val === true, {
      message: "Devi accettare i termini e condizioni",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().min(1, "L'email è obbligatoria").email("Formato email non valido"),
  password: z.string().min(1, "La password è obbligatoria"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "L'email è obbligatoria").email("Formato email non valido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "La password deve essere di almeno 12 caratteri")
      .max(128)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "La password deve contenere almeno una maiuscola, una minuscola, un numero e un carattere speciale"
      ),
    confirmPassword: z.string().min(1, "Conferma la password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(200).trim().optional(),
  displayName: z.string().max(100).trim().optional(),
  bio: z.string().max(1000).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  location: z.string().max(200).trim().optional(),
  language: z.string().length(2).optional(),
  timezone: z.string().max(100).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
