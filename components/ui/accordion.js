
"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext({})

const Accordion = ({ children, className, type = "single", collapsible, ...props }) => {
    const [openItem, setOpenItem] = React.useState(null)

    const toggleItem = (value) => {
        if (type === "single") {
            setOpenItem(openItem === value ? null : value)
        } else {
            // Handle multiple if needed, but for now single is fine
        }
    }

    return (
        <AccordionContext.Provider value={{ openItem, toggleItem }}>
            <div className={cn("space-y-1", className)} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    )
}

const AccordionItem = React.forwardRef(({ className, value, ...props }, ref) => (
    <div ref={ref} className={cn("border-b border-white/10", className)} {...props}>
        {/* Clone children to pass value? No, cleaner to just pass value to children or Context. 
          But standard Composition pattern uses Context. 
          We need to modify Trigger and Content to know their value.
      */}
        {React.Children.map(props.children, child => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, { value })
            }
            return child
        })}
    </div>
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef(({ className, children, value, ...props }, ref) => {
    const { openItem, toggleItem } = React.useContext(AccordionContext)
    const isOpen = openItem === value

    return (
        <div className="flex">
            <button
                ref={ref}
                onClick={() => toggleItem(value)}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:text-neon-green [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                data-state={isOpen ? "open" : "closed"}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground" />
            </button>
        </div>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef(({ className, children, value, ...props }, ref) => {
    const { openItem } = React.useContext(AccordionContext)
    const isOpen = openItem === value

    if (!isOpen) return null; // Simple unmount for now, or use css hidden for animation. 
    // For animation we need it mounted. 
    // Let's sticking to simple conditional rendering for MVP speed unless "Animate" is strictly required. 
    // "Accordion component... clicking it reveals the Model Answer". Reveal is key.

    return (
        <div
            ref={ref}
            className={cn(
                "overflow-hidden text-sm transition-all pb-4 pt-0 text-muted-foreground",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
