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
                  ? 'Tieto obchodné podmienky (ďalej len „Podmienky") vydáva spoločnosť Choice QR s.r.o., IČ: 09517600, so sídlom Na příkopě 857/18, Nové Město, 110 00 Praha 1, zapísaná v obchodnom registri vedenom Mestským súdom v Prahe, spisová značka C 337491 (ďalej len „Prevádzkovateľ").'
                  : 'These terms of service (hereinafter referred to as "Terms") are issued by Choice QR s.r.o., ID: 09517600, with registered office at Na příkopě 857/18, Nové Město, 110 00 Praha 1, registered in the Commercial Register kept by the Municipal Court in Prague, file number C 337491 (hereinafter referred to as "Operator").'}
              </p>

              <p className="mb-4">
                <strong>1.2.</strong> {isSlovak
                  ? 'Tieto Podmienky upravujú vzájomné práva a povinnosti medzi Prevádzkovateľom, Používateľom a Partnerom vznikajúce pri prevádzke a používaní Aplikácie Choice, ako aj ďalšie práva a povinnosti Používateľov pri využívaní služieb poskytovaných v súvislosti s Aplikáciou Choice, a to najmä:'
                  : 'These Terms govern the mutual rights and obligations between the Operator, User and Partner arising from the operation and use of the Choice Application, as well as other rights and obligations of Users when using services provided in connection with the Choice Application, in particular:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  {isSlovak
                    ? 'a) vzájomné práva a povinnosti medzi Prevádzkovateľom a Používateľom, ktoré vznikajú pri prístupe a používaní Aplikácie Choice a ktoré vyplývajú z využívania služieb Aplikácie Choice a používateľského účtu;'
                    : 'a) mutual rights and obligations between the Operator and User arising from access to and use of the Choice Application and resulting from the use of Choice Application services and user account;'}
                </li>
                <li>
                  {isSlovak
                    ? 'b) vzájomné práva a povinnosti týkajúce sa kúpnych zmlúv uzatváraných ohľadom Produktov, prípadne iných zmlúv (napr. týkajúcich sa doručovacích služieb), ktorých uzavretie zprostredkúva Prevádzkovateľ prostredníctvom Aplikácie Choice, pričom tieto Podmienky sú neoddeliteľnou súčasťou kúpnej (prípadne inej) zmluvy uzavretej medzi Partnerom a Používateľom.'
                    : 'b) mutual rights and obligations regarding purchase contracts concluded for Products, or other contracts (e.g., regarding delivery services), the conclusion of which is mediated by the Operator through the Choice Application, whereby these Terms are an integral part of the purchase (or other) contract concluded between the Partner and User.'}
                </li>
              </ul>

              <p className="mb-4">
                <strong>1.3.</strong> {isSlovak
                  ? 'Ak z kontextu nevyplýva inak, majú nasledujúce slová a výrazy použité v týchto Podmienkach nasledujúci význam:'
                  : 'Unless the context indicates otherwise, the following words and expressions used in these Terms have the following meaning:'}
              </p>

              <p className="mb-4">
                <strong>1.3.1.</strong> {isSlovak
                  ? '"Aplikácia Choice" je technické riešenie, resp. počítačový program alebo aplikácia s názvom Choice, ktorého hlavnou podstatou a funkciou je umožnenie Používateľom prehliadať, objednať a kúpiť Produkty Partnerov Prevádzkovateľa a zprostredkovanie uzatvorenia kúpnej zmluvy ohľadom príslušných Produktov s daným Partnerom, prípadne zprostredkovanie doručovacích služieb, ďalej tiež vykonanie rezervácie miesta u Partnerov, správa marketingu pre Partnerov, ako aj zprostredkovanie komunikácie Partnerov s Používateľmi.'
                  : '"Choice Application" is a technical solution, i.e., a computer program or application named Choice, the main essence and function of which is to enable Users to browse, order and purchase Products of the Operator\'s Partners and to mediate the conclusion of a purchase contract for the relevant Products with a given Partner, or to mediate delivery services, as well as to make reservations at Partners, manage marketing for Partners, and to mediate communication between Partners and Users.'}
              </p>

              <p className="mb-4">
                <strong>1.3.2.</strong> {isSlovak
                  ? '"Autorský zákon" je zákon č. 121/2000 Zb., o práve autorskom, o právach súvisiacich s právom autorským a o zmene niektorých zákonov, v platnom znení.'
                  : '"Copyright Act" is Act No. 121/2000 Coll., on Copyright, Rights Related to Copyright and Amendment of Certain Acts, as amended.'}
              </p>

              <p className="mb-4">
                <strong>1.3.3.</strong> {isSlovak
                  ? '"Partner" je prevádzkovateľ reštaurácie alebo iného podniku poskytujúceho gastronomické služby, prípadne iný partner (podnikajúca fyzická alebo právnická osoba), ktorého Produkty sú ponúkané a predávané prostredníctvom Aplikácie Choice.'
                  : '"Partner" is the operator of a restaurant or other establishment providing gastronomic services, or another partner (an entrepreneur, natural or legal person), whose Products are offered and sold through the Choice Application.'}
              </p>

              <p className="mb-4">
                <strong>1.3.4.</strong> {isSlovak
                  ? '"Podmienky" sú tieto obchodné podmienky používania Aplikácie Choice.'
                  : '"Terms" are these terms of service for using the Choice Application.'}
              </p>

              <p className="mb-4">
                <strong>1.3.5.</strong> {isSlovak
                  ? '"Produkty" sú produkty a služby Partnera ponúkané a predávané Partnerom prostredníctvom Aplikácie Choice Používateľom za účelom priamej a okamžitej spotreby.'
                  : '"Products" are products and services of the Partner offered and sold by the Partner through the Choice Application to Users for the purpose of direct and immediate consumption.'}
              </p>

              <p className="mb-4">
                <strong>1.3.6.</strong> {isSlovak
                  ? '"Prevádzkovateľ" je spoločnosť vymedzená v čl. 1.1 týchto Podmienok.'
                  : '"Operator" is the company defined in Article 1.1 of these Terms.'}
              </p>

              <p className="mb-4">
                <strong>1.3.7.</strong> {isSlovak
                  ? '"Občiansky zákonník" je zákon č. 89/2012 Zb., občiansky zákonník, v platnom znení.'
                  : '"Civil Code" is Act No. 89/2012 Coll., Civil Code, as amended.'}
              </p>

              <p className="mb-4">
                <strong>1.3.8.</strong> {isSlovak
                  ? '"Používateľ" je fyzická alebo právnická osoba uzatvárajúca kúpnu zmluvu ohľadom Produktu s Partnerom prostredníctvom Aplikácie Choice.'
                  : '"User" is a natural or legal person concluding a purchase contract for a Product with a Partner through the Choice Application.'}
              </p>

              <p className="mb-4">
                <strong>1.3.9.</strong> {isSlovak
                  ? '"Zákon o ochrane spotrebiteľa" je zákon č. 634/1992 Zb., o ochrane spotrebiteľa, v platnom znení.'
                  : '"Consumer Protection Act" is Act No. 634/1992 Coll., on Consumer Protection, as amended.'}
              </p>

              <p className="mb-4">
                <strong>1.4.</strong> {isSlovak
                  ? 'Používateľ vyhlasuje a výslovne potvrdzuje, že si pred začatím využívania služieb Aplikácie Choice dôkladne prečítal tieto Podmienky, úplne im porozumel, súhlasí s nimi a zaväzuje sa nimi riadiť. Používateľ ďalej vyhlasuje a zaručuje, že je spôsobilý na právne konanie (najmä s ohľadom na svoj vek) alebo je zastúpený svojím zákonným zástupcom.'
                  : 'The User declares and expressly confirms that before starting to use the Choice Application services, they have carefully read these Terms, fully understood them, agree with them and undertake to comply with them. The User further declares and warrants that they are capable of legal acts (especially with regard to their age) or are represented by their legal representative.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '2. ZÁKLADNÉ PRINCÍPY FUNGOVANIA APLIKÁCIE CHOICE' : '2. BASIC PRINCIPLES OF THE CHOICE APPLICATION'}
              </h2>
              
              <p className="mb-4">
                <strong>2.1.</strong> {isSlovak
                  ? 'Prevádzkovateľ zprostredkúva ponuku Partnerov na predaj Produktov Používateľom prostredníctvom Aplikácie Choice a umožňuje tak prepojiť Partnerov s Používateľmi. Prevádzkovateľ poskytuje Partnerom aj Používateľom prostredníctvom Aplikácie Choice miesto, na ktorom dochádza k uzatváraniu kúpnych zmlúv týkajúcich sa Produktov (prípadne zmlúv ohľadom doručovacích služieb), vrátane miesta umožňujúceho komunikáciu a riešenie prípadných reklamácií. Prevádzkovateľ ďalej napríklad umožňuje Používateľom prostredníctvom Aplikácie Choice rezervovať miesto u Partnerov a vykonávať platby za Produkty prostredníctvom QR kódov. V súvislosti so zprostredkovateľskými službami poskytovanými Prevádzkovateľom za účelom uzatvorenia kúpnej zmluvy účtuje Prevádzkovateľ Používateľovi poplatok (servisný poplatok).'
                  : 'The Operator mediates the Partners\' offer to sell Products to Users through the Choice Application and thus enables connecting Partners with Users. The Operator also provides Partners and Users through the Choice Application with a place where purchase contracts for Products (or contracts for delivery services) are concluded, including a place enabling communication and resolution of possible complaints. The Operator further, for example, enables Users through the Choice Application to make reservations at Partners and make payments for Products through QR codes. In connection with the intermediary services provided by the Operator for the purpose of concluding a purchase contract, the Operator charges the User a fee (service fee).'}
              </p>

              <p className="mb-4">
                <strong>2.2.</strong> {isSlovak
                  ? 'Pre prístup a používanie Aplikácie Choice potrebuje Používateľ pripojenie k internetu, počítač, mobilné zariadenie alebo iné zariadenie s webovým prehliadačom. Funkcie a vlastnosti dostupné prostredníctvom Aplikácie Choice sa môžu líšiť v závislosti na zariadení. Kompatibilita sa môže čas od času zmeniť.'
                  : 'To access and use the Choice Application, the User needs an internet connection, a computer, mobile device or other device with a web browser. Features and properties available through the Choice Application may vary depending on the device. Compatibility may change from time to time.'}
              </p>

              <p className="mb-4">
                <strong>2.3.</strong> {isSlovak
                  ? 'Prevádzkovateľ nie je ani kupujúcim, ani predávajúcim Produktov, ale je len poskytovateľom riešenia, ktoré uľahčuje uzatvorenie kúpnych zmlúv ohľadom Produktov; obdobne Prevádzkovateľ len zprostredkúva uzatváranie zmlúv o doručovacích alebo iných službách. Kúpna zmluva ohľadom Produktov sa uzatvára výlučne medzi Používateľom ako kupujúcim a Partnerom ako predávajúcim, a Prevádzkovateľ nie je stranou takejto kúpnej zmluvy. Prevádzkovateľ obdobne nie je zmluvnou stranou zmluvy o poskytnutí doručovacích alebo iných služieb. V tejto súvislosti Prevádzkovateľ neodpovedá za kvalitu a pôvod Produktov a rovnako neodpovedá za úhradu alebo dodanie Produktov.'
                  : 'The Operator is neither a buyer nor a seller of Products, but is only a provider of a solution that facilitates the conclusion of purchase contracts for Products; similarly, the Operator only mediates the conclusion of contracts for delivery or other services. The purchase contract for Products is concluded exclusively between the User as buyer and the Partner as seller, and the Operator is not a party to such purchase contract. Similarly, the Operator is not a contractual party to the contract for the provision of delivery or other services. In this context, the Operator is not responsible for the quality and origin of Products and is also not responsible for payment or delivery of Products.'}
              </p>

              <p className="mb-4">
                <strong>2.4.</strong> {isSlovak
                  ? 'Odpovednosť za ponúkanie a predaj Produktov a za vybavovanie reklamácií Používateľov ako kupujúcich alebo riešenie iných otázok vyplývajúcich z kúpnych zmlúv uzatvorených medzi Používateľom ako kupujúcim a Partnerom ako predávajúcim alebo v súvislosti s ňou nesie konkrétny Partner ako predávajúci, s ktorým Používateľ ako kupujúci uzatvoril zmluvu. Partner odpovedá za splnenie všetkých požiadaviek ako predajca Produktov. Partner môže zaviesť ďalšie podmienky, ktoré dopĺňajú tieto Podmienky a ktorými sa bude riadiť predaj Produktov Používateľovi. Každý Partner je podnikateľom podľa vyhlásenia predloženého Prevádzkovateľovi.'
                  : 'Responsibility for offering and selling Products and for handling complaints of Users as buyers or resolving other issues arising from purchase contracts concluded between the User as buyer and the Partner as seller or in connection therewith is borne by the specific Partner as seller with whom the User as buyer concluded the contract. The Partner is responsible for fulfilling all requirements as a seller of Products. The Partner may introduce additional conditions that supplement these Terms and which will govern the sale of Products to the User. Each Partner is an entrepreneur according to the declaration submitted to the Operator.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '3. REGISTRÁCIA A POUŽÍVATEĽSKÝ ÚČET' : '3. REGISTRATION AND USER ACCOUNT'}
              </h2>
              
              <p className="mb-4">
                <strong>3.1.</strong> {isSlovak
                  ? 'Na základe registrácie Používateľa vykonanej v Aplikácii Choice môže Používateľ pristupovať do svojho používateľského účtu a odtiaľ môže Používateľ vykonávať objednávanie Produktov. Používateľ môže objednávať Produkty aj bez registrácie.'
                  : 'Based on the User\'s registration performed in the Choice Application, the User can access their user account and from there the User can place orders for Products. The User can also order Products without registration.'}
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
                  ? 'Ponuka a prezentácia Produktov umiestnená v Aplikácii Choice obsahuje označenie Produktu a jeho cenu, a ďalej tiež údaje a informácie o konkrétnom Partnerovi, cenu za balenie a dodanie Produktu. Prezentácia Produktov môže obsahovať rovnako podrobnejší popis Produktu, jeho vlastnosti, veľkosti, dostupnosti a prípadne tiež fotografické zobrazenie Produktu.'
                  : 'The offer and presentation of Products placed in the Choice Application contains the designation of the Product and its price, as well as data and information about the specific Partner, the price for packaging and delivery of the Product. The presentation of Products may also contain a more detailed description of the Product, its properties, sizes, availability and possibly also a photographic representation of the Product.'}
              </p>

              <p className="mb-4">
                <strong>4.2.</strong> {isSlovak
                  ? 'Používateľ berie na vedomie, že celá prezentácia Produktov umiestnená v katalógu Aplikácie Choice predstavuje výzvu k predkladaniu ponúk od Používateľov a Partner ako predávajúci nie je povinný uzatvoriť kúpnu zmluvu ohľadom týchto Produktov s Používateľom.'
                  : 'The User acknowledges that the entire presentation of Products placed in the Choice Application catalog represents an invitation to submit offers from Users and the Partner as seller is not obliged to conclude a purchase contract for these Products with the User.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '5. UZATVORENIE KÚPNEJ ZMLUVY' : '5. CONCLUSION OF PURCHASE CONTRACT'}
              </h2>
              
              <p className="mb-4">
                <strong>5.1.</strong> {isSlovak
                  ? 'Používateľ môže objednať Produkty od Partnera nasledujúcimi spôsobmi:'
                  : 'The User can order Products from the Partner in the following ways:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  {isSlovak
                    ? 'a) v prípade registrácie v Aplikácii Choice: prostredníctvom svojho používateľského účtu;'
                    : 'a) in case of registration in the Choice Application: through their user account;'}
                </li>
                <li>
                  {isSlovak
                    ? 'b) bez registrácie v Aplikácii Choice: vyplnením objednávkového formulára.'
                    : 'b) without registration in the Choice Application: by filling out the order form.'}
                </li>
              </ul>

              <p className="mb-4">
                <strong>5.2.</strong> {isSlovak
                  ? 'Pri vykonávaní objednávky si Používateľ zvolí Produkt a počet kusov tohto Produktu. Po celú dobu pred tým, než Používateľ objednávku záväzne odošle kliknutím na tlačidlo „Odoslať" objednávku, môže kontrolovať a meniť už zadané údaje a vracať sa k predchádzajúcim krokom tejto objednávky. Zároveň má Používateľ možnosť v ktorejkoľvek fáze objednávania Produktu prerušiť vykonávanie vyššie popísaných krokov, opustiť Aplikáciu Choice, v ktorej sa objednávka Produktu vykonáva, a týmto proces objednávania Produktu zrušiť.'
                  : 'When placing an order, the User selects the Product and the number of pieces of this Product. At all times before the User definitively sends the order by clicking the "Send" order button, they can check and change the already entered data and return to the previous steps of this order. At the same time, the User has the option at any stage of ordering the Product to interrupt the execution of the steps described above, leave the Choice Application in which the Product order is being executed, and thereby cancel the Product ordering process.'}
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
                  ? 'V Aplikácii Choice sú kúpne ceny Produktov uvedené vrátane DPH. Náklady na dodanie a balenie Produktov sa môžu líšiť podľa vybraného spôsobu dodania a úhrady kúpnej ceny.'
                  : 'In the Choice Application, purchase prices of Products are stated including VAT. Costs for delivery and packaging of Products may vary depending on the selected method of delivery and payment of the purchase price.'}
              </p>

              <p className="mb-4">
                <strong>6.2.</strong> {isSlovak
                  ? 'Kúpna cena (celková cena) tiež zahŕňa servisný poplatok Prevádzkovateľa za zprostredkovanie zmluvy medzi Partnerom a Používateľom. Používateľ je o celkovej cene podrobne informovaný pred uzatvorením zmluvy.'
                  : 'The purchase price (total price) also includes the Operator\'s service fee for mediating the contract between the Partner and the User. The User is informed in detail about the total price before concluding the contract.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '7. SPÔSOBY DODANIA' : '7. DELIVERY METHODS'}
              </h2>
              
              <p className="mb-4">
                <strong>7.1.</strong> {isSlovak
                  ? 'V závislosti na výbere Používateľa a podľa toho, či je daný spôsob doručenia Používateľovi v Aplikácii Choice aktuálne k dispozícii, môže byť dodanie objednaného Produktu realizované nasledujúcimi spôsobmi:'
                  : 'Depending on the User\'s choice and whether the given delivery method is currently available to the User in the Choice Application, delivery of the ordered Product may be carried out in the following ways:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  {isSlovak
                    ? 'a) osobné vyzdvihnutie Používateľom na jeho vlastné náklady v prevádzke Partnera;'
                    : 'a) personal pickup by the User at their own expense at the Partner\'s premises;'}
                </li>
                <li>
                  {isSlovak
                    ? 'b) dodanie Partnerom do miesta v prevádzke Partnera (k stolu), ktoré Používateľ uviedol v objednávke (prostredníctvom naskenovania QR kódu na stole v prevádzke Partnera);'
                    : 'b) delivery by the Partner to a place in the Partner\'s premises (to the table) that the User specified in the order (by scanning the QR code on the table in the Partner\'s premises);'}
                </li>
                <li>
                  {isSlovak
                    ? 'c) dodanie do miesta, ktoré Používateľ uviedol v objednávke ako miesto dodania, a to Partnerom alebo s využitím doručovacej služby (náklady na dopravu môžu byť v takomto prípade účtované Používateľovi podľa čiastok uvedených v Aplikácii Choice).'
                    : 'c) delivery to a place that the User specified in the order as the delivery place, by the Partner or using a delivery service (transportation costs may be charged to the User in such case according to the amounts stated in the Choice Application).'}
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '8. AUTORSKÉ PRÁVO A SÚVISIAce UJEDNANIA' : '8. COPYRIGHT AND RELATED AGREEMENTS'}
              </h2>
              
              <p className="mb-4">
                <strong>8.1.</strong> {isSlovak
                  ? 'Používateľ berie na vedomie, že Aplikácia Choice je chránená Autorským zákonom a ďalšími súvisiacimi predpismi. Všetky práva k Aplikácii Choice, najmä autorské práva k obsahu, vrátane rozvrhnutia stránky, grafiky, fotiek, filmov, ochranných známok, loga a ďalšieho obsahu a prvkov, patria Prevádzkovateľovi, resp. jeho Partnerom.'
                  : 'The User acknowledges that the Choice Application is protected by the Copyright Act and other related regulations. All rights to the Choice Application, especially copyrights to the content, including page layout, graphics, photos, films, trademarks, logos and other content and elements, belong to the Operator, or its Partners.'}
              </p>

              <p className="mb-4">
                <strong>8.2.</strong> {isSlovak
                  ? 'Je zakázané kopírovať, upravovať alebo inak používať Aplikáciu Choice alebo jej časť bez súhlasu Prevádzkovateľa.'
                  : 'It is prohibited to copy, modify or otherwise use the Choice Application or its part without the Operator\'s consent.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '9. ĎALŠIE PRÁVA A POVINNOSTI POUŽÍVATEĽA' : '9. OTHER RIGHTS AND OBLIGATIONS OF THE USER'}
              </h2>
              
              <p className="mb-4">
                <strong>9.1.</strong> {isSlovak
                  ? 'Používateľ je povinný používať Aplikáciu Choice v súlade s týmito Podmienkami, riadiť sa platnými právnymi predpismi, konať poctivo a v súlade s dobrými mravmi.'
                  : 'The User is obliged to use the Choice Application in accordance with these Terms, to comply with applicable legal regulations, to act honestly and in accordance with good morals.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '10. OCHRANA OSOBNÝCH ÚDAJOV' : '10. PERSONAL DATA PROTECTION'}
              </h2>
              
              <p className="mb-4">
                <strong>10.1.</strong> {isSlovak
                  ? 'Používatelia berú na vedomie, že Prevádzkovateľ spracúva nimi poskytnuté osobné údaje za účelom prevádzky Aplikácie Choice v súlade s právnymi predpismi týkajúcimi sa spracovania a ochrany osobných údajov a to najmä, nie však výlučne, nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 z 27. apríla 2016 o ochrane fyzických osôb v súvislosti so spracovaním osobných údajov a o voľnom pohybe týchto údajov a o zrušení smernice 95/46/ES (všeobecné nariadenie o ochrane údajov – GDPR) a zákonom č. 110/2019 Zb., o spracovaní osobných údajov, v platnom znení. Podrobnosti ohľadom spracovania osobných údajov Používateľov Prevádzkovateľom sú uvedené v príslušnej sekcii Aplikácie Choice týkajúcej sa ochrany osobných údajov.'
                  : 'Users acknowledge that the Operator processes their provided personal data for the purpose of operating the Choice Application in accordance with legal regulations regarding the processing and protection of personal data, in particular, but not exclusively, Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation – GDPR) and Act No. 110/2019 Coll., on the processing of personal data, as amended. Details regarding the processing of Users\' personal data by the Operator are set out in the relevant section of the Choice Application regarding personal data protection.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '11. SŤAŽNOSTI A OZNÁMENIA' : '11. COMPLAINTS AND NOTIFICATIONS'}
              </h2>
              
              <p className="mb-4">
                <strong>11.1.</strong> {isSlovak
                  ? 'Sťažnosti týkajúce sa služieb, vrátane oznámení o nezákonnej činnosti alebo nezákonnom obsahu, možno zasielať na nasledujúci e-mail: info@choiceqr.com.'
                  : 'Complaints regarding services, including notifications of illegal activity or illegal content, can be sent to the following email: info@choiceqr.com.'}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 mt-8">
                {isSlovak ? '12. ZÁVEREČNÉ USTANOVENIA' : '12. FINAL PROVISIONS'}
              </h2>
              
              <p className="mb-4">
                <strong>12.1.</strong> {isSlovak
                  ? 'Všetky dohody medzi Prevádzkovateľom, Partnerom a Používateľom sa riadia právnym poriadkom České republiky, ak to neodporuje kogentným ustanoveniam na ochranu spotrebiteľa. Ak je Používateľ spotrebiteľom a má obvyklé bydlisko v EÚ, požíva navyše ochrany poskytovanej záväznými ustanoveniami právnych predpisov krajiny svojho bydliska.'
                  : 'All agreements between the Operator, Partner and User are governed by the legal order of the Czech Republic, unless this contradicts mandatory provisions for consumer protection. If the User is a consumer and has a habitual residence in the EU, they additionally enjoy the protection provided by the mandatory provisions of the legal regulations of their country of residence.'}
              </p>

              <p className="mb-4">
                <strong>12.5.</strong> {isSlovak ? 'Kontaktné údaje Prevádzkovateľa:' : 'Operator contact details:'}
              </p>

              <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                <li>
                  {isSlovak
                    ? 'a) adresa pre doručovanie: Na příkopě 857/18, Nové Město, 110 00 Praha 1'
                    : 'a) delivery address: Na příkopě 857/18, Nové Město, 110 00 Praha 1'}
                </li>
                <li>
                  {isSlovak
                    ? 'b) e-mail: info@choiceqr.com'
                    : 'b) email: info@choiceqr.com'}
                </li>
                <li>
                  {isSlovak
                    ? 'c) telefón: +420 774 950 798'
                    : 'c) phone: +420 774 950 798'}
                </li>
              </ul>

              <p className="mb-4">
                <strong>12.11.</strong> {isSlovak
                  ? 'Tieto Podmienky nadobúdajú platnosť a účinnosť dňom 1.6.2025.'
                  : 'These Terms become valid and effective on June 1, 2025.'}
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

