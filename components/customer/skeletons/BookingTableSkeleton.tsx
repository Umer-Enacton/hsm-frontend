export function BookingsTableSkeleton({ rows = 5 }) {
  return (
    <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[1%] py-4 px-4"></TableHead>
            <TableHead className="w-[35%] py-4 px-4">Service</TableHead>
            <TableHead className="w-[25%] py-4 px-4">Provider</TableHead>
            <TableHead className="w-[20%] py-4 px-4">Date & Time</TableHead>
            <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
            <TableHead className="w-[9%] py-4 px-4 text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <BookingsTableSkeletonRow key={i} index={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
