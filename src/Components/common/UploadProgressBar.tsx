import { Progress } from "antd";

export function UploadProgressBar({
  active,
  percent,
}: {
  active: boolean;
  percent: number;
}) {
  if (!active) return null;
  return (
    <Progress
      percent={Math.max(0, Math.min(100, percent))}
      size="small"
      status={percent >= 100 ? "success" : "active"}
      style={{ marginTop: 8, maxWidth: 280 }}
    />
  );
}
