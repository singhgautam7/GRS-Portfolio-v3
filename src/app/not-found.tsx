import type { Metadata } from 'next';
import { NotFoundClient } from '@/components/chrome/NotFoundClient';

export const metadata: Metadata = {
  title: '404: command not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundClient />;
}
