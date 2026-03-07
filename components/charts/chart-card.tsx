"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function ChartCard({ title, description, children, action }: ChartCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-card-foreground">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  )
}
