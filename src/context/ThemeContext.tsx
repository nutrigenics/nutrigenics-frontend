import { createContext, useContext, useEffect } from "react"

// Light theme only - no dark mode
type Theme = "light"

interface ThemeProviderProps {
    children: React.ReactNode
}

interface ThemeProviderState {
    theme: Theme
}

const initialState: ThemeProviderState = {
    theme: "light",
}

const ThemeContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children }: ThemeProviderProps) {
    useEffect(() => {
        // Always ensure light mode is set
        const root = window.document.documentElement
        root.classList.remove("dark")
        root.classList.add("light")

        // Clear any stored theme preference
        localStorage.removeItem("vite-ui-theme")
    }, [])

    const value = {
        theme: "light" as Theme,
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
