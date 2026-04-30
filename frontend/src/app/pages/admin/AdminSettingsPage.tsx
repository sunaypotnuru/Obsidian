import { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, Bell, Key, Check, AlertCircle, Globe, Clock, Share2, Plus, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useSettingsStore, PlatformSettings } from '../../../lib/settingsStore';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Settings state types
type SecuritySettings = { twoFA: boolean; sessionTimeout: number; };
type NotifSettings = { emailAlerts: boolean; smsAlerts: boolean; };
type SystemSettings = { timezone: string; currency: string; };

export default function AdminSettingsPage() {
    const { t } = useTranslation();
    const [security, setSecurity] = useState<SecuritySettings>({ twoFA: false, sessionTimeout: 60 });
    const [notif, setNotif] = useState<NotifSettings>({ emailAlerts: true, smsAlerts: false });
    const [system, setSystem] = useState<SystemSettings>({ timezone: 'Asia/Kolkata', currency: 'INR' });
    const { settings, updateSettings } = useSettingsStore();
    const [platform, setPlatform] = useState<PlatformSettings>(settings);

    useEffect(() => {
        if (settings) setPlatform(settings);
    }, [settings]);

    const [activePanel, setActivePanel] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSavePlatform = async () => {
        try {
            setSaving(true);
            await updateSettings(platform);
            toast.success(t("admin.settings.platform_saved", "Platform config saved successfully"));
            setActivePanel(null);
        } catch (error) {
            toast.error(t("admin.settings.platform_failed", "Failed to save platform config"));
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async (section: string) => {
        setSaving(true);
        // Simulate API call — replace with real endpoint when backend settings table exists
        await new Promise(r => setTimeout(r, 800));
        setSaving(false);
        toast.success(t("admin.settings.section_saved", "{{section}} settings saved successfully", { section }));
        setActivePanel(null);
    };

    const cards = [
        {
            id: 'security',
            icon: Shield,
            color: 'blue',
            title: t("admin.settings.security.title", "Security & Access"),
            desc: t("admin.settings.security.desc", "Configure role-based access control and 2FA requirements for staff accounts."),
            panel: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-[#0F172A]">{t("admin.settings.security.two_fa", "Two-Factor Authentication (2FA)")}</p>
                            <p className="text-sm text-[#64748B]">{t("admin.settings.security.two_fa_desc", "Require 2FA for all admin accounts")}</p>
                        </div>
                        <button
                            onClick={() => setSecurity(s => ({ ...s, twoFA: !s.twoFA }))}
                            className={`w-12 h-6 rounded-full transition-all ${security.twoFA ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${security.twoFA ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="font-semibold text-[#0F172A] mb-2">{t("admin.settings.security.session_timeout", "Session Timeout (minutes)")}</p>
                        <input type="number" min={15} max={480} value={security.sessionTimeout}
                            onChange={e => setSecurity(s => ({ ...s, sessionTimeout: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <Button onClick={() => handleSave(t("common.security", "Security"))} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        {saving ? t("common.saving", "Saving...") : <><Check className="w-4 h-4 mr-2" />{t("admin.settings.security.save", "Save Security Settings")}</>}
                    </Button>
                </div>
            )
        },
        {
            id: 'notifications',
            icon: Bell,
            color: 'purple',
            title: t("admin.settings.notif.title", "Global Notifications"),
            desc: t("admin.settings.notif.desc", "Manage SMS and Email notification templates sent to patients and doctors."),
            panel: (
                <div className="space-y-4">
                    {[
                        { key: 'emailAlerts', label: t("admin.settings.notif.email", "Email Notifications"), sub: t("admin.settings.notif.email_desc", "Appointment reminders, scan results, prescriptions") },
                        { key: 'smsAlerts', label: t("admin.settings.notif.sms", "SMS Notifications"), sub: t("admin.settings.notif.sms_desc", "Urgent alerts via SMS (requires Twilio/SendGrid setup)") },
                    ].map(({ key, label, sub }) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-semibold text-[#0F172A]">{label}</p>
                                <p className="text-sm text-[#64748B]">{sub}</p>
                            </div>
                            <button
                                onClick={() => setNotif(n => ({ ...n, [key]: !n[key as keyof NotifSettings] }))}
                                className={`w-12 h-6 rounded-full transition-all ${notif[key as keyof NotifSettings] ? 'bg-purple-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${notif[key as keyof NotifSettings] ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    ))}
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">{t("admin.settings.notif.warning", "SMS requires Twilio credentials in .env. Email requires SendGrid setup.")}</p>
                    </div>
                    <Button onClick={() => handleSave(t("common.notifications", "Notification"))} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        {saving ? t("common.saving", "Saving...") : <><Check className="w-4 h-4 mr-2" />{t("admin.settings.notif.save", "Save Notification Settings")}</>}
                    </Button>
                </div>
            )
        },
        {
            id: 'api',
            icon: Key,
            color: 'teal',
            title: t("admin.settings.api.title", "API Keys & Integrations"),
            desc: t("admin.settings.api.desc", "Manage connection keys for LiveKit (Video), SendGrid (Emails), and ML Models."),
            panel: (
                <div className="space-y-4">
                    {[
                        { label: t("admin.settings.api.livekit_key", "LiveKit API Key"), placeholder: 'LIVEKIT_API_KEY', envKey: 'LIVEKIT_API_KEY' },
                        { label: t("admin.settings.api.livekit_secret", "LiveKit Secret"), placeholder: 'LIVEKIT_API_SECRET', envKey: 'LIVEKIT_API_SECRET' },
                        { label: t("admin.settings.api.livekit_url", "LiveKit Server URL"), placeholder: 'wss://your-server.livekit.cloud', envKey: 'LIVEKIT_URL' },
                        { label: t("admin.settings.api.ml_url", "ML Service URL"), placeholder: 'http://localhost:8001', envKey: 'ANEMIA_API_URL' },
                    ].map(({ label, placeholder, envKey }) => (
                        <div key={envKey} className="space-y-1">
                            <p className="text-sm font-semibold text-[#0F172A]">{label}</p>
                            <input type="password" placeholder={placeholder}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm font-mono" />
                            <p className="text-xs text-[#64748B]">{t("admin.settings.api.env_desc_1", "Set in ")}<code className="bg-gray-100 px-1 rounded">.env</code>{t("admin.settings.api.env_desc_2", " as ")}<code className="bg-gray-100 px-1 rounded">{envKey}</code></p>
                        </div>
                    ))}
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">{t("admin.settings.api.restart_warning", "API key changes require restarting the backend server to take effect.")}</p>
                    </div>
                    <Button onClick={() => handleSave(t("common.api_keys", "API Keys"))} disabled={saving} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                        {saving ? t("common.saving", "Saving...") : <><Check className="w-4 h-4 mr-2" />{t("admin.settings.api.save", "Save API Keys")}</>}
                    </Button>
                </div>
            )
        },
        {
            id: 'system',
            icon: Settings,
            color: 'slate',
            title: t("admin.settings.system.title", "System Preferences"),
            desc: t("admin.settings.system.desc", "Adjust timezone, base currency, and regional compliance settings."),
            panel: (
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="font-semibold text-[#0F172A] flex items-center gap-2"><Clock className="w-4 h-4" />{t("admin.settings.system.timezone", "Timezone")}</p>
                        <select value={system.timezone} onChange={e => setSystem(s => ({ ...s, timezone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm">
                            <option value="Asia/Kolkata">Asia/Kolkata (IST UTC+5:30)</option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <p className="font-semibold text-[#0F172A] flex items-center gap-2"><Globe className="w-4 h-4" />{t("admin.settings.system.currency", "Currency")}</p>
                        <select value={system.currency} onChange={e => setSystem(s => ({ ...s, currency: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-sm">
                            <option value="INR">INR — Indian Rupee (₹)</option>
                            <option value="USD">USD — US Dollar ($)</option>
                            <option value="EUR">EUR — Euro (€)</option>
                            <option value="GBP">GBP — British Pound (£)</option>
                        </select>
                    </div>
                    <Button onClick={() => handleSave(t("common.system", "System"))} disabled={saving} className="w-full bg-slate-700 hover:bg-slate-800 text-white">
                        {saving ? t("common.saving", "Saving...") : <><Check className="w-4 h-4 mr-2" />{t("admin.settings.system.save", "Save System Preferences")}</>}
                    </Button>
                </div>
            )
        },
        {
            id: 'site_settings',
            icon: Share2,
            color: 'teal',
            title: t("admin.settings.public.title", "Public Platform Config"),
            desc: t("admin.settings.public.desc", "Manage social links, GitHub links, and Author/Team information for public pages."),
            panel: (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    <div className="space-y-3">
                        <p className="font-semibold text-[#0F172A]">{t("admin.settings.public.social", "Social Links")}</p>
                        <input type="text" placeholder={t("admin.settings.public.github_url", "GitHub URL")} value={platform.github_url} onChange={e => setPlatform(p => ({ ...p, github_url: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                        <input type="text" placeholder={t("admin.settings.public.linkedin_url", "LinkedIn URL")} value={platform.linkedin_url} onChange={e => setPlatform(p => ({ ...p, linkedin_url: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                        <input type="text" placeholder={t("admin.settings.public.twitter_url", "Twitter URL")} value={platform.twitter_url} onChange={e => setPlatform(p => ({ ...p, twitter_url: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-[#0F172A]">{t("admin.settings.public.team", "Team Members")}</p>
                            <Button variant="outline" size="sm" onClick={() => setPlatform(p => ({ ...p, team_members: [...p.team_members, { name: '', role: '', details: '' }] }))}>
                                <Plus className="w-3 h-3 mr-1" /> {t("common.add", "Add")}
                            </Button>
                        </div>
                        {platform.team_members.map((member, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-2 relative">
                                <button onClick={() => setPlatform(p => ({ ...p, team_members: p.team_members.filter((_, i) => i !== idx) }))} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <input type="text" placeholder={t("common.name", "Name")} value={member.name} onChange={e => { const newTeam = [...platform.team_members]; newTeam[idx].name = e.target.value; setPlatform(p => ({ ...p, team_members: newTeam })); }} className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white text-sm" />
                                <input type="text" placeholder={t("admin.settings.public.role", "Role (e.g. Lead Developer)")} value={member.role} onChange={e => { const newTeam = [...platform.team_members]; newTeam[idx].role = e.target.value; setPlatform(p => ({ ...p, team_members: newTeam })); }} className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white text-sm" />
                                <textarea placeholder={t("admin.settings.public.details", "Details/Bio")} value={member.details} onChange={e => { const newTeam = [...platform.team_members]; newTeam[idx].details = e.target.value; setPlatform(p => ({ ...p, team_members: newTeam })); }} className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white text-sm min-h-[60px]" />
                            </div>
                        ))}
                    </div>

                    <Button onClick={handleSavePlatform} disabled={saving} className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-4">
                        {saving ? t("common.saving", "Saving...") : <><Check className="w-4 h-4 mr-2" />{t("admin.settings.public.save", "Save Platform Config")}</>}
                    </Button>
                </div>
            )
        },
    ];

    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        teal: 'bg-teal-50 text-teal-600',
        slate: 'bg-slate-100 text-slate-600',
    };
    const btnColorMap: Record<string, string> = {
        blue: 'text-blue-600 hover:text-blue-700',
        purple: 'text-purple-600 hover:text-purple-700',
        teal: 'text-teal-600 hover:text-teal-700',
        slate: 'text-slate-600 hover:text-slate-700',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">{t("admin.settings.page_title", "Platform Settings")}</h1>
                <p className="text-[#64748B]">{t("admin.settings.page_subtitle", "Manage global configuration and security preferences")}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    const isOpen = activePanel === card.id;
                    return (
                        <motion.div key={card.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card className="p-6 bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm h-full flex flex-col">
                                <div className={`w-12 h-12 rounded-xl ${colorMap[card.color]} flex items-center justify-center mb-4`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-[#0F172A] mb-2">{card.title}</h3>
                                <p className="text-[#64748B] text-sm mb-4 flex-1">{card.desc}</p>

                                {isOpen ? (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 border-t pt-4">
                                        {card.panel}
                                        <button onClick={() => setActivePanel(null)} className="text-xs text-gray-400 mt-3 hover:text-gray-600 w-full text-center">
                                            ✕ {t("common.close", "Close")}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <button onClick={() => setActivePanel(card.id)} className={`text-sm font-semibold ${btnColorMap[card.color]}`}>
                                        {t("common.configure", "Configure")} →
                                    </button>
                                )}
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
