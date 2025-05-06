
interface DueDateFormatterProps {
  assignments: any[];
}

const DueDateFormatter = ({ assignments }: DueDateFormatterProps) => {
  if (assignments.length === 0) return <>—</>;
  
  const dueDates = assignments
    .filter(a => a.dueDate)
    .map(a => new Date(a.dueDate));
  
  if (dueDates.length === 0) return <>No due date</>;
  
  // Get the earliest due date
  const earliestDueDate = new Date(Math.min(...dueDates.map(d => d.getTime())));
  return <>{earliestDueDate.toLocaleDateString()}</>;
};

export default DueDateFormatter;
