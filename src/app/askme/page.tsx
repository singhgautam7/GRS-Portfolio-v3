import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AskClient } from './AskClient';

export const metadata: Metadata = {
  title: 'Ask Me Anything',
  description: "Ask Gautam's on-device assistant about his experience, work and projects.",
};

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <AskClient />
    </Suspense>
  );
}
