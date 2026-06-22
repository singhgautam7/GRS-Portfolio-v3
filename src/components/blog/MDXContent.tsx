'use client';

import { useMemo } from 'react';
import * as runtime from 'react/jsx-runtime';
import { mdxComponents } from './mdx-components';

/**
 * Renders Velite's compiled MDX `body` (a function-body string) with our custom
 * component map. The body is `new Function(code)(runtime).default`.
 */
export function MDXContent({ code }: { code: string }) {
  const Content = useMemo(() => {
    const fn = new Function(code) as (rt: typeof runtime) => { default: React.ComponentType<{ components?: unknown }> };
    return fn(runtime).default;
  }, [code]);

  return <Content components={mdxComponents} />;
}
