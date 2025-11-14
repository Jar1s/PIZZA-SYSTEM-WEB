'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCookieSettings } from '@/hooks/useCookieSettings';

export default function CookiePolicyPage() {
  const { language } = useLanguage();
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-8 md:p-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-12 h-12 rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              aria-label={isSlovak ? 'Späť' : 'Back'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {isSlovak ? 'Zásady používania súborov cookie' : 'Cookie Policy'}
            </h1>
          </div>

          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? 'Ako používame súbory cookie?' : 'How we use Cookie?'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Súbor cookie je malý textový súbor, ktorý stránka ukladá na vašom počítači alebo mobilnom zariadení pri návšteve stránky. Prehliadače podporujú súbory cookie a podobné technológie (ako je lokálne úložisko a pixely), aby stránky ako naša mohli zapamätať si informácie o vašej návšteve a použiť tieto informácie na zlepšenie vášho zážitku a vytvorenie agregovaných anonymných štatistík o používaní stránky. V tejto podmienke používame termín "súbory cookie" na označenie súborov cookie aj podobných technológií.'
                  : 'A cookie is a small text file that a site stores on your computer or mobile device when you visit the site. Browsers support cookies and similar technologies (such as local storage and pixels) so that sites like ours can remember information about your visit and use that information to improve your experience and create aggregate anonymous statistics about site usage. In this condition, we use the term \'cookies\' to refer to both cookies and similar technologies.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Súbory cookie môžu byť nastavené stránkou, ktorú navštevujete (takzvané "súbory cookie prvej strany") alebo inou stranou, ako sú tí, ktorí poskytujú analytické alebo reklamné služby alebo interaktívny obsah na stránke ("súbory cookie tretích strán").'
                  : 'Cookies may be set by the site you are visiting (so-called \'first party cookies\') or by the other side, such as those who provide analytical or advertising services or interactive content on the site (\'third-party cookies\').'}
              </p>
              <p>
                {isSlovak
                  ? 'Naše základné súbory cookie zahŕňajú Nevyhnutné súbory cookie, Funkčné súbory cookie, Analytické/Výkonnostné súbory cookie a Reklamné súbory cookie.'
                  : 'Our essential cookies include Strictly Necessary Cookies, Functional Cookies, Analytics/Performance Cookies, and Advertising Cookies.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? 'Nevyhnutné súbory cookie' : 'Necessary Cookie files'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Tieto súbory cookie sú nevyhnutné pre fungovanie webovej stránky a nemožno ich vypnúť v našich systémoch. Môžete nastaviť prehliadač tak, aby blokoval alebo upozorňoval na tieto súbory cookie, ale to môže spôsobiť, že niektoré časti stránky nebudú fungovať. Patria sem:'
                  : 'These cookies are essential for the website to function and cannot be switched off in our systems. You can set your browser to block or alert you about these cookies, but that will cause some parts of the site to not work. These include:'}
              </p>
              
              <div className="overflow-x-auto mt-6">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold">NAME</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold">DESCRIPTION</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold">TYPE</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold">EXPIRES</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">cart-storage</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {isSlovak ? 'Ukladá obsah košíka (produkty, množstvo, customizácie) pre zachovanie medzi reláciami' : 'Stores cart contents (products, quantities, customizations) to persist between sessions'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">localStorage</td>
                      <td className="border border-gray-300 px-4 py-2">{isSlovak ? 'Trvalé' : 'Persistent'}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">auth_token</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {isSlovak ? 'JWT access token pre autentifikáciu používateľa (v produkcii je v HttpOnly cookie)' : 'JWT access token for user authentication (in production stored in HttpOnly cookie)'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{isSlovak ? 'localStorage / Cookie' : 'localStorage / Cookie'}</td>
                      <td className="border border-gray-300 px-4 py-2">1 hour</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">refresh_token</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {isSlovak ? 'Refresh token pre obnovenie access tokenu (v produkcii je v HttpOnly cookie)' : 'Refresh token for renewing access token (in production stored in HttpOnly cookie)'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{isSlovak ? 'localStorage / Cookie' : 'localStorage / Cookie'}</td>
                      <td className="border border-gray-300 px-4 py-2">7 days</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">auth_user</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {isSlovak ? 'Ukladá informácie o prihlásenom používateľovi (ID, meno, rola)' : 'Stores information about logged-in user (ID, name, role)'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">localStorage</td>
                      <td className="border border-gray-300 px-4 py-2">{isSlovak ? 'Trvalé' : 'Persistent'}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">language</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {isSlovak ? 'Ukladá preferovaný jazyk používateľa (slovenčina/angličtina)' : 'Stores user\'s preferred language (Slovak/English)'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">localStorage</td>
                      <td className="border border-gray-300 px-4 py-2">{isSlovak ? 'Trvalé' : 'Persistent'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                {isSlovak
                  ? '* V produkcii sú auth_token a refresh_token uložené v HttpOnly cookies pre zvýšenú bezpečnosť. V development móde sú uložené v localStorage.'
                  : '* In production, auth_token and refresh_token are stored in HttpOnly cookies for enhanced security. In development mode, they are stored in localStorage.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">Adyen</h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Používame Adyen na spracovanie platieb na našej webovej stránke. Adyen je globálna služba spracovania platieb. Adyen ponúka bezpečnú a spoľahlivú platobnú platformu, ktorá nám umožňuje akceptovať rôzne platobné metódy od našich zákazníkov, vrátane kreditných kariet, debetných kariet a digitálnych peňaženiek. Viac informácií o službe nájdete na stránke spoločnosti - ' : 'We use Adyen to process payments on our website. Adyen is a global payment processing service. Adyen offers a secure and reliable payment platform that allows us to accept various payment methods from our customers, including credit cards, debit cards, and digital wallets. More details about service can be found on the company page - '}
                <a href="https://www.adyen.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">adyen.com</a>
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Adyen tiež používa súbory cookie a podobné technológie na zlepšenie svojich služieb a personalizáciu vášho zážitku. Tieto súbory cookie a technológie môžu zhromažďovať informácie o vašom zariadení, prehliadači a vzorcoch používania.'
                  : 'Adyen also uses cookies and similar technologies to improve its services and personalize your experience. These cookies and technologies may collect information about your device, browser, and usage patterns.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Pre viac informácií o používaní súborov cookie a technológií spoločnosťou Adyen si pozrite ich ' : 'For more information on Adyen\'s use of cookies and technologies, please refer to their '}
                <a href="https://www.adyen.com/policies-and-terms/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Zásady používania súborov cookie' : 'Cookie Policy'}
                </a>.
              </p>
              <p>
                {isSlovak
                  ? 'Okrem toho môže Adyen zdieľať niektoré z vašich osobných údajov s poskytovateľmi služieb tretích strán, ako sú agentúry na prevenciu podvodov, aby pomohli ochrániť pred podvodnými transakciami.'
                  : 'In addition, Adyen may share some of your personal information with third-party service providers, such as fraud prevention agencies, to help protect against fraudulent transactions.'}
              </p>
              <p className="mt-4">
                {isSlovak
                  ? 'Pre viac informácií o postupe spracovania údajov spoločnosti Adyen a vašich právach ako subjektu údajov si pozrite ich ' : 'For more information on Adyen\'s data processing practices and your rights as a data subject, please refer to their '}
                <a href="https://www.adyen.com/policies-and-terms/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Zásady ochrany súkromia' : 'Privacy Policy'}
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">Google Maps</h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Google Maps API je mapová služba poskytovaná spoločnosťou Google Inc., 1600 Amphitheater Parkway Mountain View, CA 94043, USA.'
                  : 'Google Maps API is a map service provided by Google Inc., 1600 Amphitheater Parkway Mountain View, CA 94043, USA.'}
              </p>
              <p className="mb-4">
                {isSlovak
                  ? 'Potrebujeme použiť Google Maps API, aby ste mohli na mape označiť miesto doručenia vašej objednávky. Pri používaní Google Maps môžu byť informácie o vašom používaní tejto webovej stránky (vrátane vašej IP adresy) prenesené na server Google v USA a tam uložené.'
                  : 'We need to use the Google Maps API so that you can indicate the delivery location of your order on the map. When using Google Maps, information about your use of this website (including your IP address) can be transmitted to a Google server in the USA and stored there.'}
              </p>
              <p>
                {isSlovak
                  ? 'Viac informácií o ochrane údajov a podmienkach používania Google Maps: ' : 'More information on data protection and Terms of Use on Google Maps: '}
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
                {isSlovak ? 'Ako môžem ovládať súbory cookie a ako sa používajú moje údaje?' : 'How can I control cookies and how is my data used?'}
              </h2>
              <p className="mb-4">
                {isSlovak
                  ? 'Existuje niekoľko spôsobov, ktoré môžete použiť na kontrolu toho, aké informácie zhromažďujú súbory cookie na našej stránke a ako sa tieto informácie používajú.'
                  : 'There are several ways you can use to control what information is collected by cookies on our site and how this information is used.'}
              </p>

              <h3 className="text-xl font-bold mb-3 mt-6">
                {isSlovak ? 'Nastavenia vášho prehliadača' : 'Your browser settings'}
              </h3>
              <p className="mb-4">
                {isSlovak
                  ? 'Váš prehliadač má ovládacie prvky, ktoré vám umožňujú spravovať používanie súborov cookie webovými stránkami, ktoré navštevujete. Väčšina prehliadačov má funkcie, ktoré vám umožňujú zobraziť a vymazať súbory cookie uložené na vašom zariadení, ako aj blokovať súbory cookie zo všetkých alebo vybraných stránok. Pre viac informácií tu sú odkazy na externé referenčné materiály pre niektoré populárne prehliadače:'
                  : 'Your browser has controls that allow you to manage the use of cookies by the websites you visit. Most browsers have features that allow you to view and delete the cookies stored on your device, as well as block cookies from all or selected sites. For more information, here are links to external reference materials for some popular browsers:'}
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Apple Safari</a></li>
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Chrome</a></li>
                <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Microsoft Edge</a></li>
              </ul>

              <h3 className="text-xl font-bold mb-3 mt-6">
                {isSlovak ? 'Nastavenia vášho mobilného zariadenia' : 'Your mobile device settings'}
              </h3>
              <p className="mb-4">
                {isSlovak
                  ? 'Vaše mobilné zariadenie môže mať tiež nastavenia prehliadača, ktoré vám umožňujú ovládať používanie súborov cookie, najmä ak zariadenie podporuje inštaláciu aplikácií, ako sú zariadenia iOS a Android. Zariadenia OS a Android tiež zahŕňajú dodatočné nastavenia zariadenia, ktoré ovládajú, či reklamní partneri môžu použiť informácie o vašej aktivite v aplikácii na reklamné účely. Na zariadeniach iOS môžete nájsť nastavenie nazvané "Obmedziť sledovanie reklám". Na zariadeniach Android môžete nájsť nastavenie nazvané "Vypnúť personalizáciu reklám".'
                  : 'Your mobile device may also have browser settings that allow you to control the use of cookies, especially if the device supports the installation of applications such as iOS and Android devices. OS and Android devices also include additional device settings that control whether advertising partners can use information about your in-app activity for advertising purposes. On iOS devices, you can find a setting called \'Limit Ad Tracking\'. On Android devices, you can find a setting called \'Opt out of ad personalization\'.'}
              </p>

              <h3 className="text-xl font-bold mb-3 mt-6">
                {isSlovak ? 'Správa súborov cookie' : 'Cookie management'}
              </h3>
              <p>
                {isSlovak
                  ? 'Je tiež možné úplne zabrániť prijatiu súborov cookie prehliadačom zmenou nastavení súborov cookie prehliadača. Tieto nastavenia zvyčajne nájdete v ponukách "Možnosti" alebo "Nastavenia" vášho prehliadača. Upozorňujeme, že vymazanie našich súborov cookie alebo zakázanie budúcich súborov cookie alebo technológií sledovania vám môže zabrániť v prístupe k určitým oblastiam alebo funkciám našich služieb alebo inak nepriaznivo ovplyvniť váš zážitok.'
                  : 'It is also possible to completely prevent the acceptance of cookies by the browser by changing the cookie settings of the browser. You can usually find these settings in the \'Options\' or \'Settings\' menus of your browser. Please note that deleting our cookies or disabling future cookies or tracking technologies may prevent you from accessing certain areas or features of our Services or otherwise adversely affect your experience.'}
              </p>
            </section>

            <section>
              <p className="mt-8 text-sm text-gray-600">
                {isSlovak
                  ? 'Môžeme aktualizovať tieto Zásady používania súborov cookie. Odporúčame vám pravidelne kontrolovať túto stránku, aby ste získali najnovšie informácie o súboroch cookie.'
                  : 'We may update this Cookie Policy. We encourage you to periodically review this page for the latest information about cookies.'}
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
                className="px-6 py-3 rounded-lg text-white font-semibold"
                style={{ backgroundColor: 'var(--color-primary)' }}
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
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {isSlovak ? 'Nastavenia súborov cookie' : 'Cookie Settings'}
                </h2>
                <button
                  onClick={() => setShowCookieModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label={isSlovak ? 'Zavrieť' : 'Close'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 mb-6">
                {/* Necessary Cookies */}
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {isSlovak ? 'Nevyhnutné súbory cookie' : 'Necessary Cookies'}
                      </h3>
                      <p className="text-sm text-gray-600">
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
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {isSlovak ? 'Analytické súbory cookie' : 'Analytics Cookies'}
                      </h3>
                      <p className="text-sm text-gray-600">
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
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {isSlovak ? 'Marketingové súbory cookie' : 'Marketing Cookies'}
                      </h3>
                      <p className="text-sm text-gray-600">
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
                  className="flex-1 px-6 py-3 rounded-lg text-white font-semibold"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {isSlovak ? 'Uložiť nastavenia' : 'Save Settings'}
                </button>
                <button
                  onClick={() => setShowCookieModal(false)}
                  className="px-6 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-50"
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

