import { Navigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";

function CampaignGuard({ children }) {
    const { campaignStarted } = useProgress();
    if (!campaignStarted) return <Navigate to="/entry" replace />;
    return children;
}

export default CampaignGuard;
