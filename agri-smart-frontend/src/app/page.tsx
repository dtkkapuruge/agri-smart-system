import { redirect } from 'next/navigation';

/**
 * Root page — redirect visitors to the login page.
 * Dashboard routing happens after auth.
 */
export default function HomePage() {
  redirect('/auth/login');
}
