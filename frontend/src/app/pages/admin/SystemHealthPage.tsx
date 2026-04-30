import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Activity, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Server, Zap } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useTranslation } from "../../../lib/i18n";
import axios from "axios";

interface ServiceHealth {
  name: string;
  port: number;
  status: "healthy" | "unhealthy" | "down" | "checking";
  latency_ms?: number;
  last_check?: string;
  error?: string;
}

export default function SystemHealthPage() {
  const { t } = useTranslation();
  const [services, setServices] = useState<ServiceHealth[]>([
    { name: "Main API", port: 8000, status: "checking" },
    { name: "Anemia Detection", port: 8001, status: "checking" },
    { name: "Semantic Search", port: 8002, status: "checking" },
    { name: "Mental Health", port: 8003, status: "checking" },
    { name: "Mental Health Chatbot", port: 8004, status: "checking" },
    { name: "Emergency Services", port: 8005, status: "checking" },
    { name: "Parkinson's Voice", port: 8006, status: "checking" },
    { name: "Diabetic Retinopathy", port: 8007, status: "checking" },
  ]);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkServiceHealth = async (service: ServiceHealth): Promise<ServiceHealth> => {
    try {
      const start = Date.now();
      const response = await axios.get(`http://localhost:${service.port}/health`, {
        timeout: 5000,
      });
      const latency = Date.now() - start;

      return {
        ...service,
        status: response.status === 200 ? "healthy" : "unhealthy",
        latency_ms: latency,
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      return {
        ...service,
        status: "down",
        error: error instanceof Error ? error.message : "Unknown error",
        last_check: new Date().toISOString(),
      };
    }
  };

  const checkAllServices = async () => {
    setChecking(true);
    const results = await Promise.all(services.map(checkServiceHealth));
    setServices(results);
    setLastCheck(new Date());
    setChecking(false);
  };

  useEffect(() => {
    checkAllServices();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const downCount = services.filter((s) => s.status === "down").length;
  const overallHealth = (healthyCount / services.length) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "unhealthy":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "down":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 border-green-200";
      case "unhealthy":
        return "bg-yellow-50 border-yellow-200";
      case "down":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              {t('admin.system_health.title', 'System Health')}
            </h1>
            <p className="text-slate-600 mt-2">
              {t('admin.system_health.subtitle', 'Monitor all microservices and system components')}
            </p>
          </div>
          <Button
            onClick={checkAllServices}
            disabled={checking}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? t('admin.system_health.checking', 'Checking...') : t('admin.system_health.refresh', 'Refresh')}
          </Button>
        </div>

        {/* Overall Health */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">{t('admin.system_health.overall_health', 'Overall Health')}</p>
                <p className="text-3xl font-bold mt-1">{overallHealth.toFixed(0)}%</p>
              </div>
              <Server className="w-12 h-12 text-blue-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">{t('admin.system_health.healthy_services', 'Healthy Services')}</p>
                <p className="text-3xl font-bold mt-1">{healthyCount}/{services.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">{t('admin.system_health.down_services', 'Down Services')}</p>
                <p className="text-3xl font-bold mt-1">{downCount}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">{t('admin.system_health.last_check', 'Last Check')}</p>
                <p className="text-lg font-bold mt-1">
                  {lastCheck ? lastCheck.toLocaleTimeString() : '--:--:--'}
                </p>
              </div>
              <Clock className="w-12 h-12 text-purple-200" />
            </div>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`p-6 border-2 ${getStatusColor(service.status)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="font-bold text-slate-900">{service.name}</h3>
                      <p className="text-sm text-slate-600">Port {service.port}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full ${
                      service.status === "healthy"
                        ? "bg-green-100 text-green-700"
                        : service.status === "down"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {service.status.toUpperCase()}
                  </span>
                </div>

                {service.latency_ms && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Zap className="w-4 h-4" />
                    <span>{t('admin.system_health.latency', 'Latency')}: {service.latency_ms}ms</span>
                  </div>
                )}

                {service.last_check && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {t('admin.system_health.checked', 'Checked')}: {new Date(service.last_check).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {service.error && (
                  <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                    {service.error}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>{t('admin.system_health.note', 'Note')}:</strong>{' '}
            {t('admin.system_health.auto_refresh', 'Services are automatically checked every 30 seconds. Click refresh to check immediately.')}
          </p>
        </div>
      </div>
    </div>
  );
}
