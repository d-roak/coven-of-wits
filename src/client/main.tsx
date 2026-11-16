import "@fontsource/caprasimo"
import "@fontsource-variable/nunito"
import "./styles.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { installDiagnostics } from "./community/diagnostics"
const cleanupDiagnostics = installDiagnostics()
if (import.meta.hot) import.meta.hot.dispose(cleanupDiagnostics)
import { LangProvider } from "./i18n"

const root = document.getElementById("root")
if (!root) throw new Error("index.html is missing #root")
createRoot(root).render(
	<StrictMode>
		<LangProvider>
			<App />
		</LangProvider>
	</StrictMode>,
)
