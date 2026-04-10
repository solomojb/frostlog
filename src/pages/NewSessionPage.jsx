import NewSessionForm from "../components/session/NewSessionForm";
import { NavPill } from "../components/layout/NavPill";
import { IcoHome } from "../components/ui/Icons";
import { useT } from "../context/LanguageContext";

function NewSessionPage() {
  const t = useT();
  return (
    <div className="h-screen flex items-stretch justify-between overflow-hidden">
      <div className="flex-shrink-0 flex items-center">
        <NavPill to="/" icon={<IcoHome />} label={t("nav_menu")} side="left" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-4 flex items-center justify-center">
        <div className="frost-block p-7 w-full max-w-sm">
          <h2 className="title-rune mb-6" style={{ fontSize: "1.25rem" }}>{t("page_new_session")}</h2>
          <NewSessionForm />
        </div>
      </div>
      <div style={{ width: 58, flexShrink: 0 }} />
    </div>
  );
}
export default NewSessionPage;
