'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCookieSettings } from '@/hooks/useCookieSettings';
import { useTenant } from '@/contexts/TenantContext';
import { isDarkTheme, getBackgroundClass, withTenantThemeDefaults } from '@/lib/tenant-utils';

export default function CookiePolicyPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const { tenant: tenantData, loading: tenantLoading } = useTenant();
  const isSlovak = language === 'sk';
  const [showCookieModal, setShowCookieModal] = useState(false);
  const { settings: cookieSettings, updateSettings, isLoaded } = useCookieSettings();
  const [localSettings, setLocalSettings] = useState(cookieSettings);
  
  // Update local settings when cookieSettings change
  useEffect(() => {
    if (isLoaded) {
      setLocalSettings(cookieSettings);
    }
  }, [isLoaded, cookieSettings]);

  // Get tenant slug from URL for fallback during loading
  const [tenantSlug, setTenantSlug] = useState<string>('pornopizza');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const params = new URLSearchParams(window.location.search);
      let slug = 'pornopizza';
      if (hostname.includes('pornopizza.sk') || hostname.includes('p0rnopizza.sk') || hostname.includes('pornopizza') || hostname.includes('p0rnopizza')) {
        slug = 'pornopizza';
      } else if (hostname.includes('pizzavnudzi.sk') || hostname.includes('pizzavnudzi')) {
        slug = 'pizzavnudzi';
      } else {
        slug = params.get('tenant') || 'pornopizza';
      }
      setTenantSlug(slug);
    }
  }, []);

  // Use fallback during loading to prevent white flash
  const normalizedTenant = tenantLoading ? null : withTenantThemeDefaults(tenantData);
  const isDark = isDarkTheme(normalizedTenant);
  // Use default dark background for pornopizza, light for others during loading
  const fallbackBackground = tenantSlug === 'pornopizza' ? 'bg-porno-vibe' : 'bg-gray-50';
  const backgroundClass = tenantLoading ? fallbackBackground : getBackgroundClass(normalizedTenant);
  const fallbackIsDark = tenantSlug === 'pornopizza';
  const primaryColor = normalizedTenant?.theme?.primaryColor || 'var(--color-primary)';

  return (
    <div className={`min-h-screen ${backgroundClass} ${isDark || (tenantLoading && fallbackIsDark) ? 'text-white' : 'text-gray-900'} py-12`}>
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDark || (tenantLoading && fallbackIsDark) ? 'bg-black/40 backdrop-blur-sm border border-white/10' : 'bg-white shadow-md'} rounded-lg p-8 md:p-12`}
        >
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-12 h-12 rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: primaryColor, color: 'white' }}
              aria-label={isSlovak ? 'Späť' : 'Back'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-4xl font-bold" style={{ color: primaryColor }}>
              {isSlovak ? 'Zásady používania súborov cookie' : 'Cookie Policy'}
            </h1>
          </div>

          <div className={`prose prose-lg max-w-none space-y-6 ${isDark ? 'text-gray-200 prose-headings:text-white prose-a:text-blue-400' : 'text-gray-700'}`}>
            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? 'Čo sú súbory cookie?' : 'What are cookies?'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Súbory cookie sú malé textové súbory, ktoré webová stránka ukladá na vašom počítači alebo mobilnom zariadení pri návšteve stránky. Tieto súbory umožňujú webovej stránke zapamätať si vaše akcie a preferencie (ako je prihlásenie, jazyk, veľkosť písma a iné nastavenia zobrazenia) počas určitého obdobia, takže ich nemusíte znova zadávať pri každej návšteve stránky alebo prechode z jednej stránky na druhú.'
                  : 'Cookies are small text files that a website stores on your computer or mobile device when you visit the site. These files allow the website to remember your actions and preferences (such as login, language, font size, and other display settings) for a certain period, so you don\'t have to re-enter them every time you visit the site or move from one page to another.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Okrem súborov cookie používame aj podobné technológie, ako je lokálne úložisko (localStorage) a sessionStorage, ktoré fungujú podobne ako súbory cookie a umožňujú nám ukladať informácie vo vašom prehliadači. V tejto zásade používame termín "súbory cookie" na označenie súborov cookie aj týchto podobných technológií.'
                  : 'In addition to cookies, we also use similar technologies such as local storage (localStorage) and sessionStorage, which work similarly to cookies and allow us to store information in your browser. In this policy, we use the term "cookies" to refer to both cookies and these similar technologies.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Súbory cookie môžu byť nastavené stránkou, ktorú navštevujete (takzvané "súbory cookie prvej strany") alebo inou stranou, ako sú tí, ktorí poskytujú analytické alebo reklamné služby alebo interaktívny obsah na stránke ("súbory cookie tretích strán").'
                  : 'Cookies may be set by the site you are visiting (so-called "first-party cookies") or by another party, such as those who provide analytical or advertising services or interactive content on the site ("third-party cookies").'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '1. Nevyhnutné súbory cookie' : '1. Strictly Necessary Cookies'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Tieto súbory cookie sú nevyhnutné pre fungovanie webovej stránky a nemožno ich vypnúť v našich systémoch. Sú potrebné pre základné funkcie stránky, ako je bezpečné prihlásenie, ukladanie obsahu košíka a správa relácií. Môžete nastaviť prehliadač tak, aby blokoval alebo upozorňoval na tieto súbory cookie, ale to môže spôsobiť, že niektoré časti stránky nebudú fungovať správne.'
                  : 'These cookies are essential for the website to function and cannot be switched off in our systems. They are necessary for basic site functions such as secure login, cart storage, and session management. You can set your browser to block or alert you about these cookies, but that will cause some parts of the site to not work properly.'}
              </p>
              
              <div className="overflow-x-auto mt-6">
                <table className={`min-w-full border-collapse ${isDark ? 'border border-white/20' : 'border border-gray-300'}`}>
                  <thead>
                    <tr className={isDark ? 'bg-white/10' : 'bg-gray-100'}>
                      <th className={`${isDark ? 'border border-white/20' : 'border border-gray-300'} px-4 py-2 text-left font-bold`}>{isSlovak ? 'NÁZOV' : 'NAME'}</th>
                      <th className={`${isDark ? 'border border-white/20' : 'border border-gray-300'} px-4 py-2 text-left font-bold`}>{isSlovak ? 'POPIS' : 'DESCRIPTION'}</th>
                      <th className={`${isDark ? 'border border-white/20' : 'border border-gray-300'} px-4 py-2 text-left font-bold`}>{isSlovak ? 'TYP' : 'TYPE'}</th>
                      <th className={`${isDark ? 'border border-white/20' : 'border border-gray-300'} px-4 py-2 text-left font-bold`}>{isSlovak ? 'EXPIRÁCIA' : 'EXPIRES'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2 font-mono text-sm`}>cart-storage</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>
                        {isSlovak ? 'Ukladá obsah košíka (produkty, množstvo, úpravy) pre zachovanie medzi reláciami a stránkami' : 'Stores cart contents (products, quantities, customizations) to persist between sessions and pages'}
                      </td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>localStorage</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? 'Trvalé (do vymazania)' : 'Persistent (until cleared)'}</td>
                    </tr>
                    <tr>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2 font-mono text-sm`}>auth_token</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>
                        {isSlovak ? 'JWT access token pre autentifikáciu administrátora alebo operátora (v produkcii je v HttpOnly cookie)' : 'JWT access token for admin/operator authentication (in production stored in HttpOnly cookie)'}
                      </td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? 'localStorage / HttpOnly Cookie' : 'localStorage / HttpOnly Cookie'}</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? '1 hodina' : '1 hour'}</td>
                    </tr>
                    <tr>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2 font-mono text-sm`}>refresh_token</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>
                        {isSlovak ? 'Refresh token pre obnovenie access tokenu administrátora alebo operátora (v produkcii je v HttpOnly cookie)' : 'Refresh token for renewing admin/operator access token (in production stored in HttpOnly cookie)'}
                      </td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? 'localStorage / HttpOnly Cookie' : 'localStorage / HttpOnly Cookie'}</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? '7 dní' : '7 days'}</td>
                    </tr>
                    <tr>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2 font-mono text-sm`}>auth_user</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>
                        {isSlovak ? 'Ukladá informácie o prihlásenom administrátorovi alebo operátorovi (ID, meno, rola)' : 'Stores information about logged-in admin/operator (ID, name, role)'}
                      </td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>localStorage</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? 'Trvalé (do odhlásenia)' : 'Persistent (until logout)'}</td>
                    </tr>
                    <tr>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2 font-mono text-sm`}>customer_auth_token</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>
                        {isSlovak ? 'JWT access token pre autentifikáciu zákazníka' : 'JWT access token for customer authentication'}
                      </td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>localStorage</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? '1 hodina' : '1 hour'}</td>
                    </tr>
                    <tr>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2 font-mono text-sm`}>customer_auth_refresh_token</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>
                        {isSlovak ? 'Refresh token pre obnovenie access tokenu zákazníka' : 'Refresh token for renewing customer access token'}
                      </td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>localStorage</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? '7 dní' : '7 days'}</td>
                    </tr>
                    <tr>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2 font-mono text-sm`}>customer_auth_user</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>
                        {isSlovak ? 'Ukladá informácie o prihlásenom zákazníkovi (ID, meno, email, telefón)' : 'Stores information about logged-in customer (ID, name, email, phone)'}
                      </td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>localStorage</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? 'Trvalé (do odhlásenia)' : 'Persistent (until logout)'}</td>
                    </tr>
                    <tr>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2 font-mono text-sm`}>language</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>
                        {isSlovak ? 'Ukladá preferovaný jazyk používateľa (slovenčina/angličtina)' : 'Stores user\'s preferred language (Slovak/English)'}
                      </td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>localStorage</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? 'Trvalé' : 'Persistent'}</td>
                    </tr>
                    <tr>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2 font-mono text-sm`}>cookie_analytics<br/>cookie_marketing</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>
                        {isSlovak ? 'Ukladá vaše preferencie týkajúce sa analytických a marketingových cookies (per používateľ)' : 'Stores your preferences regarding analytics and marketing cookies (per user)'}
                      </td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>localStorage</td>
                      <td className={`${isDark ? 'border border-white/20' : 'border border-gray-300'}} px-4 py-2`}>{isSlovak ? 'Trvalé' : 'Persistent'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-gray-600 italic">
                {isSlovak
                  ? '* V produkcii sú auth_token a refresh_token pre administrátorov/operátorov uložené v HttpOnly cookies pre zvýšenú bezpečnosť. V development móde sú uložené v localStorage.'
                  : '* In production, auth_token and refresh_token for admins/operators are stored in HttpOnly cookies for enhanced security. In development mode, they are stored in localStorage.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '2. Analytické súbory cookie' : '2. Analytics Cookies'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Tieto súbory cookie nám umožňujú počítať návštevy a zdroje dopravy, aby sme mohli merať a zlepšovať výkon našej stránky. Pomáhajú nám zistiť, ktoré stránky sú najobľúbenejšie a najmenej obľúbené, a vidieť, ako sa návštevníci pohybujú po stránke. Všetky informácie, ktoré tieto súbory cookie zhromažďujú, sú agregované a preto anonymné.'
                  : 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Ak tieto súbory cookie nepovolíte, nebudeme vedieť, kedy ste navštívili našu stránku a nebudeme môcť monitorovať jej výkon.'
                  : 'If you do not allow these cookies, we will not know when you have visited our site and will not be able to monitor its performance.'}
              </p>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">
                {isSlovak ? 'Google Analytics' : 'Google Analytics'}
              </h3>
              <p className="mb-4">
                {isSlovak
                  ? 'Naša stránka používa Google Analytics, webovú analytickú službu poskytovanú spoločnosťou Google LLC ("Google"). Google Analytics používa súbory cookie na analýzu toho, ako návštevníci používajú našu stránku. Informácie vygenerované súborom cookie o vašom používaní našej stránky (vrátane vašej IP adresy) sa zvyčajne prenášajú na server Google v USA a tam sa ukladajú.'
                  : 'Our website uses Google Analytics, a web analytics service provided by Google LLC ("Google"). Google Analytics uses cookies to analyze how visitors use our website. The information generated by the cookie about your use of our website (including your IP address) is usually transmitted to a Google server in the USA and stored there.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Google použije tieto informácie na vyhodnotenie vášho používania našej stránky, zostavenie správ o aktivitách na stránke pre prevádzkovateľov stránok a poskytovanie ďalších služieb súvisiacich s používaním stránky a internetu. Google môže tieto údaje tiež preniesť na tretie strany, ak to vyžaduje zákon alebo ak tretie strany tieto údaje spracovávajú v mene Google.'
                  : 'Google will use this information to evaluate your use of our website, compile reports on website activity for website operators, and provide other services related to website and internet usage. Google may also transfer this data to third parties if required by law or if third parties process this data on behalf of Google.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Viac informácií o ochrane údajov v Google Analytics: ' : 'More information on data protection in Google Analytics: '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Zásady ochrany súkromia Google' : 'Google Privacy Policy'}
                </a>
                {' | '}
                <a href="https://support.google.com/analytics/answer/6004245" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Ochrana údajov v Google Analytics' : 'Data Protection in Google Analytics'}
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '3. Marketingové súbory cookie' : '3. Marketing Cookies'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Tieto súbory cookie sa používajú na zobrazovanie relevantných reklám a sledovanie marketingových kampaní. Umožňujú nám meranie efektivity našich reklamných kampaní a personalizáciu reklám podľa vašich záujmov.'
                  : 'These cookies are used to display relevant ads and track marketing campaigns. They allow us to measure the effectiveness of our advertising campaigns and personalize ads according to your interests.'}
              </p>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">
                {isSlovak ? 'Facebook Pixel' : 'Facebook Pixel'}
              </h3>
              <p className="mb-4">
                {isSlovak
                  ? 'Naša stránka používa Facebook Pixel, ktorý je analytický nástroj spoločnosti Meta Platforms Ireland Limited. Facebook Pixel nám pomáha pochopiť, ako návštevníci interagujú s našou stránkou, a umožňuje nám zobrazovať relevantné reklamy na Facebooku a Instagrame.'
                  : 'Our website uses Facebook Pixel, which is an analytics tool from Meta Platforms Ireland Limited. Facebook Pixel helps us understand how visitors interact with our website and allows us to display relevant ads on Facebook and Instagram.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Facebook Pixel používa súbory cookie a podobné technológie na zhromažďovanie informácií o vašom používaní našej stránky. Tieto informácie môžu zahŕňať vašu IP adresu, typ prehliadača, navštívené stránky a čas strávený na stránke.'
                  : 'Facebook Pixel uses cookies and similar technologies to collect information about your use of our website. This information may include your IP address, browser type, pages visited, and time spent on the site.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Viac informácií o Facebook Pixel a ochrane údajov: ' : 'More information about Facebook Pixel and data protection: '}
                <a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Zásady ochrany súkromia Meta' : 'Meta Privacy Policy'}
                </a>
                {' | '}
                <a href="https://www.facebook.com/business/help/742478679120153" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Informácie o Facebook Pixel' : 'Facebook Pixel Information'}
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '4. Súbory cookie tretích strán' : '4. Third-Party Cookies'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Naša stránka používa služby tretích strán, ktoré môžu nastavovať súbory cookie vo vašom prehliadači. Tieto služby sú nevyhnutné pre fungovanie určitých funkcií našej stránky.'
                  : 'Our website uses third-party services that may set cookies in your browser. These services are necessary for the functioning of certain features of our website.'}
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                {isSlovak ? 'Adyen (Platobná služba)' : 'Adyen (Payment Service)'}
              </h3>
              <p className="mb-4">
                {isSlovak
                  ? 'Používame Adyen na spracovanie platieb na našej webovej stránke. Adyen je globálna služba spracovania platieb, ktorá nám umožňuje akceptovať rôzne platobné metódy od našich zákazníkov, vrátane kreditných kariet, debetných kariet a digitálnych peňaženiek.'
                  : 'We use Adyen to process payments on our website. Adyen is a global payment processing service that allows us to accept various payment methods from our customers, including credit cards, debit cards, and digital wallets.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Adyen používa súbory cookie a podobné technológie na zlepšenie svojich služieb, zabezpečenie platieb a prevenciu podvodov. Tieto súbory cookie a technológie môžu zhromažďovať informácie o vašom zariadení, prehliadači a vzorcoch používania.'
                  : 'Adyen uses cookies and similar technologies to improve its services, secure payments, and prevent fraud. These cookies and technologies may collect information about your device, browser, and usage patterns.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Viac informácií: ' : 'More information: '}
                <a href="https://www.adyen.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">adyen.com</a>
                {' | '}
                <a href="https://www.adyen.com/policies-and-terms/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Zásady používania súborov cookie' : 'Cookie Policy'}
                </a>
                {' | '}
                <a href="https://www.adyen.com/policies-and-terms/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Zásady ochrany súkromia' : 'Privacy Policy'}
                </a>
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                {isSlovak ? 'Google Maps API' : 'Google Maps API'}
              </h3>
              <p className="mb-4">
                {isSlovak
                  ? 'Naša stránka používa Google Maps API, mapovú službu poskytovanú spoločnosťou Google LLC, aby ste mohli na mape označiť miesto doručenia vašej objednávky. Pri používaní Google Maps môžu byť informácie o vašom používaní tejto webovej stránky (vrátane vašej IP adresy) prenesené na server Google v USA a tam uložené.'
                  : 'Our website uses Google Maps API, a map service provided by Google LLC, so that you can indicate the delivery location of your order on the map. When using Google Maps, information about your use of this website (including your IP address) can be transmitted to a Google server in the USA and stored there.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Viac informácií: ' : 'More information: '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Zásady ochrany súkromia Google' : 'Google Privacy Policy'}
                </a>
                {' | '}
                <a href="https://www.google.com/intl/en_US/help/terms_maps.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Podmienky používania Google Maps' : 'Google Maps Terms of Use'}
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '5. Ako môžem ovládať súbory cookie?' : '5. How can I control cookies?'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Máte právo rozhodnúť sa, ktoré súbory cookie chcete prijať. Môžete nastaviť alebo upraviť svoje nastavenia súborov cookie kedykoľvek kliknutím na tlačidlo "Nastavenia súborov cookie" nižšie na tejto stránke.'
                  : 'You have the right to decide which cookies you want to accept. You can set or adjust your cookie settings at any time by clicking the "Cookie Settings" button below on this page.'}
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                {isSlovak ? 'Nastavenia na našej stránke' : 'Settings on our website'}
              </h3>
              <p className="mb-4">
                {isSlovak
                  ? 'Na tejto stránke môžete upraviť nastavenia pre analytické a marketingové súbory cookie. Nevyhnutné súbory cookie nemožno vypnúť, pretože sú potrebné pre základné funkcie stránky.'
                  : 'On this page, you can adjust settings for analytics and marketing cookies. Strictly necessary cookies cannot be turned off, as they are required for basic site functions.'}
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                {isSlovak ? 'Nastavenia vášho prehliadača' : 'Your browser settings'}
              </h3>
              <p className="mb-4">
                {isSlovak
                  ? 'Váš prehliadač má ovládacie prvky, ktoré vám umožňujú spravovať používanie súborov cookie webovými stránkami, ktoré navštevujete. Väčšina prehliadačov má funkcie, ktoré vám umožňujú zobraziť a vymazať súbory cookie uložené na vašom zariadení, ako aj blokovať súbory cookie zo všetkých alebo vybraných stránok.'
                  : 'Your browser has controls that allow you to manage the use of cookies by the websites you visit. Most browsers have features that allow you to view and delete the cookies stored on your device, as well as block cookies from all or selected sites.'}
              </p>
              <p className="mb-4">
                {isSlovak ? 'Odkazy na návody pre populárne prehliadače:' : 'Links to guides for popular browsers:'}
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Apple Safari</a></li>
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Chrome</a></li>
                <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Microsoft Edge</a></li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">
                {isSlovak ? 'Nastavenia mobilného zariadenia' : 'Mobile device settings'}
              </h3>
              <p className="mb-4">
                {isSlovak
                  ? 'Vaše mobilné zariadenie môže mať tiež nastavenia prehliadača, ktoré vám umožňujú ovládať používanie súborov cookie. Na zariadeniach iOS môžete nájsť nastavenie nazvané "Obmedziť sledovanie reklám" v Nastaveniach > Súkromie. Na zariadeniach Android môžete nájsť nastavenie nazvané "Vypnúť personalizáciu reklám" v Nastaveniach > Google > Reklamy.'
                  : 'Your mobile device may also have browser settings that allow you to control the use of cookies. On iOS devices, you can find a setting called "Limit Ad Tracking" in Settings > Privacy. On Android devices, you can find a setting called "Opt out of ad personalization" in Settings > Google > Ads.'}
              </p>

              <p className="mt-4 text-sm text-gray-600 italic">
                {isSlovak
                  ? 'Upozorňujeme, že vymazanie našich súborov cookie alebo zakázanie budúcich súborov cookie alebo technológií sledovania vám môže zabrániť v prístupe k určitým oblastiam alebo funkciám našich služieb alebo inak nepriaznivo ovplyvniť váš zážitok.'
                  : 'Please note that deleting our cookies or disabling future cookies or tracking technologies may prevent you from accessing certain areas or features of our Services or otherwise adversely affect your experience.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '6. Aktualizácie tejto zásady' : '6. Updates to this policy'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Môžeme čas od času aktualizovať tieto Zásady používania súborov cookie, aby sme odzrkadlili zmeny v našich praktikách alebo z iných prevádzkových, právnych alebo regulačných dôvodov. Odporúčame vám pravidelne kontrolovať túto stránku, aby ste získali najnovšie informácie o súboroch cookie.'
                  : 'We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We encourage you to periodically review this page for the latest information about cookies.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Ak urobíme významné zmeny, upozorníme vás na to prostredníctvom oznámenia na našej stránke alebo iným spôsobom.'
                  : 'If we make significant changes, we will notify you through a notice on our website or by other means.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '7. Kontakt' : '7. Contact'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Ak máte akékoľvek otázky týkajúce sa týchto Zásad používania súborov cookie, môžete nás kontaktovať prostredníctvom kontaktných údajov uvedených v našich Zásadách ochrany súkromia.'
                  : 'If you have any questions regarding this Cookie Policy, you can contact us through the contact details provided in our Privacy Policy.'}
              </p>
            </section>

            <section className="mt-8 pt-6 border-t border-gray-300">
              <h3 className="text-xl font-bold mb-4">
                {isSlovak ? 'Vaša aktuálna voľba' : 'Your current choice'}
              </h3>
              <p className="mb-4">
                {isSlovak
                  ? 'Svoje nastavenia súborov cookie môžete zmeniť kliknutím na toto tlačidlo:'
                  : 'You can change your cookie settings by clicking on this button:'}
              </p>
              <button
                onClick={() => setShowCookieModal(true)}
                className="px-6 py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                {isSlovak ? 'Nastavenia súborov cookie' : 'Cookie Settings'}
              </button>
            </section>
          </div>
        </motion.div>
      </div>

      {/* Cookie Settings Modal */}
      {showCookieModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isDark ? 'bg-black/90 backdrop-blur-sm border border-white/20' : 'bg-white shadow-xl'} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
          >
              <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {isSlovak ? 'Nastavenia súborov cookie' : 'Cookie Settings'}
                </h2>
                <button
                  onClick={() => setShowCookieModal(false)}
                  className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
                  aria-label={isSlovak ? 'Zavrieť' : 'Close'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 mb-6">
                {/* Necessary Cookies */}
                <div className={`border-b ${isDark ? 'border-white/20' : 'border-gray-200'} pb-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isSlovak ? 'Nevyhnutné súbory cookie' : 'Necessary Cookies'}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isSlovak
                          ? 'Tieto súbory cookie sú nevyhnutné pre fungovanie stránky a nemôžu byť vypnuté.'
                          : 'These cookies are necessary for the website to function and cannot be disabled.'}
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={cookieSettings.necessary}
                        disabled
                        className="w-5 h-5"
                      />
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className={`border-b ${isDark ? 'border-white/20' : 'border-gray-200'} pb-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isSlovak ? 'Analytické súbory cookie' : 'Analytics Cookies'}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isSlovak
                          ? 'Pomáhajú nám pochopiť, ako návštevníci používajú našu stránku.'
                          : 'Help us understand how visitors use our website.'}
                      </p>
                    </div>
                    <div className="ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.analytics}
                          onChange={(e) =>
                            setLocalSettings({ ...localSettings, analytics: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className={`border-b ${isDark ? 'border-white/20' : 'border-gray-200'} pb-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isSlovak ? 'Marketingové súbory cookie' : 'Marketing Cookies'}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isSlovak
                          ? 'Používajú sa na zobrazovanie relevantných reklám a sledovanie kampaní.'
                          : 'Used to display relevant ads and track campaigns.'}
                      </p>
                    </div>
                    <div className="ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.marketing}
                          onChange={(e) =>
                            setLocalSettings({ ...localSettings, marketing: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    try {
                      updateSettings({
                        analytics: localSettings.analytics,
                        marketing: localSettings.marketing,
                      });
                      setShowCookieModal(false);
                      // Reload page to apply settings
                      window.location.reload();
                    } catch (error) {
                      console.error('Failed to save cookie settings:', error);
                      alert(isSlovak ? 'Chyba pri ukladaní nastavení' : 'Error saving settings');
                    }
                  }}
                  className="flex-1 px-6 py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSlovak ? 'Uložiť nastavenia' : 'Save Settings'}
                </button>
                <button
                  onClick={() => setShowCookieModal(false)}
                  className={`px-6 py-3 rounded-lg border font-semibold transition-colors ${
                    isDark 
                      ? 'border-white/20 text-white hover:bg-white/10' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isSlovak ? 'Zrušiť' : 'Cancel'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

