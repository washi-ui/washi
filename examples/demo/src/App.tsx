import { useMemo } from 'react';
import { WashiProvider, WashiFrame, WashiUI } from '@washi-ui/react';
import { MockAdapter } from './adapters/MockAdapter';

export default function App() {
  const adapter = useMemo(() => new MockAdapter('washi-demo-comments'), []);

  return (
    <WashiProvider adapter={adapter}>
      <div style={{ position: 'fixed', inset: 0 }}>
        <WashiFrame
          src='/sample-content.html'
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
      <WashiUI />
    </WashiProvider>
  );
}
