import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
document.documentElement.classList.add(
  "font-sans",
  "[&::view-transition-group(*)]:duration-150"
)
document.body.classList.add(
  "bg-background",
  "text-foreground",
  "[:where(&)_*]:border-border",
  "[:where(&)_*]:outline-ring/50"
)
ReactDOM.createRoot(document.getElementById("root")!).render(<App />)
