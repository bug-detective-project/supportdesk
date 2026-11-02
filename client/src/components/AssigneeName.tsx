import type { Employee } from '../api/employees.ts';

interface AssigneeNameProps {
  assignee: Employee | null;
}

export function AssigneeName({ assignee }: AssigneeNameProps) {
  return <>{assignee ? assignee.name : 'Unassigned'}</>;
}
