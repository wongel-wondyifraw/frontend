import React from "react";
import zxcvbn from "zxcvbn";
import { Progress, Typography } from "antd";

const { Text } = Typography;

interface PasswordStrengthMeterProps {
  password?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const result = password ? zxcvbn(password) : { score: 0, feedback: { warning: "", suggestions: [] } };
  
  const getProgressStatus = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return "exception"; // Red
      case 2:
        return "normal"; // Blue
      case 3:
      case 4:
        return "success"; // Green
      default:
        return "normal";
    }
  };

  const getStrengthText = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "Too short";
    }
  };

  const getPercent = (score: number) => {
    return password ? Math.max((score / 4) * 100, 10) : 0;
  };

  const checks = [
    { label: "At least 8 characters", met: (password || "").length >= 8 },
    { label: "At least 1 uppercase letter", met: /[A-Z]/.test(password || "") },
    { label: "At least 1 lowercase letter", met: /[a-z]/.test(password || "") },
    { label: "At least 1 number", met: /[0-9]/.test(password || "") },
  ];

  return (
    <div style={{ marginTop: 8 }}>
      <Progress 
        percent={getPercent(result.score)} 
        showInfo={false} 
        status={getProgressStatus(result.score)}
        size="small"
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {password ? getStrengthText(result.score) : "Enter password"}
        </Text>
        {result.feedback.warning && (
          <Text type="danger" style={{ fontSize: 12 }}>
            {result.feedback.warning}
          </Text>
        )}
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {checks.map((check, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: check.met ? '#52c41a' : 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: `1px solid ${check.met ? '#52c41a' : '#d9d9d9'}`, background: check.met ? '#52c41a' : 'transparent', color: '#fff', fontSize: 10 }}>
              {check.met && '✓'}
            </span>
            {check.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
