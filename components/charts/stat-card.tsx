import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingDown, TrendingUp } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

export function StatCard({ title, value, change, icon, trend }: StatCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <span className="text-2xl font-bold text-card-foreground">{value}</span>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {trend === "up" ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : trend === "down" ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                ) : null}
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend === "up" && "text-emerald-600 dark:text-emerald-400",
                    trend === "down" && "text-red-600 dark:text-red-400",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {change > 0 ? "+" : ""}{change}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
