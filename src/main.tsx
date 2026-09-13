import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerOfflineWorker } from "./lib/registerOfflineWorker";

createRoot(document.getElementById("root")!).render(<App />);

registerOfflineWorker();
