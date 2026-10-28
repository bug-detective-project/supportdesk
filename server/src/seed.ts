import type { TicketPriority, TicketStatus } from './types.ts';

export interface SeedEmployee {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export interface SeedTicket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: number | null;
  createdAt: string;
  updatedAt: string;
}

export const employees: SeedEmployee[] = [
  { id: 1, name: 'Maya Chen', email: 'maya.chen@supportdesk.example', active: true },
  { id: 2, name: 'Daniel Okafor', email: 'daniel.okafor@supportdesk.example', active: true },
  { id: 3, name: 'Priya Raman', email: 'priya.raman@supportdesk.example', active: true },
  { id: 4, name: 'Lucas Moreau', email: 'lucas.moreau@supportdesk.example', active: false },
  { id: 5, name: 'Sofia Alvarez', email: 'sofia.alvarez@supportdesk.example', active: true },
];

export const tickets: SeedTicket[] = [
  {
    id: 1,
    title: 'Login page times out on mobile Safari',
    description:
      'Several customers on iOS report that the login page spins for about 30 seconds and then shows a timeout message. Desktop browsers are not affected.',
    status: 'Open',
    priority: 'High',
    assigneeId: 1,
    createdAt: '2025-03-03T09:12:00.000Z',
    updatedAt: '2025-03-03T09:12:00.000Z',
  },
  {
    id: 2,
    title: 'Invoice PDF shows the wrong billing address',
    description:
      'Customers who changed their billing address last month still see the old address on downloaded invoice PDFs. The address in account settings is correct.',
    status: 'In Progress',
    priority: 'Medium',
    assigneeId: 2,
    createdAt: '2025-03-03T11:40:00.000Z',
    updatedAt: '2025-03-04T08:05:00.000Z',
  },
  {
    id: 3,
    title: 'Password reset email never arrives',
    description:
      'A customer requested a password reset four times today and did not receive any email. Spam folder was checked. Other transactional emails are being delivered.',
    status: 'Open',
    priority: 'High',
    assigneeId: 3,
    createdAt: '2025-03-04T14:22:00.000Z',
    updatedAt: '2025-03-04T14:22:00.000Z',
  },
  {
    id: 4,
    title: 'Dark mode setting resets after refresh',
    description:
      'Turning on dark mode works until the page is refreshed, then the app switches back to the light theme. Happens in Chrome and Firefox.',
    status: 'Open',
    priority: 'Low',
    assigneeId: null,
    createdAt: '2025-03-05T10:03:00.000Z',
    updatedAt: '2025-03-05T10:03:00.000Z',
  },
  {
    id: 5,
    title: 'CSV export fails for report_final.csv',
    description:
      'Exporting the monthly report with the default file name report_final.csv shows "Something went wrong". Renaming the export makes it work.',
    status: 'In Progress',
    priority: 'Medium',
    assigneeId: 1,
    createdAt: '2025-03-05T16:48:00.000Z',
    updatedAt: '2025-03-06T09:30:00.000Z',
  },
  {
    id: 6,
    title: 'Cannot login with SSO after domain change',
    description:
      'After the customer moved to a new email domain, their team can no longer sign in through single sign-on. The identity provider shows a successful authentication.',
    status: 'Open',
    priority: 'High',
    assigneeId: 5,
    createdAt: '2025-03-06T08:15:00.000Z',
    updatedAt: '2025-03-06T08:15:00.000Z',
  },
  {
    id: 7,
    title: 'Typo in the welcome email subject line',
    description:
      'The subject of the welcome email reads "Welcom to your new workspace". Reported by three new customers this week.',
    status: 'Open',
    priority: 'Low',
    assigneeId: null,
    createdAt: '2025-03-06T13:27:00.000Z',
    updatedAt: '2025-03-06T13:27:00.000Z',
  },
  {
    id: 8,
    title: 'Discount code for 100% off is rejected at checkout',
    description:
      'Partner codes that give a 100% discount are rejected with "Invalid amount". Codes with smaller discounts are accepted.',
    status: 'Closed',
    priority: 'Medium',
    assigneeId: 2,
    createdAt: '2025-03-07T09:55:00.000Z',
    updatedAt: '2025-03-10T15:20:00.000Z',
  },
  {
    id: 9,
    title: 'Dashboard charts load slowly for large accounts',
    description:
      'Accounts with more than 50,000 records wait over 20 seconds for the dashboard charts to appear. Smaller accounts load in about two seconds.',
    status: 'In Progress',
    priority: 'High',
    assigneeId: 3,
    createdAt: '2025-03-07T15:10:00.000Z',
    updatedAt: '2025-03-08T10:00:00.000Z',
  },
  {
    id: 10,
    title: 'Two-factor codes rejected after phone change',
    description:
      'A customer moved their authenticator app to a new phone and every code is now rejected. Recovery codes still work.',
    status: 'Open',
    priority: 'High',
    assigneeId: 5,
    createdAt: '2025-03-10T08:42:00.000Z',
    updatedAt: '2025-03-10T08:42:00.000Z',
  },
  {
    id: 11,
    title: 'Notification emails are sent twice',
    description:
      'Customers receive two copies of every comment notification, a few seconds apart. Started after the last maintenance window.',
    status: 'Closed',
    priority: 'Low',
    assigneeId: 1,
    createdAt: '2025-03-10T12:05:00.000Z',
    updatedAt: '2025-03-12T17:45:00.000Z',
  },
  {
    id: 12,
    title: 'Profile photo upload hangs on large images',
    description:
      'Uploading a profile photo larger than about 5 MB keeps the progress bar at the same spot forever. No error message is shown.',
    status: 'Open',
    priority: 'Medium',
    assigneeId: null,
    createdAt: '2025-03-11T10:18:00.000Z',
    updatedAt: '2025-03-11T10:18:00.000Z',
  },
  {
    id: 13,
    title: 'Search ignores accented characters',
    description:
      'Searching for "Jose" does not find customers named "José". Customers in Brazil and Spain have asked for this to be fixed.',
    status: 'In Progress',
    priority: 'Low',
    assigneeId: 2,
    createdAt: '2025-03-12T09:00:00.000Z',
    updatedAt: '2025-03-13T11:25:00.000Z',
  },
  {
    id: 14,
    title: 'Mobile app crashes when opening attachments',
    description:
      'The Android app closes immediately when a customer taps a PDF attachment in a ticket conversation. Images open normally.',
    status: 'Open',
    priority: 'High',
    assigneeId: null,
    createdAt: '2025-03-13T14:36:00.000Z',
    updatedAt: '2025-03-13T14:36:00.000Z',
  },
  {
    id: 15,
    title: 'Admin session expires too quickly',
    description:
      'Administrators are signed out after about five minutes of inactivity, even though the session timeout is set to one hour.',
    status: 'Closed',
    priority: 'Medium',
    assigneeId: 3,
    createdAt: '2025-03-14T08:50:00.000Z',
    updatedAt: '2025-03-17T09:40:00.000Z',
  },
];
