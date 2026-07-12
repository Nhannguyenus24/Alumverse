import { useLocation } from "react-router";

const MentorshipLegacyRedirect = () => {
  const location = useLocation();
  const nextPath = location.pathname.replace(/\/development\/mentorship(?=\/|$)/, "/mentorship");

  return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />;
};

export default MentorshipLegacyRedirect;
