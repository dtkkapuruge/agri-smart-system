import { redirect, notFound } from 'next/navigation';

export default function DevPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_BACKDOOR !== 'true') {
    notFound();
  }
  redirect('/dev/components');
}
