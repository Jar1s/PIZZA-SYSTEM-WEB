'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { isDarkTheme, getBackgroundClass, withTenantThemeDefaults } from '@/lib/tenant-utils';

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const { tenant: tenantData, loading: tenantLoading } = useTenant();
  const isSlovak = language === 'sk';

  // Get tenant slug from URL for fallback during loading
  const [tenantSlug] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const params = new URLSearchParams(window.location.search);
      if (hostname.includes('pornopizza.sk') || hostname.includes('p0rnopizza.sk') || hostname.includes('pornopizza') || hostname.includes('p0rnopizza')) {
        return 'pornopizza';
      } else if (hostname.includes('pizzavnudzi.sk') || hostname.includes('pizzavnudzi')) {
        return 'pizzavnudzi';
      } else {
        return params.get('tenant') || 'pornopizza';
      }
    }
    return 'pornopizza';
  });

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
              {isSlovak ? 'Zásady ochrany osobných údajov' : 'Privacy Policy'}
            </h1>
          </div>

          <div className={`prose prose-lg max-w-none space-y-6 ${isDark ? 'text-gray-200 prose-headings:text-white prose-a:text-blue-400' : 'text-gray-700'}`}>
            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '1. ÚVODNÉ USTANOVENIA' : '1. INTRODUCTORY PROVISIONS'}
              </h2>
              
              <p className="mb-4">
                <strong>1.1.</strong> {isSlovak
                  ? 'Tento dokument predstavuje Zásady ochrany osobných údajov spoločnosti Gastro Corner s.r.o., IČ: 53182120, so sídlom: Námestie Hraničiarov 2581/4A, 851 03 Bratislava - mestská časť Petržalka, zapísaná v obchodnom registri vedenom Mestským súdom Bratislava III, vložka číslo 146881/B (ďalej tiež „Prevádzkovateľ" alebo „my", alebo „naša spoločnosť"), ako vlastníka a prevádzkovateľa online objednávkového systému. V týchto Zásadách ochrany osobných údajov označujeme všetky naše produkty, služby, webové stránky a aplikácie súhrnne ako „naše služby".'
                  : 'This document represents the Privacy Policy of Gastro Corner s.r.o., ID: 53182120, with registered office at: Námestie Hraničiarov 2581/4A, 851 03 Bratislava - mestská časť Petržalka, registered in the Commercial Register kept by the Municipal Court Bratislava III, file number 146881/B (hereinafter also "Operator" or "we" or "our company"), as the owner and operator of the online ordering system. In these Privacy Policy, we refer to all our products, services, websites and applications collectively as "our services".'}
              </p>

              <p className="mb-4">
                <strong>1.2.</strong> {isSlovak
                  ? 'Naša spoločnosť rešpektuje právo na súkromie a ochranu osobných údajov. Pre účely týchto Zásad ochrany osobných údajov sa osobnými údajmi rozumejú všetky informácie o identifikovanej alebo identifikovateľnej fyzickej osobe, pričom identifikovateľnou fyzickou osobou je fyzická osoba, ktorú možno priamo alebo nepriamo identifikovať, najmä odkazom na určitý identifikátor, napríklad meno, identifikačné číslo, lokalizačné údaje, sieťový identifikátor alebo na jeden alebo viac zvláštnych prvkov fyzickej, fyziologickej, genetickej, psychickej, ekonomickej, kultúrnej alebo spoločenskej identity tejto fyzickej osoby.'
                  : 'Our company respects the right to privacy and protection of personal data. For the purposes of this Privacy Policy, personal data means all information about an identified or identifiable natural person, whereby an identifiable natural person is a natural person who can be directly or indirectly identified, in particular by reference to a specific identifier, such as a name, identification number, location data, network identifier or one or more specific elements of the physical, physiological, genetic, mental, economic, cultural or social identity of that natural person.'}
              </p>

              <p className="mb-4">
                <strong>1.3.</strong> {isSlovak
                  ? 'Osobné údaje spracúvame vždy v súlade s týmito Zásadami ochrany osobných údajov a platnou legislatívou, ako je napríklad Nariadenie Európskeho parlamentu a Rady (EÚ) 2016/679 z 27. apríla 2016 o ochrane fyzických osôb v súvislosti so spracovaním osobných údajov a o voľnom pohybe týchto údajov a o zrušení smernice 95/46/ES (ďalej len „GDPR").'
                  : 'We always process personal data in accordance with this Privacy Policy and applicable legislation, such as Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (hereinafter "GDPR").'}
              </p>

              <p className="mb-4">
                <strong>1.4.</strong> {isSlovak
                  ? 'Prečítajte si prosím pozorne tieto Zásady ochrany osobných údajov, aby ste pochopili, ako zhromažďujeme, spracúvame a chránime osobné údaje, ak používate naše služby, a aké práva v tejto súvislosti máte. Používaním našich služieb a/alebo poskytnutím akýchkoľvek osobných údajov nám súhlasíte s tým, že budete viazaní týmito Zásadami ochrany osobných údajov, a zaručujete, že všetky vámi poskytnuté osobné údaje sú presné a že ste oprávnení nám tieto osobné údaje poskytnúť.'
                  : 'Please read this Privacy Policy carefully to understand how we collect, process and protect personal data when you use our services, and what rights you have in this regard. By using our services and/or providing any personal data to us, you agree to be bound by this Privacy Policy and warrant that all personal data you provide is accurate and that you are authorized to provide us with such personal data.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '2. KATEGÓRIE OSOBNÝCH ÚDAJOV' : '2. CATEGORIES OF PERSONAL DATA'}
              </h2>
              
              <p className="mb-4">
                <strong>2.1.</strong> {isSlovak
                  ? 'Zhromažďujeme, spracúvame a chráníme nasledujúce kategórie osobných údajov:'
                  : 'We collect, process and protect the following categories of personal data:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>{isSlovak ? 'a) osobné údaje;' : 'a) personal data;'}</li>
                <li>{isSlovak ? 'b) e-mailová adresa;' : 'b) email address;'}</li>
                <li>{isSlovak ? 'c) meno a priezvisko;' : 'c) first and last name;'}</li>
                <li>{isSlovak ? 'd) IP adresa;' : 'd) IP address;'}</li>
                <li>{isSlovak ? 'e) ďalšie osobné údaje, ktoré s nami zdieľate.' : 'e) other personal data that you share with us.'}</li>
              </ul>

              <p className="mb-4">
                {isSlovak
                  ? 'Pri používaní našich služieb vás môžeme požiadať, aby ste nám poskytli vyššie uvedené osobné údaje, ktoré môžu byť použité na vaše kontaktovanie alebo identifikáciu. Ak nám poskytnete príslušný súhlas, môžeme osobné údaje použiť aj na to, aby sme vás kontaktovali prostredníctvom newsletterov, marketingových alebo propagačných materiálov a poskytli vám ďalšie informácie, ktoré by vás mohli zaujímať.'
                  : 'When using our services, we may ask you to provide us with the above personal data, which may be used to contact or identify you. If you provide us with the appropriate consent, we may also use personal data to contact you through newsletters, marketing or promotional materials and provide you with additional information that may interest you.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '3. ÚČELY SPRAcovania OSOBNÝCH ÚDAJOV' : '3. PURPOSES OF PERSONAL DATA PROCESSING'}
              </h2>
              
              <p className="mb-4">
                <strong>3.1.</strong> {isSlovak
                  ? 'Osobné údaje spracúvame pre nasledujúce účely:'
                  : 'We process personal data for the following purposes:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  {isSlovak
                    ? 'a) Plnenie a dodržiavanie našich zmluvných a zákonných povinností, ako je poskytovanie našich služieb dohodnutých medzi vami a nami - právnym základom pre spracovanie je článok 6 ods. 1 písm. „b" GDPR (spracovanie je nevyhnutné pre splnenie zmluvy, ktorej stranou je subjekt údajov);'
                    : 'a) Fulfillment and compliance with our contractual and legal obligations, such as providing our services agreed between you and us - the legal basis for processing is Article 6(1)(b) GDPR (processing is necessary for the performance of a contract to which the data subject is a party);'}
                </li>
                <li>
                  {isSlovak
                    ? 'b) Priame marketingové aktivity súvisiace s našimi službami - právnym základom pre spracovanie je článok 6 ods. 1 písm. „f" GDPR (spracovanie je nevyhnutné pre účely oprávnených záujmov správcu, t.j. vykonávanie nášho priameho marketingu);'
                    : 'b) Direct marketing activities related to our services - the legal basis for processing is Article 6(1)(f) GDPR (processing is necessary for the purposes of the legitimate interests of the controller, i.e., conducting our direct marketing);'}
                </li>
                <li>
                  {isSlovak
                    ? 'c) Odhalovanie, prevencia a riešenie technických problémov - právnym základom pre spracovanie je článok 6 ods. 1 písm. „f" GDPR (spracovanie je nevyhnutné pre účely oprávnených záujmov správcu, t.j. predchádzanie chybám a ich náprava);'
                    : 'c) Detection, prevention and resolution of technical problems - the legal basis for processing is Article 6(1)(f) GDPR (processing is necessary for the purposes of the legitimate interests of the controller, i.e., preventing errors and remedying them);'}
                </li>
                <li>
                  {isSlovak
                    ? 'd) Zlepšovanie vybraných služieb - právnym základom pre spracovanie je článok 6 ods. 1 písm. „a" GDPR (subjekt údajov udelil súhlas so spracovaním);'
                    : 'd) Improving selected services - the legal basis for processing is Article 6(1)(a) GDPR (the data subject has given consent to the processing);'}
                </li>
                <li>
                  {isSlovak
                    ? 'e) Vykonávanie analýz s ohľadom na súbory cookies - právnym základom pre spracovanie je článok 6 ods. 1 písm. „a" GDPR (subjekt údajov udelil súhlas so spracovaním);'
                    : 'e) Conducting analyses regarding cookies - the legal basis for processing is Article 6(1)(a) GDPR (the data subject has given consent to the processing);'}
                </li>
                <li>
                  {isSlovak
                    ? 'f) Zobrazovanie komerčných reklám s ohľadom na súbory cookies - právnym základom pre spracovanie je článok 6 ods. 1 písm. „a" GDPR (subjekt údajov udelil súhlas so spracovaním).'
                    : 'f) Displaying commercial advertisements regarding cookies - the legal basis for processing is Article 6(1)(a) GDPR (the data subject has given consent to the processing).'}
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '4. UCHOVÁVANIE A PREDÁVANIE OSOBNÝCH ÚDAJOV' : '4. RETENTION AND TRANSFER OF PERSONAL DATA'}
              </h2>
              
              <p className="mb-4">
                <strong>4.1.</strong> {isSlovak
                  ? 'Osobné údaje budeme uchovávať a spracúvať len po dobu nevyhnutne nutnú pre účely uvedené v týchto Zásadách ochrany osobných údajov a len v rozsahu nevyhnutnom pre splnenie našich zákonných povinností, riešenie sporov, výkon našich práv a ochranu našich záujmov.'
                  : 'We will retain and process personal data only for as long as necessary for the purposes set out in this Privacy Policy and only to the extent necessary to fulfill our legal obligations, resolve disputes, exercise our rights and protect our interests.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '5. ZVEREJŇOVANIE OSOBNÝCH ÚDAJOV' : '5. DISCLOSURE OF PERSONAL DATA'}
              </h2>
              
              <p className="mb-4">
                <strong>5.1.</strong> {isSlovak
                  ? 'Osobné údaje môžeme sprístupniť tretej strane najmä v súvislosti s:'
                  : 'We may disclose personal data to third parties, in particular in connection with:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  {isSlovak
                    ? 'a) Poskytovanie našich služieb;'
                    : 'a) Providing our services;'}
                </li>
                <li>
                  {isSlovak
                    ? 'b) Obchodné transakcie;'
                    : 'b) Business transactions;'}
                </li>
                <li>
                  {isSlovak
                    ? 'c) Sprístupnenie pre účely vymáhania práva;'
                    : 'c) Disclosure for law enforcement purposes;'}
                </li>
                <li>
                  {isSlovak
                    ? 'd) Právne požiadavky.'
                    : 'd) Legal requirements.'}
                </li>
              </ul>

              <p className="mb-4">
                {isSlovak
                  ? 'Príjemcami vašich osobných údajov sú subjekty, ktoré s nami spolupracujú, najmä naši subdodávatelia a dodávatelia, vrátane spoločností so sídlom mimo Európsky hospodársky priestor. Všetky údaje ukladáme pomocou služby Google Cloud pre všetkých našich zákazníkov bez ohľadu na ich umiestnenie. Ďalšie informácie o postupe spoločnosti Google v oblasti ochrany osobných údajov nájdete na stránke Google Privacy Page.'
                  : 'Recipients of your personal data are entities that cooperate with us, in particular our subcontractors and suppliers, including companies based outside the European Economic Area. We store all data using Google Cloud service for all our customers regardless of their location. More information about Google\'s privacy practices can be found on the Google Privacy Page.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '6. SLEDOVANIE, COOKIES A IP ADRESY' : '6. TRACKING, COOKIES AND IP ADDRESSES'}
              </h2>
              
              <p className="mb-4">
                <strong>6.1.</strong> {isSlovak
                  ? 'Cookies sú počítačové súbory s malým množstvom dát, ktoré môžu obsahovať anonymný jedinečný identifikátor. Súbory cookies sú odosielané do vášho prehliadača z webovej stránky a uložené vo vašom zariadení. Sledovacie technológie tiež používajú majáky, značky a skripty na zhromažďovanie a sledovanie informácií a na zlepšenie a analýzu našich služieb.'
                  : 'Cookies are computer files with a small amount of data that may contain an anonymous unique identifier. Cookies are sent to your browser from a website and stored on your device. Tracking technologies also use beacons, tags and scripts to collect and track information and to improve and analyze our services.'}
              </p>

              <p className="mb-4">
                <strong>6.2.</strong> {isSlovak
                  ? 'Ak sa chcete dozvedieť viac o používaní súborov cookies, prečítajte si prosím naše zásady používania súborov cookie na adrese: '
                  : 'If you would like to learn more about our use of cookies, please read our cookie policy at: '}
                <a href="/cookies" className="text-blue-600 hover:underline">/cookies</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '7. PRIAMY MARKETING' : '7. DIRECT MARKETING'}
              </h2>
              
              <p className="mb-4">
                <strong>7.1.</strong> {isSlovak
                  ? 'Udením príslušného súhlasu s priamym marketingom pri registrácii ako používateľ našich služieb alebo udelením príslušného súhlasu pri používaní našich služieb bez predchádzajúcej registrácie, alebo udelením príslušného súhlasu pri prihlásení sa na odber marketingových správ, prieskumov atď., súhlasíte s tým, že môžeme použiť vaše elektronické kontaktné údaje, aby sme vás mohli kontaktovať elektronickými prostriedkami (napríklad e-mailom) s marketingovými informáciami o našich službách.'
                  : 'By granting the appropriate consent to direct marketing when registering as a user of our services or by granting the appropriate consent when using our services without prior registration, or by granting the appropriate consent when subscribing to marketing messages, surveys, etc., you agree that we may use your electronic contact details to contact you by electronic means (e.g., email) with marketing information about our services.'}
              </p>

              <p className="mb-4">
                <strong>7.2.</strong> {isSlovak
                  ? 'Z marketingovej komunikácie sa môžete odhlásiť deaktiváciou tejto funkcie prostredníctvom odkazu na odhlásenie, ktorý je uvedený v každom e-maile alebo inej komunikácii, ktorú obdržíte, alebo zaslaním e-mailovej žiadosti na adresu info@gastrocorner.sk, v ktorej uvediete, že si želáte odhlásiť sa z odberu marketingových správ.'
                  : 'You can unsubscribe from marketing communications by deactivating this function through the unsubscribe link provided in each email or other communication you receive, or by sending an email request to info@gastrocorner.sk stating that you wish to unsubscribe from marketing messages.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '8. BEZPEČNOSŤ' : '8. SECURITY'}
              </h2>
              
              <p className="mb-4">
                <strong>8.1.</strong> {isSlovak
                  ? 'Zaväzujeme sa bezpečne uchovávať všetky osobné údaje. Preto sme zaviedli primerané fyzické, technické a organizačné opatrenia a plány na ochranu a zabezpečenie osobných údajov (ktoré vás však nezbavujú zodpovednosti za prijatie primeraných krokov na zabezpečenie vašich údajov, najmä pri prenose údajov). Naším cieľom je eliminovať akékoľvek neoprávnené alebo nezákonné spracovanie osobných údajov, ako aj akýkoľvek náhodný, neoprávnený alebo nezákonný prístup, použitie, prenos, spracovanie, kopírovanie, prenos, zmenu, stratu alebo poškodenie osobných údajov.'
                  : 'We undertake to securely store all personal data. Therefore, we have implemented adequate physical, technical and organizational measures and plans to protect and secure personal data (which, however, does not relieve you of the responsibility to take adequate steps to secure your data, especially when transferring data). Our goal is to eliminate any unauthorized or unlawful processing of personal data, as well as any accidental, unauthorized or unlawful access, use, transfer, processing, copying, transfer, modification, loss or damage to personal data.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '9. VAŠE PRÁVA' : '9. YOUR RIGHTS'}
              </h2>
              
              <p className="mb-4">
                <strong>9.1.</strong> {isSlovak
                  ? 'V súlade s pravidlami a podmienkami stanovenými v GDPR máte alebo môžete mať nárok na nasledujúce práva vo vzťahu k vašim osobným údajom:'
                  : 'In accordance with the rules and conditions set out in the GDPR, you have or may be entitled to the following rights in relation to your personal data:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  <strong>{isSlovak ? 'a) Právo na prístup' : 'a) Right of access'}</strong>
                  <p className="mt-1">
                    {isSlovak
                      ? 'Máte právo požiadať nás o potvrdenie, či osobné údaje, ktoré sa vás týkajú, sú alebo nie sú našou spoločnosťou spracovávané, a ak áno, môžete získať prístup k dodatočným informáciám o takomto spracovaní.'
                      : 'You have the right to request confirmation from us as to whether personal data concerning you is being processed by our company, and if so, you can obtain access to additional information about such processing.'}
                  </p>
                </li>
                <li>
                  <strong>{isSlovak ? 'b) Právo na výmaz (právo byť zabudnutý)' : 'b) Right to erasure (right to be forgotten)'}</strong>
                  <p className="mt-1">
                    {isSlovak
                      ? 'Máte právo nás bez zbytočného odkladu požiadať o výmaz osobných údajov, ktoré sa vás týkajú, a my máme povinnosť tieto údaje bez zbytočného odkladu vymazať, ak sú splnené všetky príslušné podmienky podľa GDPR.'
                      : 'You have the right to request us to erase personal data concerning you without undue delay, and we have an obligation to erase such data without undue delay if all relevant conditions under the GDPR are met.'}
                  </p>
                </li>
                <li>
                  <strong>{isSlovak ? 'c) Právo na opravu' : 'c) Right to rectification'}</strong>
                  <p className="mt-1">
                    {isSlovak
                      ? 'Máte právo nás bez zbytočného odkladu požiadať o opravu nepresných alebo neúplných osobných údajov, ktoré sa vás týkajú.'
                      : 'You have the right to request us to rectify inaccurate or incomplete personal data concerning you without undue delay.'}
                  </p>
                </li>
                <li>
                  <strong>{isSlovak ? 'd) Právo vzniesť námietku' : 'd) Right to object'}</strong>
                  <p className="mt-1">
                    {isSlovak
                      ? 'Z dôvodov týkajúcich sa vašej konkrétnej situácie máte právo kedykoľvek vzniesť námietku proti spracovaniu osobných údajov.'
                      : 'For reasons relating to your particular situation, you have the right to object to the processing of personal data at any time.'}
                  </p>
                </li>
                <li>
                  <strong>{isSlovak ? 'e) Právo na obmedzenie spracovania' : 'e) Right to restriction of processing'}</strong>
                  <p className="mt-1">
                    {isSlovak
                      ? 'Máte právo nás požiadať o obmedzenie spracovania osobných údajov.'
                      : 'You have the right to request us to restrict the processing of personal data.'}
                  </p>
                </li>
                <li>
                  <strong>{isSlovak ? 'f) Právo na prenosnosť údajov' : 'f) Right to data portability'}</strong>
                  <p className="mt-1">
                    {isSlovak
                      ? 'Máte právo obdržať osobné údaje, ktoré sa vás týkajú a ktoré ste nám poskytli, v štruktúrovanom, bežne používanom a strojovo čitateľnom formáte, a máte právo predať tieto údaje inému správcovi, bez toho, aby sme tomu bránili.'
                      : 'You have the right to receive personal data concerning you that you have provided to us in a structured, commonly used and machine-readable format, and you have the right to transmit such data to another controller without us hindering it.'}
                  </p>
                </li>
                <li>
                  <strong>{isSlovak ? 'g) Právo na odvolanie súhlasu' : 'g) Right to withdraw consent'}</strong>
                  <p className="mt-1">
                    {isSlovak
                      ? 'Ak je spracovanie založené na súhlase, môžete svoj súhlas kedykoľvek odvolať. Takéto odvolanie nebude mať vplyv na zákonnosť spracovania na základe vášho súhlasu pred jeho odvolaním.'
                      : 'If processing is based on consent, you may withdraw your consent at any time. Such withdrawal will not affect the lawfulness of processing based on your consent before its withdrawal.'}
                  </p>
                </li>
              </ul>

              <p className="mb-4">
                <strong>9.2.</strong> {isSlovak
                  ? 'Ak máte pocit, že vaše osobné údaje boli spracované nezákonne, kontaktujte nás na info@gastrocorner.sk a my problém vyriešime. Máte právo podať sťažnosť u príslušného dozorného úradu. Zoznam príslušných dozorných úradov v Európskej únii je k dispozícii na stránkach '
                  : 'If you feel that your personal data has been processed unlawfully, contact us at info@gastrocorner.sk and we will resolve the issue. You have the right to file a complaint with the relevant supervisory authority. A list of relevant supervisory authorities in the European Union is available at '}
                <a href="https://ec.europa.eu/digital-single-market/en/news/list-personal-data-protection-competent-authorities" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {isSlovak ? 'Európska komisia' : 'European Commission'}
                </a>.
                {isSlovak
                  ? ' V Slovenskej republike je príslušným dozorným úradom Úrad na ochranu osobných údajov Slovenskej republiky. Viac sa dozviete na '
                  : ' In the Slovak Republic, the relevant supervisory authority is the Office for Personal Data Protection of the Slovak Republic. Learn more at '}
                <a href="https://dataprotection.gov.sk/uoou/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  dataprotection.gov.sk
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '10. PRIESKUMY A POSÚDKY' : '10. SURVEYS AND REVIEWS'}
              </h2>
              
              <p className="mb-4">
                <strong>10.1.</strong> {isSlovak
                  ? 'Čas od času si môžeme vyžiadať informácie prostredníctvom prieskumov. Účasť v týchto prieskumoch je dobrovoľná a môžete sa rozhodnúť, či sa ich zúčastníte alebo nie, a zverejniť požadované informácie.'
                  : 'From time to time, we may request information through surveys. Participation in these surveys is voluntary and you can choose whether or not to participate and disclose the requested information.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '11. ZÁVEREČNÉ USTANOVENIA' : '11. FINAL PROVISIONS'}
              </h2>
              
              <p className="mb-4">
                <strong>11.1.</strong> {isSlovak
                  ? 'Používame aplikáciu umožňujúcu správu súhlasov, ktorá vám uľahčí správu ich preferencií týkajúcich sa súborov cookies a ďalších nástrojov. Vyššie uvedenú aplikáciu môžete použiť na zmenu nastavení súborov cookies, vrátane udelenia a odvolania súhlasu s používaním voliteľných súborov cookies.'
                  : 'We use a consent management application that will make it easier for you to manage your preferences regarding cookies and other tools. You can use the above application to change cookie settings, including granting and withdrawing consent to use optional cookies.'}
              </p>

              <p className="mb-4">
                <strong>11.2.</strong> {isSlovak
                  ? 'Naše služby môžu čas od času obsahovať odkazy na webové stránky našich partnerských sietí, inzerentov a pridružených spoločností. Ak kliknete na odkaz na ktorúkoľvek z týchto webových stránok, vezmite prosím na vedomie, že tieto webové stránky majú svoje vlastné zásady ochrany osobných údajov a že za tieto zásady nepreberáme žiadnu zodpovednosť.'
                  : 'Our services may from time to time contain links to websites of our partner networks, advertisers and affiliated companies. If you click on a link to any of these websites, please note that these websites have their own privacy policies and that we do not accept any responsibility for these policies.'}
              </p>

              <p className="mb-4">
                <strong>11.3.</strong> {isSlovak
                  ? 'Naše služby nie sú určené osobám mladším ako 18 rokov. Ak je nám známe, nezhromažďujeme osobné údaje od osôb mladších ako 18 rokov.'
                  : 'Our services are not intended for persons under 18 years of age. To our knowledge, we do not collect personal data from persons under 18 years of age.'}
              </p>

              <p className="mb-4">
                <strong>11.4.</strong> {isSlovak
                  ? 'Vyhradzujeme si právo tieto zásady ochrany osobných údajov kedykoľvek a z akéhokoľvek dôvodu zmeniť, upraviť, doplniť alebo inak zmeniť.'
                  : 'We reserve the right to change, modify, supplement or otherwise modify this Privacy Policy at any time and for any reason.'}
              </p>

              <p className="mb-4">
                <strong>11.5.</strong> {isSlovak
                  ? 'Ak máte akékoľvek otázky týkajúce sa týchto Zásad ochrany osobných údajov alebo našich postupov v oblasti ochrany osobných údajov, kontaktujte nás e-mailom na adrese info@gastrocorner.sk alebo na adresu sídla Prevádzkovateľa: Námestie Hraničiarov 2581/4A, 851 03 Bratislava - mestská časť Petržalka.'
                  : 'If you have any questions regarding this Privacy Policy or our privacy practices, contact us by email at info@gastrocorner.sk or at the registered office address of the Operator: Námestie Hraničiarov 2581/4A, 851 03 Bratislava - mestská časť Petržalka.'}
              </p>

              <p className="mt-6 text-sm text-gray-600">
                {isSlovak
                  ? 'Tieto Zásady ochrany osobných údajov nadobúdajú platnosť a účinnosť dňom 27.11.2025.'
                  : 'This Privacy Policy becomes valid and effective on November 27, 2025.'}
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

