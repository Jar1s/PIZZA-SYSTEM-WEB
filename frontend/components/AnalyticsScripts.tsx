'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { useCookieSettings } from '@/hooks/useCookieSettings';
import { AnalyticsConfig } from '@pizza-ecosystem/shared';

/**
 * The single loader for all measurement scripts. Nothing renders until the
 * visitor grants the matching cookie-consent category:
 *  - analytics  -> Google Analytics 4, Google Tag Manager
 *  - marketing  -> Facebook Pixel, TikTok Pixel, LinkedIn Insight
 *
 * Configuration comes from the tenant theme (admin -> Brands -> Analytics);
 * NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_FB_PIXEL_ID env vars are a fallback for
 * brands without an admin-side config. Consent changes apply immediately via
 * the cookie-settings event from useCookieSettings.
 */
export function AnalyticsScripts() {
  const { tenant } = useTenant();
  const { settings, isLoaded } = useCookieSettings();
  const pathname = usePathname();

  const theme =
    tenant && typeof tenant.theme === 'object' && tenant.theme !== null
      ? (tenant.theme as any)
      : {};
  const analyticsConfig: AnalyticsConfig = theme.analyticsConfig || {};

  const gaMeasurementId =
    (analyticsConfig.googleAnalytics?.enabled && analyticsConfig.googleAnalytics.measurementId) ||
    process.env.NEXT_PUBLIC_GA_ID ||
    null;
  const fbPixelId =
    (analyticsConfig.facebookPixel?.enabled && analyticsConfig.facebookPixel.pixelId) ||
    process.env.NEXT_PUBLIC_FB_PIXEL_ID ||
    null;

  const analyticsAllowed = isLoaded && settings.analytics;
  const marketingAllowed = isLoaded && settings.marketing;

  // SPA navigations do not reload the document, so report route changes to GA
  // manually once it is running.
  useEffect(() => {
    if (!analyticsAllowed || !gaMeasurementId) return;
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('config', gaMeasurementId, { page_path: pathname });
    }
  }, [analyticsAllowed, gaMeasurementId, pathname]);

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      {/* ---- analytics consent ---- */}

      {analyticsAllowed && gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}');
            `}
          </Script>
        </>
      )}

      {analyticsAllowed &&
        analyticsConfig.googleTagManager?.enabled &&
        analyticsConfig.googleTagManager.containerId && (
          <>
            <Script id="google-tag-manager" strategy="afterInteractive">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${analyticsConfig.googleTagManager.containerId}');
              `}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${analyticsConfig.googleTagManager.containerId}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          </>
        )}

      {/* ---- marketing consent ---- */}

      {marketingAllowed && fbPixelId && (
        <>
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {marketingAllowed &&
        analyticsConfig.tiktokPixel?.enabled &&
        analyticsConfig.tiktokPixel.pixelId && (
          <Script id="tiktok-pixel" strategy="afterInteractive">
            {`
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('${analyticsConfig.tiktokPixel.pixelId}');
                ttq.page();
              }(window, document, 'ttq');
            `}
          </Script>
        )}

      {marketingAllowed &&
        analyticsConfig.linkedinInsight?.enabled &&
        analyticsConfig.linkedinInsight.partnerId && (
          <Script id="linkedin-insight" strategy="afterInteractive">
            {`
              _linkedin_partner_id = "${analyticsConfig.linkedinInsight.partnerId}";
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push(_linkedin_partner_id);
              (function(l) {
              if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
              window.lintrk.q=[]}
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);})(window.lintrk);
            `}
          </Script>
        )}
    </>
  );
}
