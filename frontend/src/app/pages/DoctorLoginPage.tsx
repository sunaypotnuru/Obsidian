import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Stethoscope, Mail, Lock, Heart, Activity, Eye, EyeOff } from "lucide-react";
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

export default function DoctorLoginPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
        defaultValues: { email: "", password: "" }
    });
    const { signIn, loading } = useAuthStore();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useTranslation();

    const onSubmit = async (data: LoginFormValues) => {
        const result = await signIn(data.email, data.password);
        if (result.success) {
            toast.success(t('auth.login.doctor_welcome', 'Welcome back, Doctor!'));
            setTimeout(() => {
                navigate("/doctor/dashboard", { replace: true });
            }, 100);
        } else {
            const errorMsg = result.error?.message || result.error?.toString() || "Failed to sign in";
            toast.error(errorMsg);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-12 px-6 bg-gradient-to-br from-[#F0F9FF] via-white to-[#E0F2FE] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-20 right-10 w-72 h-72 bg-[#0EA5E9]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#0D9488]/5 rounded-full blur-3xl" />

            {[
                { Icon: Stethoscope, x: "15%", y: "25%" },
                { Icon: Heart, x: "80%", y: "20%" },
                { Icon: Activity, x: "75%", y: "70%" },
            ].map(({ Icon, x, y }, i) => (
                <div key={i} className="absolute pointer-events-none opacity-[0.06]" style={{ left: x, top: y }}>
                    <Icon className="w-10 h-10 text-[#0EA5E9]" />
                </div>
            ))}

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="p-8 shadow-2xl backdrop-blur-sm bg-white/80 border border-white/50">
                    <div className="flex flex-col items-center mb-8">
                        <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                        >
                            <Stethoscope className="w-8 h-8 text-white" />
                        </motion.div>
                        <motion.h1 className="text-3xl font-bold text-[#0F172A]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            {t('auth.login.doctor_title', 'Doctor Login')}
                        </motion.h1>
                        <motion.p className="text-[#64748B] mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                            {t('auth.login.doctor_subtitle', 'Access your Netra AI practice portal')}
                        </motion.p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
                        <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <Label htmlFor="email">{t('auth.login.email', 'Email Address')}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="doctor@hospital.com"
                                    autoComplete="email"
                                    {...register("email")}
                                    className={`pl-11 focus:ring-2 focus:ring-[#0EA5E9]/30 transition-shadow ${errors.email ? 'border-red-500 focus:ring-red-500/30' : ''}`}
                                />
                            </div>
                            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                        </motion.div>

                        <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                            <Label htmlFor="password">{t('auth.login.password', 'Password')}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    {...register("password")}
                                    className={`pl-11 pr-11 focus:ring-2 focus:ring-[#0EA5E9]/30 transition-shadow ${errors.password ? 'border-red-500 focus:ring-red-500/30' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0EA5E9] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] text-white py-6 text-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                                disabled={loading || isSubmitting}
                            >
                                {loading || isSubmitting ? t('auth.login.signing_in', 'Signing in...') : t('auth.login.login_button', 'Login')}
                            </Button>
                        </motion.div>
                    </form>

                    <motion.div className="mt-6 text-center space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                        <p className="text-sm text-[#64748B]">
                            {t('auth.login.new_to_netra', 'New to Netra AI?')}{" "}
                            <Link to="/signup/doctor" className="text-[#0EA5E9] font-semibold hover:underline">
                                {t('auth.login.apply_to_join', 'Apply to Join')}
                            </Link>
                        </p>
                        <p className="text-sm text-[#64748B]">
                            {t('auth.login.are_patient', 'Are you a patient?')}{" "}
                            <Link to="/login/patient" className="text-[#0D9488] font-semibold hover:underline">
                                {t('auth.login.patient_login', 'Patient Login')}
                            </Link>
                        </p>
                    </motion.div>
                </Card>
            </motion.div>
        </div>
    );
}
