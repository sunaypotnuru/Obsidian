import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { useAuthStore } from "../../lib/store";
import { toast } from "sonner";
import { useTranslation } from "../../lib/i18n";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
    const { t } = useTranslation();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
        defaultValues: { email: "", password: "" }
    });
    const { signIn, loading } = useAuthStore();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (data: LoginFormValues) => {
        console.log('[AdminLogin] Starting sign in for:', data.email);
        const result = await signIn(data.email, data.password);

        console.log('[AdminLogin] Sign in result:', result.success ? 'SUCCESS' : 'FAILED');

        if (result.success) {
            // Use the resolved role from the store (extracted from user_metadata)
            const role = ('role' in result ? result.role : undefined) || "admin";
            console.log('[AdminLogin] User role:', role);

            toast.success(t("auth.welcome_back_admin", "Welcome back, Administrator!"));

            // Small delay to ensure state is updated
            setTimeout(() => {
                console.log('[AdminLogin] Navigating to dashboard for role:', role);
                navigate("/admin/dashboard", { replace: true });
            }, 100);
        } else {
            const errorMsg = result.error?.message || result.error?.toString() || t("auth.failed_sign_in", "Failed to sign in");
            console.error('[AdminLogin] Error:', errorMsg);
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-6 bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#1E293B] flex items-center justify-center relative overflow-hidden">
            {/* Background shapes */}
            <div className="absolute top-20 right-10 w-72 h-72 bg-[#7C3AED]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="p-8 shadow-2xl backdrop-blur-sm bg-[#1E293B]/80 border border-[#7C3AED]/30">
                    <div className="flex flex-col items-center mb-8">
                        <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                        >
                            <Shield className="w-8 h-8 text-white" />
                        </motion.div>
                        <motion.h1 className="text-3xl font-bold text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            {t("auth.admin_login", "Admin Login")}
                        </motion.h1>
                        <motion.p className="text-[#94A3B8] mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                            {t("auth.admin_access", "Access the Netra AI administration panel")}
                        </motion.p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
                        <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <Label htmlFor="email" className="text-[#E2E8F0]">{t("auth.email_address", "Email Address")}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    autoComplete="email"
                                    {...register("email")}
                                    className={`pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500/30' : ''}`}
                                />
                            </div>
                            {errors.email && <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>}
                        </motion.div>

                        <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                            <Label htmlFor="password" className="text-[#E2E8F0]">{t("auth.password", "Password")}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    {...register("password")}
                                    className={`pl-10 pr-11 ${errors.password ? 'border-red-500 focus:ring-red-500/30' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#7C3AED] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-sm text-red-400 mt-1">{errors.password.message}</p>}
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                            <Button
                                type="submit"
                                disabled={loading || isSubmitting}
                                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white py-6 text-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                            >
                                {loading || isSubmitting ? t("auth.signing_in", "Signing in...") : t("auth.sign_in", "Sign In")}
                            </Button>
                        </motion.div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
