import { Navigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";

const SessionGuard = ({ children, requireActive }) => {
  const { activeSession } = useSession();

  // Si on exige une session active mais qu'il n'y en a pas
  if (requireActive && !activeSession) {
    return <Navigate to="/" replace />;
  }

  // Si on exige qu'il n'y ait PAS de session mais qu'il y en a une
  if (!requireActive && activeSession) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SessionGuard;