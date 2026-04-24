import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import CampaignGuard from "./guards/CampaignGuard";
import SessionGuard from "./guards/SessionGuard";

import EntryPage from "./pages/EntryPage";
import MenuPage from "./pages/MenuPage";
import LastSessionPage from "./pages/LastSessionPage";
import NewSessionPage from "./pages/NewSessionPage";
import ActiveSessionPage from "./pages/ActiveSessionPage";
import ScenariosPage from "./pages/ScenariosPage";
import ScenarioStatsPage from "./pages/ScenarioStatsPage";
import NotesPage from "./pages/NotesPage";
import CompanyPage from "./pages/CompanyPage";
import ImportCampaignPage from "./pages/ImportCampaignPage";
import NewCampaignPage from "./pages/NewCampaignPage";

import { SessionProvider } from "./context/SessionContext";
import { ProgressProvider } from "./context/ProgressContext";
import { CompanyProvider } from "./context/CompanyContext";
import { ToastProvider } from "./context/ToastContext";
import { LanguageProvider } from "./context/LanguageContext";
import UpdateChecker from "./components/ui/UpdateChecker";
import WebBanner from "./components/ui/WebBanner";

const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;

function App() {
  return (
    <LanguageProvider>
    <UpdateChecker />
    <ToastProvider>
    <ProgressProvider>
    <CompanyProvider>
      <SessionProvider>
        <BrowserRouter basename={isTauri ? "" : "/frostlog/"}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/entry" element={<EntryPage />} />
              <Route path="/new-campaign" element={<NewCampaignPage />} />
              <Route path="/import-campaign" element={<ImportCampaignPage />} />
              <Route path="/" element={<CampaignGuard><MenuPage /></CampaignGuard>} />
              <Route path="/last-session" element={<CampaignGuard><LastSessionPage /></CampaignGuard>} />
              <Route path="/scenarios" element={<CampaignGuard><ScenariosPage /></CampaignGuard>} />
              <Route path="/notes" element={<CampaignGuard><NotesPage /></CampaignGuard>} />
<Route path="/company" element={<CampaignGuard><CompanyPage /></CampaignGuard>} />
              <Route path="/new-session" element={
                <CampaignGuard><SessionGuard requireActive={false}><NewSessionPage /></SessionGuard></CampaignGuard>
              } />
              <Route path="/active-session" element={
                <CampaignGuard><SessionGuard requireActive={true}><ActiveSessionPage /></SessionGuard></CampaignGuard>
              } />
              <Route path="/scenario-stats" element={
                <CampaignGuard><SessionGuard requireActive={true}><ScenarioStatsPage /></SessionGuard></CampaignGuard>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </CompanyProvider>
    </ProgressProvider>
    </ToastProvider>
    <WebBanner />
    </LanguageProvider>
  );
}

export default App;
