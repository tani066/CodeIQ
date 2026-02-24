
import { Loader2 } from "lucide-react"

export function Loader({ text }) {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
            <p className="text-muted-foreground animate-pulse">{text || "Loading..."}</p>
        </div>
    )
}
