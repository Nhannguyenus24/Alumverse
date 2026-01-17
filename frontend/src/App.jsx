import { RouterProvider } from "react-router/dom";
import { router } from "./routes";
import NotistackProvider from "./components/common/NotistackProvider";
const App = () => {
  return (
    <NotistackProvider>
      <RouterProvider router={router} />
    </NotistackProvider>
  );
};

export default App;