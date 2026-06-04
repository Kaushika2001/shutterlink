/** Build last-6-months chart rows from booking records */
export function buildMonthlyBookingChart(
  bookings: { service_date?: string; created_at?: string; status?: string; total_price?: number; total_amount?: number }[]
) {
  const rows: { name: string; bookings: number; revenue: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const name = d.toLocaleString('default', { month: 'short' });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const inMonth = bookings.filter((b) => {
      const raw = b.service_date || b.created_at;
      if (!raw) return false;
      const date = new Date(raw.includes('T') ? raw : `${raw}T12:00:00`);
      return date >= monthStart && date <= monthEnd;
    });

    const revenue = inMonth
      .filter((b) => b.status === 'completed' || b.status === 'confirmed')
      .reduce((s, b) => s + Number(b.total_price ?? b.total_amount ?? 0), 0);

    rows.push({ name, bookings: inMonth.length, revenue });
  }

  return rows;
}
