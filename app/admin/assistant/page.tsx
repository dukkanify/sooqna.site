import { AdminAssistantPanel } from "@/features/admin/components/AdminAssistantPanel";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminAssistantPage() {
  return (
    <AdminShell
      activePath="/admin/assistant"
      description="مساعد ذكي يشرح أقسام لوحة التحكم ويرشدك خطوة بخطوة للوصول السريع للمعلومة والإجراء الصحيح."
      title="مساعد التعلّم"
    >
      <AdminAssistantPanel />
    </AdminShell>
  );
}
