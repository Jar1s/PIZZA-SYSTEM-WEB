'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function TermsOfServicePage() {
  const { language } = useLanguage();
  const router = useRouter();
  const isSlovak = language === 'sk';

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
              {isSlovak ? 'Obchodné podmienky' : 'Terms of Service'}
            </h1>
          </div>

          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '1. ÚVODNÉ USTANOVENIA A DEFINÍCIE' : '1. INTRODUCTORY PROVISIONS AND DEFINITIONS'}
              </h2>
              
              <p className="mb-4">
                <strong>1.1.</strong> {isSlovak 
                  ? 'Tieto obchodné podmienky (ďalej len „Podmienky") vydáva spoločnosť Gastro Corner s.r.o., IČ: 53182120, so sídlom Námestie Hraničiarov 2581/4A, 851 03 Bratislava - mestská časť Petržalka, zapísaná v obchodnom registri vedenom Mestským súdom Bratislava III, vložka číslo 146881/B (ďalej len „Prevádzkovateľ").'
                  : 'These terms of service (hereinafter referred to as "Terms") are issued by Gastro Corner s.r.o., ID: 53182120, with registered office at Námestie Hraničiarov 2581/4A, 851 03 Bratislava - mestská časť Petržalka, registered in the Commercial Register kept by the Municipal Court Bratislava III, file number 146881/B (hereinafter referred to as "Operator").'}
              </p>

              <p className="mb-4">
                <strong>1.2.</strong> {isSlovak
                  ? 'Tieto Podmienky upravujú vzájomné práva a povinnosti medzi Prevádzkovateľom a Používateľom vznikajúce pri prevádzke a používaní online objednávkového systému Prevádzkovateľa, ako aj ďalšie práva a povinnosti Používateľov pri využívaní služieb poskytovaných prostredníctvom tohto systému, a to najmä:'
                  : 'These Terms govern the mutual rights and obligations between the Operator and User arising from the operation and use of the Operator\'s online ordering system, as well as other rights and obligations of Users when using services provided through this system, in particular:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  {isSlovak
                    ? 'a) vzájomné práva a povinnosti medzi Prevádzkovateľom a Používateľom, ktoré vznikajú pri prístupe a používaní online objednávkového systému a ktoré vyplývajú z využívania služieb a používateľského účtu;'
                    : 'a) mutual rights and obligations between the Operator and User arising from access to and use of the online ordering system and resulting from the use of services and user account;'}
                </li>
                <li>
                  {isSlovak
                    ? 'b) vzájomné práva a povinnosti týkajúce sa kúpnych zmlúv uzatváraných ohľadom Produktov, prípadne iných zmlúv (napr. týkajúcich sa doručovacích služieb), pričom tieto Podmienky sú neoddeliteľnou súčasťou kúpnej (prípadne inej) zmluvy uzavretej medzi Prevádzkovateľom a Používateľom.'
                    : 'b) mutual rights and obligations regarding purchase contracts concluded for Products, or other contracts (e.g., regarding delivery services), whereby these Terms are an integral part of the purchase (or other) contract concluded between the Operator and User.'}
                </li>
              </ul>

              <p className="mb-4">
                <strong>1.3.</strong> {isSlovak
                  ? 'Ak z kontextu nevyplýva inak, majú nasledujúce slová a výrazy použité v týchto Podmienkach nasledujúci význam:'
                  : 'Unless the context indicates otherwise, the following words and expressions used in these Terms have the following meaning:'}
              </p>

              <p className="mb-4">
                <strong>1.3.1.</strong> {isSlovak
                  ? '"Online objednávkový systém" je technické riešenie, resp. webová aplikácia Prevádzkovateľa, ktorého hlavnou podstatou a funkciou je umožnenie Používateľom prehliadať, objednať a kúpiť Produkty Prevádzkovateľa a uzatvorenie kúpnej zmluvy ohľadom príslušných Produktov, prípadne zprostredkovanie doručovacích služieb.'
                  : '"Online ordering system" is a technical solution, i.e., a web application of the Operator, the main essence and function of which is to enable Users to browse, order and purchase Products of the Operator and to conclude a purchase contract for the relevant Products, or to mediate delivery services.'}
              </p>

              <p className="mb-4">
                <strong>1.3.2.</strong> {isSlovak
                  ? '"Autorský zákon" je zákon č. 121/2000 Zb., o práve autorskom, o právach súvisiacich s právom autorským a o zmene niektorých zákonov, v platnom znení.'
                  : '"Copyright Act" is Act No. 121/2000 Coll., on Copyright, Rights Related to Copyright and Amendment of Certain Acts, as amended.'}
              </p>

              <p className="mb-4">
                <strong>1.3.3.</strong> {isSlovak
                  ? '"Produkty" sú produkty a služby Prevádzkovateľa ponúkané a predávané Prevádzkovateľom prostredníctvom online objednávkového systému Používateľom za účelom priamej a okamžitej spotreby.'
                  : '"Products" are products and services of the Operator offered and sold by the Operator through the online ordering system to Users for the purpose of direct and immediate consumption.'}
              </p>

              <p className="mb-4">
                <strong>1.3.4.</strong> {isSlovak
                  ? '"Podmienky" sú tieto obchodné podmienky používania online objednávkového systému.'
                  : '"Terms" are these terms of service for using the online ordering system.'}
              </p>

              <p className="mb-4">
                <strong>1.3.5.</strong> {isSlovak
                  ? '"Prevádzkovateľ" je spoločnosť vymedzená v čl. 1.1 týchto Podmienok.'
                  : '"Operator" is the company defined in Article 1.1 of these Terms.'}
              </p>

              <p className="mb-4">
                <strong>1.3.7.</strong> {isSlovak
                  ? '"Občiansky zákonník" je zákon č. 89/2012 Zb., občiansky zákonník, v platnom znení.'
                  : '"Civil Code" is Act No. 89/2012 Coll., Civil Code, as amended.'}
              </p>

              <p className="mb-4">
                <strong>1.3.6.</strong> {isSlovak
                  ? '"Používateľ" je fyzická alebo právnická osoba uzatvárajúca kúpnu zmluvu ohľadom Produktu s Prevádzkovateľom prostredníctvom online objednávkového systému.'
                  : '"User" is a natural or legal person concluding a purchase contract for a Product with the Operator through the online ordering system.'}
              </p>

              <p className="mb-4">
                <strong>1.3.7.</strong> {isSlovak
                  ? '"Zákon o ochrane spotrebiteľa" je zákon č. 634/1992 Zb., o ochrane spotrebiteľa, v platnom znení.'
                  : '"Consumer Protection Act" is Act No. 634/1992 Coll., on Consumer Protection, as amended.'}
              </p>

              <p className="mb-4">
                <strong>1.4.</strong> {isSlovak
                  ? 'Používateľ vyhlasuje a výslovne potvrdzuje, že si pred začatím využívania služieb online objednávkového systému dôkladne prečítal tieto Podmienky, úplne im porozumel, súhlasí s nimi a zaväzuje sa nimi riadiť. Používateľ ďalej vyhlasuje a zaručuje, že je spôsobilý na právne konanie (najmä s ohľadom na svoj vek) alebo je zastúpený svojím zákonným zástupcom.'
                  : 'The User declares and expressly confirms that before starting to use the online ordering system services, they have carefully read these Terms, fully understood them, agree with them and undertake to comply with them. The User further declares and warrants that they are capable of legal acts (especially with regard to their age) or are represented by their legal representative.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '2. ZÁKLADNÉ PRINCÍPY FUNGOVANIA ONLINE OBJEDNÁVKOVÉHO SYSTÉMU' : '2. BASIC PRINCIPLES OF THE ONLINE ORDERING SYSTEM'}
              </h2>
              
              <p className="mb-4">
                <strong>2.1.</strong> {isSlovak
                  ? 'Prevádzkovateľ ponúka a predáva Produkty Používateľom prostredníctvom online objednávkového systému. Prostredníctvom tohto systému dochádza k uzatváraniu kúpnych zmlúv týkajúcich sa Produktov (prípadne zmlúv ohľadom doručovacích služieb), vrátane miesta umožňujúceho komunikáciu a riešenie prípadných reklamácií. Prevádzkovateľ umožňuje Používateľom vykonávať platby za Produkty prostredníctvom online platobného systému.'
                  : 'The Operator offers and sells Products to Users through the online ordering system. Through this system, purchase contracts for Products (or contracts for delivery services) are concluded, including a place enabling communication and resolution of possible complaints. The Operator enables Users to make payments for Products through the online payment system.'}
              </p>

              <p className="mb-4">
                <strong>2.2.</strong> {isSlovak
                  ? 'Pre prístup a používanie online objednávkového systému potrebuje Používateľ pripojenie k internetu, počítač, mobilné zariadenie alebo iné zariadenie s webovým prehliadačom. Funkcie a vlastnosti dostupné prostredníctvom online objednávkového systému sa môžu líšiť v závislosti na zariadení. Kompatibilita sa môže čas od času zmeniť.'
                  : 'To access and use the online ordering system, the User needs an internet connection, a computer, mobile device or other device with a web browser. Features and properties available through the online ordering system may vary depending on the device. Compatibility may change from time to time.'}
              </p>

              <p className="mb-4">
                <strong>2.3.</strong> {isSlovak
                  ? 'Kúpna zmluva ohľadom Produktov sa uzatvára medzi Používateľom ako kupujúcim a Prevádzkovateľom ako predávajúcim. Prevádzkovateľ odpovedá za kvalitu a pôvod Produktov a za úhradu alebo dodanie Produktov v súlade s týmito Podmienkami.'
                  : 'The purchase contract for Products is concluded between the User as buyer and the Operator as seller. The Operator is responsible for the quality and origin of Products and for payment or delivery of Products in accordance with these Terms.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '3. REGISTRÁCIA A POUŽÍVATEĽSKÝ ÚČET' : '3. REGISTRATION AND USER ACCOUNT'}
              </h2>
              
              <p className="mb-4">
                <strong>3.1.</strong> {isSlovak
                  ? 'Na základe registrácie Používateľa vykonanej v online objednávkovom systéme môže Používateľ pristupovať do svojho používateľského účtu a odtiaľ môže Používateľ vykonávať objednávanie Produktov. Používateľ môže objednávať Produkty aj bez registrácie.'
                  : 'Based on the User\'s registration performed in the online ordering system, the User can access their user account and from there the User can place orders for Products. The User can also order Products without registration.'}
              </p>

              <p className="mb-4">
                <strong>3.2.</strong> {isSlovak
                  ? 'Ak si Používateľ vytvorí používateľský účet, je povinný uviesť správne a pravdivo všetky požadované údaje. Používateľ sa zaväzuje udržiavať údaje uvedené v ich používateľskom účte aktuálne a presné a v prípade, že dôjde k zmene týchto údajov, zmenené údaje bez zbytočného odkladu aktualizovať.'
                  : 'If the User creates a user account, they are obliged to provide correctly and truthfully all required data. The User undertakes to keep the data provided in their user account current and accurate and, in the event of a change in this data, to update the changed data without undue delay.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '4. PREZENTÁCIA PRODUKTOV' : '4. PRODUCT PRESENTATION'}
              </h2>
              
              <p className="mb-4">
                <strong>4.1.</strong> {isSlovak
                  ? 'Ponuka a prezentácia Produktov umiestnená v online objednávkovom systéme obsahuje označenie Produktu a jeho cenu, a ďalej tiež cenu za balenie a dodanie Produktu. Prezentácia Produktov môže obsahovať rovnako podrobnejší popis Produktu, jeho vlastnosti, veľkosti, dostupnosti a prípadne tiež fotografické zobrazenie Produktu.'
                  : 'The offer and presentation of Products placed in the online ordering system contains the designation of the Product and its price, as well as the price for packaging and delivery of the Product. The presentation of Products may also contain a more detailed description of the Product, its properties, sizes, availability and possibly also a photographic representation of the Product.'}
              </p>

              <p className="mb-4">
                <strong>4.2.</strong> {isSlovak
                  ? 'Používateľ berie na vedomie, že celá prezentácia Produktov umiestnená v katalógu online objednávkového systému predstavuje výzvu k predkladaniu ponúk od Používateľov a Prevádzkovateľ ako predávajúci nie je povinný uzatvoriť kúpnu zmluvu ohľadom týchto Produktov s Používateľom.'
                  : 'The User acknowledges that the entire presentation of Products placed in the online ordering system catalog represents an invitation to submit offers from Users and the Operator as seller is not obliged to conclude a purchase contract for these Products with the User.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '5. UZATVORENIE KÚPNEJ ZMLUVY' : '5. CONCLUSION OF PURCHASE CONTRACT'}
              </h2>
              
              <p className="mb-4">
                <strong>5.1.</strong> {isSlovak
                  ? 'Používateľ môže objednať Produkty od Prevádzkovateľa nasledujúcimi spôsobmi:'
                  : 'The User can order Products from the Operator in the following ways:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  {isSlovak
                    ? 'a) v prípade registrácie v online objednávkovom systéme: prostredníctvom svojho používateľského účtu;'
                    : 'a) in case of registration in the online ordering system: through their user account;'}
                </li>
                <li>
                  {isSlovak
                    ? 'b) bez registrácie v online objednávkovom systéme: vyplnením objednávkového formulára.'
                    : 'b) without registration in the online ordering system: by filling out the order form.'}
                </li>
              </ul>

              <p className="mb-4">
                <strong>5.2.</strong> {isSlovak
                  ? 'Pri vykonávaní objednávky si Používateľ zvolí Produkt a počet kusov tohto Produktu. Po celú dobu pred tým, než Používateľ objednávku záväzne odošle kliknutím na tlačidlo „Objednať a zaplatiť", môže kontrolovať a meniť už zadané údaje a vracať sa k predchádzajúcim krokom tejto objednávky. Zároveň má Používateľ možnosť v ktorejkoľvek fáze objednávania Produktu prerušiť vykonávanie vyššie popísaných krokov, opustiť online objednávkový systém, v ktorom sa objednávka Produktu vykonáva, a týmto proces objednávania Produktu zrušiť.'
                  : 'When placing an order, the User selects the Product and the number of pieces of this Product. At all times before the User definitively sends the order by clicking the "Order and pay" button, they can check and change the already entered data and return to the previous steps of this order. At the same time, the User has the option at any stage of ordering the Product to interrupt the execution of the steps described above, leave the online ordering system in which the Product order is being executed, and thereby cancel the Product ordering process.'}
              </p>

              <p className="mb-4">
                <strong>5.3.</strong> {isSlovak
                  ? 'Objednávka Používateľa sa stáva záväznou až v okamihu jej odoslania kliknutím na tlačidlo „Objednať a zaplatiť".'
                  : 'The User\'s order becomes binding only at the moment of its sending by clicking the "Order and pay" button.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '6. KÚPNA CENA A SPÔSOBY PLATBY' : '6. PURCHASE PRICE AND PAYMENT METHODS'}
              </h2>
              
              <p className="mb-4">
                <strong>6.1.</strong> {isSlovak
                  ? 'V online objednávkovom systéme sú kúpne ceny Produktov uvedené vrátane DPH. Náklady na dodanie a balenie Produktov sa môžu líšiť podľa vybraného spôsobu dodania a úhrady kúpnej ceny.'
                  : 'In the online ordering system, purchase prices of Products are stated including VAT. Costs for delivery and packaging of Products may vary depending on the selected method of delivery and payment of the purchase price.'}
              </p>

              <p className="mb-4">
                <strong>6.2.</strong> {isSlovak
                  ? 'Používateľ je o celkovej cene vrátane všetkých poplatkov podrobne informovaný pred uzatvorením zmluvy.'
                  : 'The User is informed in detail about the total price including all fees before concluding the contract.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '7. SPÔSOBY DODANIA' : '7. DELIVERY METHODS'}
              </h2>
              
              <p className="mb-4">
                <strong>7.1.</strong> {isSlovak
                  ? 'V závislosti na výbere Používateľa a podľa toho, či je daný spôsob doručenia Používateľovi v online objednávkovom systéme aktuálne k dispozícii, môže byť dodanie objednaného Produktu realizované nasledujúcimi spôsobmi:'
                  : 'Depending on the User\'s choice and whether the given delivery method is currently available to the User in the online ordering system, delivery of the ordered Product may be carried out in the following ways:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  {isSlovak
                    ? 'a) osobné vyzdvihnutie Používateľom na jeho vlastné náklady v prevádzke Prevádzkovateľa;'
                    : 'a) personal pickup by the User at their own expense at the Operator\'s premises;'}
                </li>
                <li>
                  {isSlovak
                    ? 'b) dodanie Prevádzkovateľom do miesta v prevádzke Prevádzkovateľa (k stolu), ktoré Používateľ uviedol v objednávke;'
                    : 'b) delivery by the Operator to a place in the Operator\'s premises (to the table) that the User specified in the order;'}
                </li>
                <li>
                  {isSlovak
                    ? 'c) dodanie do miesta, ktoré Používateľ uviedol v objednávke ako miesto dodania, a to Prevádzkovateľom alebo s využitím doručovacej služby (náklady na dopravu môžu byť v takomto prípade účtované Používateľovi podľa čiastok uvedených v online objednávkovom systéme).'
                    : 'c) delivery to a place that the User specified in the order as the delivery place, by the Operator or using a delivery service (transportation costs may be charged to the User in such case according to the amounts stated in the online ordering system).'}
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '8. AUTORSKÉ PRÁVO A SÚVISIAce UJEDNANIA' : '8. COPYRIGHT AND RELATED AGREEMENTS'}
              </h2>
              
              <p className="mb-4">
                <strong>8.1.</strong> {isSlovak
                  ? 'Používateľ berie na vedomie, že online objednávkový systém je chránený Autorským zákonom a ďalšími súvisiacimi predpismi. Všetky práva k online objednávkovému systému, najmä autorské práva k obsahu, vrátane rozvrhnutia stránky, grafiky, fotiek, filmov, ochranných známok, loga a ďalšieho obsahu a prvkov, patria Prevádzkovateľovi.'
                  : 'The User acknowledges that the online ordering system is protected by the Copyright Act and other related regulations. All rights to the online ordering system, especially copyrights to the content, including page layout, graphics, photos, films, trademarks, logos and other content and elements, belong to the Operator.'}
              </p>

              <p className="mb-4">
                <strong>8.2.</strong> {isSlovak
                  ? 'Je zakázané kopírovať, upravovať alebo inak používať online objednávkový systém alebo jeho časť bez súhlasu Prevádzkovateľa.'
                  : 'It is prohibited to copy, modify or otherwise use the online ordering system or its part without the Operator\'s consent.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '9. ĎALŠIE PRÁVA A POVINNOSTI POUŽÍVATEĽA' : '9. OTHER RIGHTS AND OBLIGATIONS OF THE USER'}
              </h2>
              
              <p className="mb-4">
                <strong>9.1.</strong> {isSlovak
                  ? 'Používateľ je povinný používať online objednávkový systém v súlade s týmito Podmienkami, riadiť sa platnými právnymi predpismi, konať poctivo a v súlade s dobrými mravmi.'
                  : 'The User is obliged to use the online ordering system in accordance with these Terms, to comply with applicable legal regulations, to act honestly and in accordance with good morals.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '10. OCHRANA OSOBNÝCH ÚDAJOV' : '10. PERSONAL DATA PROTECTION'}
              </h2>
              
              <p className="mb-4">
                <strong>10.1.</strong> {isSlovak
                  ? 'Používatelia berú na vedomie, že Prevádzkovateľ spracúva nimi poskytnuté osobné údaje za účelom prevádzky online objednávkového systému v súlade s právnymi predpismi týkajúcimi sa spracovania a ochrany osobných údajov a to najmä, nie však výlučne, nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 z 27. apríla 2016 o ochrane fyzických osôb v súvislosti so spracovaním osobných údajov a o voľnom pohybe týchto údajov a o zrušení smernice 95/46/ES (všeobecné nariadenie o ochrane údajov – GDPR) a zákonom č. 18/2018 Z. z., o ochrane osobných údajov, v platnom znení. Podrobnosti ohľadom spracovania osobných údajov Používateľov Prevádzkovateľom sú uvedené v príslušnej sekcii online objednávkového systému týkajúcej sa ochrany osobných údajov.'
                  : 'Users acknowledge that the Operator processes their provided personal data for the purpose of operating the online ordering system in accordance with legal regulations regarding the processing and protection of personal data, in particular, but not exclusively, Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation – GDPR) and Act No. 18/2018 Coll., on the protection of personal data, as amended. Details regarding the processing of Users\' personal data by the Operator are set out in the relevant section of the online ordering system regarding personal data protection.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '11. SŤAŽNOSTI A OZNÁMENIA' : '11. COMPLAINTS AND NOTIFICATIONS'}
              </h2>
              
              <p className="mb-4">
                <strong>11.1.</strong> {isSlovak
                  ? 'Sťažnosti týkajúce sa služieb, vrátane oznámení o nezákonnej činnosti alebo nezákonnom obsahu, možno zasielať na nasledujúci e-mail: info@gastrocorner.sk alebo na adresu sídla Prevádzkovateľa.'
                  : 'Complaints regarding services, including notifications of illegal activity or illegal content, can be sent to the following email: info@gastrocorner.sk or to the registered office address of the Operator.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '12. ZÁVEREČNÉ USTANOVENIA' : '12. FINAL PROVISIONS'}
              </h2>
              
              <p className="mb-4">
                <strong>12.1.</strong> {isSlovak
                  ? 'Všetky dohody medzi Prevádzkovateľom a Používateľom sa riadia právnym poriadkom Slovenskej republiky, ak to neodporuje kogentným ustanoveniam na ochranu spotrebiteľa. Ak je Používateľ spotrebiteľom a má obvyklé bydlisko v EÚ, požíva navyše ochrany poskytovanej záväznými ustanoveniami právnych predpisov krajiny svojho bydliska.'
                  : 'All agreements between the Operator and User are governed by the legal order of the Slovak Republic, unless this contradicts mandatory provisions for consumer protection. If the User is a consumer and has a habitual residence in the EU, they additionally enjoy the protection provided by the mandatory provisions of the legal regulations of their country of residence.'}
              </p>

              <p className="mb-4">
                <strong>12.2.</strong> {isSlovak ? 'Kontaktné údaje Prevádzkovateľa:' : 'Operator contact details:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  {isSlovak
                    ? 'a) adresa pre doručovanie: Námestie Hraničiarov 2581/4A, 851 03 Bratislava - mestská časť Petržalka'
                    : 'a) delivery address: Námestie Hraničiarov 2581/4A, 851 03 Bratislava - mestská časť Petržalka'}
                </li>
                <li>
                  {isSlovak
                    ? 'b) e-mail: info@gastrocorner.sk'
                    : 'b) email: info@gastrocorner.sk'}
                </li>
                <li>
                  {isSlovak
                    ? 'c) telefón: 0914 363 363'
                    : 'c) phone: 0914 363 363'}
                </li>
              </ul>

              <p className="mb-4">
                <strong>12.3.</strong> {isSlovak
                  ? 'Tieto Podmienky nadobúdajú platnosť a účinnosť dňom 27.11.2025.'
                  : 'These Terms become valid and effective on November 27, 2025.'}
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

