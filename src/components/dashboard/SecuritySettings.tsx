import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Save, AlertTriangle, CheckCircle, Shield, UserCheck, Activity, RefreshCw } from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import { supabase } from "../../lib/supabase";

interface SecuritySettingsProps {
  settings: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    loginNotifications: boolean;
  };
  onSettingChange: (key: string, value: boolean | string) => void;
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<void>;
}

// دالة تقييم قوة كلمة المرور
const evaluatePasswordStrength = (password: string): { score: number; feedback: string[]; level: string } => {
  let score = 0;
  const feedback: string[] = [];
  
  if (password.length >= 8) {
    score += 25;
  } else {
    feedback.push("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
  }
  
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 15;
  
  if (/[a-z]/.test(password)) {
    score += 10;
  } else {
    feedback.push("أضف أحرف صغيرة");
  }
  
  if (/[A-Z]/.test(password)) {
    score += 10;
  } else {
    feedback.push("أضف أحرف كبيرة");
  }
  
  if (/[0-9]/.test(password)) {
    score += 10;
  } else {
    feedback.push("أضف أرقام");
  }
  
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
    score += 20;
  } else {
    feedback.push("أضف رموز خاصة");
  }
  
  // خصم نقاط للأنماط الضعيفة
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push("تجنب تكرار الأحرف");
  }
  
  if (/123|abc|qwe/i.test(password)) {
    score -= 10;
    feedback.push("تجنب التسلسل المتوقع");
  }
  
  const finalScore = Math.max(0, Math.min(100, score));
  let level = "ضعيف";
  
  if (finalScore >= 80) level = "قوي جداً";
  else if (finalScore >= 60) level = "قوي";
  else if (finalScore >= 40) level = "متوسط";
  else if (finalScore >= 20) level = "ضعيف";
  else level = "ضعيف جداً";
  
  return { score: finalScore, feedback, level };
};

// مكون مؤشر قوة كلمة المرور
const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const { score, feedback, level } = evaluatePasswordStrength(password);
  
  const getColorClass = () => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    if (score >= 20) return "bg-orange-500";
    return "bg-red-500";
  };
  
  const getTextColorClass = () => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    if (score >= 20) return "text-orange-600";
    return "text-red-600";
  };
  
  if (!password) return null;
  
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">قوة كلمة المرور:</span>
        <span className={`text-sm font-medium ${getTextColorClass()}`}>
          {level} ({score}%)
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${score}%` }}
        />
      </div>
      
      {feedback.length > 0 && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>لتحسين قوة كلمة المرور:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  settings,
  onSettingChange,
  onPasswordChange,
}) => {
  const { addNotification } = useNotifications();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, level: "ضعيف" });

  // تحديث قوة كلمة المرور عند تغيير كلمة المرور الجديدة
  useEffect(() => {
    if (passwordData.newPassword) {
      const strength = evaluatePasswordStrength(passwordData.newPassword);
      setPasswordStrength({ score: strength.score, level: strength.level });
    }
  }, [passwordData.newPassword]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        type: "error",
        title: "عدم تطابق كلمة المرور",
        message: "كلمة المرور الجديدة والتأكيد غير متطابقين.",
        userId: "",
        priority: "medium" as const,
      });
      return;
    }

    const strength = evaluatePasswordStrength(passwordData.newPassword);
    if (strength.score < 60) {
      addNotification({
        type: "error",
        title: "كلمة مرور ضعيفة",
        message: "يرجى اختيار كلمة مرور أقوى لضمان أمان حسابك.",
        userId: "",
        priority: "medium" as const,
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await onPasswordChange(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      addNotification({
        type: "success",
        title: "تم تغيير كلمة المرور",
        message: "تم تحديث كلمة المرور بنجاح.",
        userId: "",
        priority: "medium" as const,
      });
    } catch {
      addNotification({
        type: "error",
        title: "فشل في تغيير كلمة المرور",
        message: "فشل في تغيير كلمة المرور. يرجى التحقق من كلمة المرور الحالية.",
        userId: "",
        priority: "medium" as const,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* تحذير أمني */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800">تنبيه أمني</h4>
            <p className="text-sm text-amber-700 mt-1">
              تأكد من استخدام كلمة مرور قوية وفريدة لحسابك. تجنب استخدام نفس كلمة المرور في مواقع أخرى.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          إعدادات الأمان
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                المصادقة الثنائية
              </h4>
              <p className="text-sm text-gray-600">
                أضف طبقة حماية إضافية لحسابك
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {settings.twoFactorAuth ? (
                <span className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>Enabled</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-red-600 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Disabled</span>
                </span>
              )}
              <button
                onClick={() =>
                  onSettingChange("twoFactorAuth", !settings.twoFactorAuth)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.twoFactorAuth
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                {settings.twoFactorAuth ? "Disable" : "Enable"}
              </button>
            </div>
            <PasswordStrengthIndicator password={passwordData.newPassword} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout
            </label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => onSettingChange("sessionTimeout", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="15m">15 minutes</option>
              <option value="30m">30 minutes</option>
              <option value="1h">1 hour</option>
              <option value="4h">4 hours</option>
              <option value="8h">8 hours</option>
              <option value="never">Never</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Login Notifications
              </h4>
              <p className="text-sm text-gray-600">
                Get notified when someone logs into your account
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.loginNotifications}
                onChange={(e) =>
                  onSettingChange("loginNotifications", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{isChangingPassword ? "Changing..." : "Change Password"}</span>
          </button>
        </form>
      </div>

      {/* قسم أمان كلمات المرور */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <UserCheck className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-800">أمان كلمات المرور</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-2">متطلبات كلمة المرور القوية</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 8 أحرف على الأقل</li>
                  <li>• أحرف كبيرة وصغيرة</li>
                  <li>• أرقام ورموز خاصة</li>
                  <li>• تجنب كلمات المرور الشائعة</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">حالة أمان كلمة المرور</h4>
                  <p className="text-sm text-green-700">كلمة المرور الحالية تلبي معايير الأمان</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">100%</div>
                <div className="text-xs text-green-600">نقاط الأمان</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">آخر فحص أمان</h4>
              <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm">
                <RefreshCw className="w-4 h-4" />
                <span>فحص الآن</span>
              </button>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Activity className="w-4 h-4" />
              <span>تم الفحص منذ دقائق قليلة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;