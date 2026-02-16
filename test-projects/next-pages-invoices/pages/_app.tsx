import type { AppProps } from "next/app";
import Script from "next/script";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Script src="/ncodes-widget.js" strategy="beforeInteractive" />
      <Script id="ncodes-init" strategy="afterInteractive">{`
        NCodes.init({
          user: { id: '1', name: 'Demo User' },
          capabilityMapUrl: '/n.codes.capabilities.json',
          apiUrl: '/api/generate',
          mode: 'live',
          theme: 'dark',
        });
      `}</Script>
    </>
  );
}
