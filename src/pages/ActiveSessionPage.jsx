import ActiveSessionForm from "../components/session/ActiveSessionForm";
import { NavPill } from "../components/layout/NavPill";
import { IcoHome } from "../components/ui/Icons";
import { useT } from "../context/LanguageContext";

function ActiveSessionPage() {
  const t = useT();
  return (
    <div className="h-screen flex items-stretch justify-between overflow-hidden">
      <div className="flex-shrink-0 flex items-center">
        <NavPill to="/" icon={<IcoHome />} label={t("nav_menu")} side="left" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-4">
        <div className="max-w-2xl mx-auto frost-block p-7">
          <h2 className="title-rune mb-6" style={{ fontSize: "1.25rem" }}>{t("nav_activeSession")}</h2>
          <ActiveSessionForm />
        </div>
      </div>
      <div style={{ width: 58, flexShrink: 0 }} />
    </div>
  );
}
export default ActiveSessionPage;
