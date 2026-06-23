'use client';

import { motion } from 'motion/react';

export function AskmeSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{
        maxWidth: 840,
        margin: '0 auto',
        height: 'calc(100vh - 58px)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
        background: 'var(--bg)',
      }}
    >
      {/* Header skeleton */}
      <div
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 18px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        {/* Avatar skeleton */}
        <div
          className="grs-skel"
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            border: '1px solid var(--line-2)',
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            className="grs-skel"
            style={{
              width: 120,
              height: 14,
              borderRadius: 4,
              marginBottom: 6,
            }}
          />
          <div
            className="grs-skel"
            style={{
              width: 180,
              height: 10,
              borderRadius: 3,
            }}
          />
        </div>
        {/* Close button placeholder */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid var(--line)',
            background: 'var(--surface-2)',
          }}
        />
      </div>

      {/* Thread skeleton */}
      <div style={{ flex: 1, padding: '22px 18px 8px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* User message skeleton */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div
              className="grs-skel"
              style={{
                width: '40%',
                height: 38,
                borderRadius: '14px 14px 4px 14px',
                border: '1px solid var(--line)',
              }}
            />
          </div>
          {/* Assistant message skeleton */}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <div
              className="grs-skel"
              style={{
                width: 27,
                height: 27,
                borderRadius: 9,
                border: '1px solid var(--line-2)',
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                className="grs-skel"
                style={{
                  width: '70%',
                  height: 16,
                  borderRadius: 4,
                }}
              />
              <div
                className="grs-skel"
                style={{
                  width: '85%',
                  height: 16,
                  borderRadius: 4,
                }}
              />
              <div
                className="grs-skel"
                style={{
                  width: '50%',
                  height: 16,
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div
        style={{
          flex: 'none',
          padding: '8px 18px 18px',
          borderTop: '1px solid var(--line)',
          background: 'var(--bg)',
          paddingBottom: 'max(18px, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div
            className="grs-skel"
            style={{
              height: 10,
              width: 80,
              borderRadius: 3,
              marginBottom: 7,
            }}
          />
          <div
            className="grs-skel"
            style={{
              height: 54,
              borderRadius: 15,
              border: '1px solid var(--line-2)',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
