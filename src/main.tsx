import ReactDOM from "react-dom/client";

import App from "./app/App";
import "./app/styles/globals.css";
import { env } from "./lib/config/env";

document.title = env.appName;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
