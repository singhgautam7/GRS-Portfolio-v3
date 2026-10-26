import type { Metadata } from 'next';
import { AskPage } from '@/features/ask/AskPage';

export const metadata: Metadata = {
  title: 'Ask Me Anything',
  description: 'Questions about Gautam’s experience, work and projects, answered right in your browser.',
};

export default function Page() {
  return <AskPage />;
}
