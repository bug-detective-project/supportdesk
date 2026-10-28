export interface Employee {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const response = await fetch('/api/employees');
  if (!response.ok) {
    throw new Error(`Failed to load employees (${response.status})`);
  }
  return response.json();
}
