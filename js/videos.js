// videos.js - Video-Logik für media.html
// YouTube Channel ID
const CHANNEL_ID = 'UCxjysqaDv62bNh5bwaHLIbQ';

// State
let allVideos = [];
let displayedVideos = 0;
const VIDEOS_PER_PAGE = 12;

// Eingebettete Video-Daten (gescraped von YouTube - wird regelmäßig aktualisiert)
// Letztes Update: 2025-12-08
// Gesamt: 149 Videos
const EMBEDDED_VIDEOS = [
    {"id": "k8ez_RptaA4", "title": "Warum du deine Möglichkeiten unterschätzt", "description": "Vielleicht kennst du das Gefühl, etwas sei „einfach unmöglich". Aber stimmt das wirklich?   Viele Menschen unterschätzen", "published": "2025-11-28", "category": "selbstfindung"},
    {"id": "_GPF4uYbV4U", "title": "Wenn die Nähe verloren geht: Liebe wieder mit allen Sinnen spüren", "description": "Wie nah seid ihr euch noch? https://coaching.kathrinstahl.com/paar-retreat-in-portugal-beziehung-krise-kathrin-stahl  In", "published": "2025-11-17", "category": "beziehung"},
    {"id": "1Dc0ECDQ5do", "title": "Wie toxische Positivität eure Beziehung zerstört", "description": "Good vibes only? Toxische Positivität kann Liebe verhindern. Wie die Liebe wieder zwischen euch fließen kann und warum N", "published": "2025-11-08", "category": "beziehung"},
    {"id": "Dv46eDGlODo", "title": "Wenn die Freude verloren geht: Nervensystem und Sinnlichkeit verstehen", "description": "Zurück in dein Leben mit allen Sinnen: https://coaching.kathrinstahl.com  Dein Nervensystem braucht keine Disziplin, son", "published": "2025-11-08", "category": "koerper"},
    {"id": "4gDLdVd_bOI", "title": "Innere Antreiber: Wenn das Leben nicht leicht sein darf", "description": "Wann haben wir eigentlich gelernt, dass das Leben anstrengend sein muss? Am virtuellen Lagerfeuer spreche ich darüber, w", "published": "2025-10-09", "category": "selbstfindung"},
    {"id": "EensGx5RqQE", "title": "Wie deine Ahnen deine Liebe beeinflussen – und wie du dich befreien kannst", "description": "Wusstest du, dass die Geschichte deiner Ahnen bis in deine Partnerschaft und Liebesbeziehungen hineinwirken kann?  https", "published": "2025-10-09", "category": "beziehung"},
    {"id": "-ZzwICQG0ck", "title": "Kleine Momente der Heilung: Wenn scheinbar nichts passiert und doch alles", "description": "Innerer Frieden kommt in unscheinbaren Momenten. Was das mit Beziehungsproblemen zu tun hat und mit deinem Nervensystem:", "published": "2025-10-09", "category": "koerper"},
    {"id": "L_k2GxBV9sA", "title": "Beziehungskrise: Was euer Unbehagen wirklich bedeutet", "description": "Beziehungskrise? Viele Paare erleben Unruhe und Unbehagen. In diesem Video erfährst du, warum das nicht das Ende sein mu", "published": "2025-09-09", "category": "beziehung"},
    {"id": "EtkuphquPlg", "title": "Türen zum wahren Selbst: Holotropes Atmen & Pferde.", "description": "Holotropes Atmen und pferdegeschützte Begleitung öffnen Türen zum wahren Selbst. Unser Retreat für dich im Oktober 2025:", "published": "2025-09-09", "category": "koerper"},
    {"id": "NGwaWYL5MVA", "title": "Warum wir unsere Wünsche klein machen und wie du deiner Sehnsucht folgen kannst", "description": "Ein ganz besonderes Retreat für deinen Herzenswunsch: https://coaching.kathrinstahl.com/herzenswunsch-folge-deiner-sehns", "published": "2025-09-09", "category": "selbstfindung"},
    {"id": "vFDDTwJVVIE", "title": "Feinfühligkeit und Hochsensibilität ohne Erschöpfung: So gelingt dir der innere Shift", "description": "Bis du hochsensibel, hochbegabt, hoch...?: hier erfährst du mehr: https://coaching.kathrinstahl.com/hochbegabung-hochsen", "published": "2025-09-09", "category": "hochsensibel"},
    {"id": "wbl61eO30O4", "title": "Die Welle surfen? Was dich trägt, wenn du denkst, du gehst unter", "description": "Was hilft, wenn du denkst, du gehst unter? Diese Folge ist für dich, wenn du in einer Umbruchphase steckst, dich überfor", "published": "2025-08-10", "category": "selbstfindung"},
    {"id": "EIZlnFXadEk", "title": "Lass los!? Nein! Dein Festhalten hat einen wichtigen Grund.", "description": "Loslassen.Ein Konzept, das in der Welt der Persönlichkeitsentwicklung eine große Rolle spielt.  Warum das gefährlich sei", "published": "2025-08-10", "category": "selbstfindung"},
    {"id": "6vU3KceRIaE", "title": "Warum Pausen so schwer sind: Was dich WIRKLICH davon abhält und was du jetzt brauchst.", "description": "Pausen machen – klingt leicht. Ist es aber nicht. Stimmt's?  Glaube mir: Ich kenne das.   In dieser Folge spreche ich üb", "published": "2025-08-10", "category": "koerper"},
    {"id": "3VUgqQLCq0o", "title": "Wie dein Körper leidet, wenn du dich immer zurückhältst", "description": "Unsere Körper und unsere Psyche haben eine tiefe Weisheit: Sie wissen genau, wie Lebenslust geht. Doch oft unterdrücken ", "published": "2025-08-10", "category": "koerper"},
    {"id": "YDkS4mPlTFk", "title": "Hochsensibel, hochbegabt, anders: Du sein, oder normal sein?", "description": "Fühlst du dich manchmal falsch? Was, wenn du einfach nur nicht einer falschen Norm entsprichst?  Wenn du hochsensibel bi", "published": "2025-07-11", "category": "hochsensibel"},
    {"id": "HtnsuVejtSU", "title": "Wer bist du, wenn du niemand sein musst?", "description": "neu anfangen, neue Wege beschreiten: Wer möchtest du sein, nach dieser Sinnkrise, nach diesem Umbruch in deinem Leben?  ", "published": "2025-07-11", "category": "selbstfindung"},
    {"id": "-IyA3x9O6CI", "title": "Angst vor Nähe. Was dein Körper dir sagen will", "description": "Nähe kann wunderschön sein. Und manchmal beängstigend.  Vielleicht kennst du das: Da ist ein Mensch, der es gut mit dir ", "published": "2025-07-11", "category": "beziehung"},
    {"id": "dOzBI79Ey_k", "title": "Stille ist so schwer zu finden. Aber es ist möglich.", "description": "Warum wir STILLE oft genau dann VERLIEREN, wenn wir denken, sie gefunden zu haben. In dieser Folge nehme ich dich mit in", "published": "2025-07-11", "category": "selbstfindung"},
    {"id": "bwb3idO08XM", "title": "Du bist erschöpft und…", "description": "Du bist erschöpft und vielleicht sogar einsam in deiner Beziehung. Du funktionierst. Aber ein Teil der n dir weiß: da is", "published": "2025-07-11", "category": "beziehung"},
    {"id": "jTPrBAC4GTs", "title": "Was dich durch schwere Zeiten trägt", "description": "Innere Leere. Das Gefühl, nicht weiterzukommen. Umbruch. Sinnkrise... Puh, ganz schön viel auf einmal alles in dieser ve", "published": "2025-07-11", "category": "selbstfindung"},
    {"id": "V52hvJg-f6g", "title": "Zeit für eure Liebe: Warum es uns so schwerfällt, Nähe zuzulassen", "description": "An diesem virtuellen Lagerfeuer gehen wir tief. Lass uns gemeinsam einer ganz zentralen Frage nachspüren: Wie viel Liebe", "published": "2025-05-12", "category": "beziehung"},
    {"id": "DxeeTdFtscI", "title": "Warum Selbstregulation nicht reicht: Du musst das nicht alleine schaffen.", "description": "Fühlst du dich manchmal nicht sicher in dir?   Woran kann das liegen? Ganz sicher nicht an dir. Sondern an etwas, das de", "published": "2025-05-12", "category": "selbstfindung"},
    {"id": "R2jyTIIvDQs", "title": "Welche Spuren hinterlassen wir? Finde heraus, was wirklich zählt.", "description": "Herzlich willkommen am virtuellen Lagerfeuer! Wie schön, dass du hier bist.  Hast du dich schon einmal gefragt, was vo", "published": "2025-04-12", "category": "selbstfindung"},
    {"id": "BXR04be8kpM", "title": "Umbruch und kein Land in Sicht – wenn dein innerer Kompass dich nicht mehr leitet", "description": "Umbruch und kein Land in Sicht – bist du noch auf deinem eigenen Weg?  Manchmal wird alles still. Und dann kommt die Fra", "published": "2025-03-13", "category": "selbstfindung"},
    {"id": "1_4WXOtqj4w", "title": "Abschied und Neuanfang: Ein kraftvoller Satz, der dich im Schmerz unterstützt. #neuanfang", "description": "Neunfang bedeutet immer auch Abschied.  Und so fühlt sich Aufbruch nicht nur nach Freiheit an, sondern häufig auch nach ", "published": "2025-03-13", "category": "selbstfindung"},
    {"id": "nufZK_gODBI", "title": "Das Leben hat einen Plan – du auch? #lebenverstehen", "description": "Das Leben verstehen wir oft erst rückblickend – warum das eine riesige Erleichterung sein kann!   Kennst du das Gefüh", "published": "2025-02-11", "category": "selbstfindung"},
    {"id": "Vj3cUy_n7GY", "title": "Essstörungen verstehen - eine Heldenreise: Leona über ihren Weg zur Heilung #neuanfang", "description": "Essstörung - ein Neuanfang. Leonas Heldinnenreise  Herzlich Willkommen am virtuellen Lagerfeuer.  In dieser Folge spre", "published": "2025-01-12", "category": "selbstfindung"},
    {"id": "pCrfd1GpGxQ", "title": "Bist du noch im richtigen Umfeld? Zwei junge Fische im Wasser....", "description": "In dieser Episode am virtuellen Lagerfeuer lade ich dich ein, mit mir darüber nachzudenken, welches UMFELD wir brauche, ", "published": "2025-01-12", "category": "selbstfindung"},
    {"id": "mhFBts57-F4", "title": "Darfst du oder willst du? Wie ein einziges Wort dich stärkt.", "description": "„Ich darf jetzt glücklich sein." Klingt schön. Oder?  Doch wer hat dir das erlaubt?  In dieser Folge erfährst du, wie sc", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "pZRjGDifQYY", "title": "Wie frei ist dein Mut wirklich? Über unbewusste Entscheidungen & transgenerationale Aufträge", "description": "Manchmal sind wir mutig – aber für wen eigentlich? In dieser Folge am virtuellen Lagerfeuer erkläre ich dir u.a., wie au", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "QlAlcNAE90U", "title": "Entscheide mutig: Was ich beim Auswandern gelernt habe #entscheidungentreffen #auswandern", "description": "Journaln für gute Entscheidungen: https://coaching.kathrinstahl.com/klarheit-und-cacao-journaln-fur-deinen-neubeginn  ", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "P9T5_cwvPP4", "title": "Wie Rituale dein Nervensystem regulieren und dir Schutz schenken", "description": "Diese Folge möchte dir gut tun. Wir tauchen in die Welt der Rituale ein – und erkunden, warum sie gerade in herausforder", "published": "2024-12-08", "category": "koerper"},
    {"id": "uTlC9aTMfMg", "title": "Getrieben im Alltag – Wie Erschöpfung entsteht", "description": "So viele Menschen sind gerade erschöpft. Wollen einfach nur alles hinschmeißen. Funktionieren irgendwie weiter – aber in", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "t4k-C3ffiJA", "title": "Liebe Andrea, lass uns über die Liebe sprechen. #andrealindau #liebe", "description": "INTEGRALES COACHING und AUFSTELLUNGEN MIT PFERDEN: In der Begleitung mit Pferden kommst du der Liebe in dir ganz nah. Wi", "published": "2024-12-08", "category": "beziehung"},
    {"id": "m-_CKpPid5Q", "title": "Die Kabala: Ein lange verheimlichtes \"Tool\" führt dich zu deinem erfüllten Leben #lebenssinn", "description": "Was ist dein tiefster LEBENSSINN? Das herauszufinden, ist ein langer Prozess. Doch es gibt Wege, dir dir dabei helfen kö", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "3Y88Xq1v9zU", "title": "Der Traum vom Auswandern: Der Mut, in der Mitte des Lebens etwas ganz Neues zu beginnen", "description": "Vom Aufgebenwollen zum Weitermachen! Du musst das nicht alleine schaffen. Als integrale Coach begleite ich dich beim Ums", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "y0yhAuCaAkc", "title": "Glück an der Schule: Freude entsteht im Spüren. #freude #schule #glück", "description": "Was gibt deinem Leben einen Sinn? Coaching für Kinder, Jugendliche und ihre Eltern.https://coaching.kathrinstahl.com   K", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "hQJvAFcMlhg", "title": "Warum du aufhören solltest, Bedürfnisse zu erfüllen.", "description": "Hier geht es heute um die Liebe. Und auch um Nähe und Distanz und um Bedürfnisse: Am virtuellen Lagerfeuer nehme ich dic", "published": "2024-12-08", "category": "beziehung"},
    {"id": "vzcKp-8Ji_k", "title": "Bist du hochsensibel? Warum es wichtig ist, das zu wissen!", "description": "HOL DIR DEIN GESCHENK: Finde heraus, was Hochsensibilität bedeutet und wie sie dein Leben und das deiner Mitmenschen bee", "published": "2024-12-08", "category": "hochsensibel"},
    {"id": "5EzKY2uqVXg", "title": "Ist finanzielle Fülle wichtig und können wir sie manifestieren? #geldmanifestieren #finanzen", "description": "Heile deine Geldwunde in einer einfühlsamen Aufstellung. 1:1 oder in der Gruppe. https://coaching.kathrinstahl.com/syste", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "QXgiy_HXRIw", "title": "Dein Nervensystem will nicht ständig reguliert werden.", "description": "Werde die beste Freundin, der beste Freund deines Nervensystems:https://coaching.kathrinstahl.com  Der Vagusnerv ist ger", "published": "2024-12-08", "category": "koerper"},
    {"id": "I3H6qqAmZaY", "title": "In liebevoller Beziehung mit deinem Nervensystem – warum das jetzt wichtig ist", "description": "Was passiert, wenn wir unser Nervensystem erst dann verstehen wollen, wenn wir schon mitten in der Krise stecken?  In di", "published": "2024-12-08", "category": "koerper"},
    {"id": "u3WC1lVQDkk", "title": "Wen versuchst du verzweifelt zu retten? oder: Die psychologische Sprache deines Herzens. #herz", "description": "Wende dich deinem Herzen zu in einem tiefgreifenden Coaching:https://coaching.kathrinstahl.com Am heutigen Lagerfeuer ge", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "FZOxYwr_Ccs", "title": "\"Ich bin besonders.\" Fällt es dir auch so schwer, das zu sagen? #selbstbewusstsein #talent", "description": "Wer bist du, wenn du niemand sein musst? https://coaching.kathrinstahl.com  Lebe deine GABEN! Trage dich in die Welt! We", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "8biBHD0bxKA", "title": "Wie gehen wir durch die Welt? Über Freundlichkeit, Aggression und Werte. #werte #freundlichkeit", "description": "Wer bist du, wenn du niemand sein musst?https://coaching.kathrinstahl.com  In der heutigen Folge geht es um einen Stinke", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "fYj97ttp9jo", "title": "Umgeschulte Linkshändigkeit: häufig unentdeckt mit schlimmen Folgen", "description": "Einfühlsame Begleitung für hochbegabte, hochsensible Menschen:https://coaching.kathrinstahl.com/hochbegabung-hochsensibi", "published": "2024-12-08", "category": "hochsensibel"},
    {"id": "JoABkq4fRXM", "title": "... und was hat das mit dir zu tun? Eine Folge nicht nur für Eltern.", "description": "Wut ist Lebenskraft. Heile deine Emotionen in einem tiefgreifenden, achtsamenCoaching:https://coaching.kathrinstahl.com ", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "caVgmAjxgRE", "title": "Warum uns nicht gelebte Träume krank machen. #lebenssinn #sehnsucht", "description": "Deine Sehnsucht führt dich zum Sinn deines Lebens.  Hier erfährst du mehr:https://coaching.kathrinstahl.com/gib-deinem-l", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "d91dHkyZ0SA", "title": "Über den achtsamen Umgang mit unseren Herausforderungen", "description": "Wende dich dir zu und begegne deinen Problemen neu: https://coaching.kathrinstahl.com  Am heutigen Lagerfeuer möchte ich", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "yyfT2ogPbk0", "title": "Endlich mehr Fülle in deinem Leben? Wie die Geschichte deiner Ahnen sie verhindert.", "description": "Termine nächste SYSTEMISCHE AUFSTELLUNGEN https://coaching.kathrinstahl.com/systemische-aufstellungen  Am heutigen Lager", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "_MgqJu3mpOA", "title": "Die Macht unserer Projektionen und das Erbe unserer Ahnen.#prosecconazis #transgenerationalestrauma", "description": "nächste SYSTEMISCHE AUFSTELLUNG 04.11.24  in Hamburg. https://coaching.kathrinstahl.com/systemische-aufstellungen  Am ", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "dArsoAbD6bw", "title": "Hochbegabung - ein Lebensgefühl. #hochbegabt #hochsensibel", "description": "HOCHBEGABUNG, HOCHSENSIBILITÄT, HOCHSENSITVITÄT.. Diese Worte schwirren gerade durch die sozialen Medien. Was ist das ei", "published": "2024-12-08", "category": "hochsensibel"},
    {"id": "NjKaYD5YIl0", "title": "Wessen Rucksack trägst du? Wessen Leben lebst du? #erschöpfung #ahnenarbeit", "description": "SYSTEMISCHE AUFSTELLUNGEN IN HEIDELBERG UND HAMBURG: https://coaching.kathrinstahl.com/systemische-aufstellungen  Herz", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "T4qJ5UGgmo4", "title": "Wie du deine Wechseljahre für dich nutzen kannst. #wechseljahre #menopause", "description": "WECHSELJAHRE LASSEN FRAUEN LEUCHTEN (?) Hast du davon auch schon gehört und wartest du auch noch auf den Glow? Dann se", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "kf6uNhMppuY", "title": "Gewaltfreie Kommunikation?! Warum das nicht reicht.", "description": "GEWALTFREIHEIT BEGINNT BEI UNSEREN GEDANKEN. Wir bemühen uns um gewaltfreie Kommunikation. Gewalt fängt aber schon viel ", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "8_U5nFcBIpo", "title": "Viel-Denken kann ein Schutzmechanismus sein. Warum der nicht hilft, erfährst du hier.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz f", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "7m0_jVuI88k", "title": "Bewusstes Atmen heilt dich auf allen Ebenen: Im Gespräch mit Atemexperte Timo Niessner", "description": "BEWUSSTES ATMEN IST HEILUNG AUF ALLEN EBENEN.  Die Art und Weise, in der wir atmen, hat Auswirkungen auf unseren mentale", "published": "2024-12-08", "category": "koerper"},
    {"id": "OGHneUPrvz0", "title": "\"Was brauche ich gerade? Ich weiß es nicht mehr.\" Über Selbstfürsorge in  Extremsituationen.", "description": "EINZELRETREAT IM KREIS DER PFERDE IN SÜDFRANKREICH - nur noch im April und Mai 2024 möglich. Schreibe mir, wenn du mehr ", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "AX7e70Yr3O4", "title": "Wertung und Erwartung macht Kinder krank: Pferde heilen, was das Schulsystem kaputt gemacht hat.", "description": "EINZELRETREAT IM KREIS DER PFERDE IN SÜDFRANKREICH - nur noch im September 2024 möglich. Schreibe mir, wenn du mehr wiss", "published": "2024-12-08", "category": "koerper"},
    {"id": "LajMXQjtfuE", "title": "Dich um dich zu kümmern, ist das beste, was du für deine Kinder tun kannst.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz f", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "qtakfLwk-5w", "title": "Einfach mal Loslassen ist nicht so einfach!", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz f", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "0587EHVITBo", "title": "Auswandern wirft uns auf uns zurück: Wer bist du, wenn du niemand sein musst?", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz f", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "kwSqP5UZPtw", "title": "Yoga geht auch an der Supermarktkasse weiter.", "description": "ONLINE KAKAOZEREMONIE am 06.05.24 https://coaching.kathrinstahl.com/innerer-frieden-und-cacao-online-kakaozeremonie. Ich", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "HK9QtRhPnck", "title": "Verspannungen? Symptome? Dein Körper zeigt dir, wo du frei bist und wo  nicht.", "description": "AUFSTELLUNGSTAG IN HAMBURG AM 09.03.2024 - Begegne deinem Symptom und beschreite neue Wege Infos: https://coaching.kathr", "published": "2024-12-08", "category": "koerper"},
    {"id": "kYCDnq9w8Qk", "title": "Körperliche Symptome haben psychische Ursachen.", "description": "AUFSTELLUNGSTAG IN HAMBURG AM 09.03.2024 - Begegne deinem Symptom und beschreite neue Wege Infos: https://coaching.kathr", "published": "2024-12-08", "category": "koerper"},
    {"id": "M09XxJaV_yA", "title": "Müde und erschöpft? Was, wenn etwas anderes dahinter steckt, als du denkst?", "description": "AUFSTELLUNGSTAG IN HAMBURG AM 09.03.2024 - Begegne deiner Erschöpfung achtsam Infos: https://coaching.kathrinstahl.com/s", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "MjmN-beBzkk", "title": "Staunen. Die vergessene Superpower für ein erfülltes Leben.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "9-JAu2j0d5M", "title": "Wie unterdrückte Impulse Meditation verhindern und was dir helfen kann.", "description": "AUFSTELLUNGSTAG IN HAMBURG AM 09.03.2024 - Begegne dir neu Infos: https://coaching.kathrinstahl.com/systemische-aufstell", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "bWvfww3rRfU", "title": "Von Vorurteilen und Schubladen: Sieh den Menschen vor dir als Menschen.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "zl3p8SIwG_8", "title": "Deine Wut ist ein Geschenk. Teile sie achtsam.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "1DTLRBc3sfs", "title": "Wie geht Traumleben - und was hat das mit gesunder Aggression zu tun?", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "rV_8Cxv74Bs", "title": "Wozu soll Selbstliebe gut sein?", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "XoO9ZTL21dI", "title": "Gelassen in die Weihnachtsfeiertage", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2024-12-08", "category": "selbstfindung"},
    {"id": "EI0EaWpOXqg", "title": "Wie kann ein Leben in der Fremde gelingen? Und was bedeutet eigentlich  \"Heilung mit Tieren\"?", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "DD0iCzWagdM", "title": "Wie sich dein Leben verändert, wenn du dem Ruf deiner Seele folgst. Über eine außergewöhnliche Reise", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "dLwVjuaVOe0", "title": "\"Wenn es nicht leicht geht, ist es nicht für dich bestimmt.\" Wie dieser Satz uns lähmt.", "description": "Herzlich Willkommen am Lagerfeuer. Heute geht es darum, wie eine hartnäckige Überzeugung aus der 'Manifestationswelt'  u", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "Vw8b4i_JPSw", "title": "Ein Geschenk für dich: Innerer Frieden.", "description": "WIE GEHT INNERER FRIEDEN?  Ein reicher, achtsamer Abend.  Ein GESCHENK von mir für dich. *23.11.23 18 Uhr 30 – 19 Uhr 45", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "nTGwRUzQi1I", "title": "Wie unsere inneren Bilder verhindern, dass wir unseren Traum leben.", "description": "Freier Online Abend: INNERER FRIEDEN: Ganz bei dir sein. Stille in dir. Dich sicher fühlen und verbunden, mit den Mens", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "wYx-m3pUhgY", "title": "Deine Psyche braucht auch mal eine Pause.", "description": "Du möchtest etwas für deinen inneren Frieden tun? Hör auf zu TUN.   Herzlich Willkommen am Lagerfeuer. In dieser Solofol", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "3RsDRAzitnE", "title": "Was bedeutet es wirklich, sich fürs Leben zu entscheiden?", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "zJErlh7UTKI", "title": "Was Kriegsbilder in deinem Nervensystem auslösen und wie du dich jetzt schützen kannst.", "description": "INNERER FRIEDEN: Ganz bei dir sein. Stille in dir. Dich sicher fühlen.. .haaaaa… Und von diesem Ort aus Liebe in die Wel", "published": "2023-12-09", "category": "koerper"},
    {"id": "kVUgcGKXlMY", "title": "Fall aus dem Rahmen. Über die Kunst ein kreatives Leben zu führen.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "FF64khJYhGM", "title": "\"Glaube nicht alles, was du denkst.\"", "description": "SINNerfüllt - GIB DEINEM LEBEN DEINEN SINN  Deine online Heldinnenreise zum Sinn deines Lebens  - weitere Infos fin", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "iYW764rrqeE", "title": "\"Geliebter Traum, ich verlasse dich nie mehr.\" Wie du dich mit deinem Traum verbündest.", "description": "Trägst du einen Traum in dir, der schon viel zu lange auf dich wartet?  Am heutigen Lagerfeuer spreche ich darüber, wie ", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "pgWOwnCrq0o", "title": "Weitergehen oder zurück ins Vertraute?", "description": "Wenn du dir diese Frage stellst, befindest du dich vielleicht gerade in einer Zerreißprobe. Damit bist du nicht allein.", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "Z1VZcQ9bTjQ", "title": "Konfetti im Kopf. Über das Er-Leben von Demenz. Achtsame Fotoprojekte machen Herzen weiter.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "V7-mi4TZP_k", "title": "Wie du den ersten Schritt für deine Vision gehst. Mit kraftvoller Übung.", "description": "SINNerfüllt: Gib deinem Leben DEINEN Sinn: https://coaching.kathrinstahl.com/gib-deinem-leben-deinen-sinn-eine-heldinnen", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "VvbCMtrRFb0", "title": "Wenn du denkst, Beziehung muss immer harmonisch sein, hast du schon verloren.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses wärmende Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für ", "published": "2023-12-09", "category": "beziehung"},
    {"id": "K95C8Nluef0", "title": "Die Suche nach dem Sinn des Lebens ist eine unserer wichtigsten Heldenreisen.", "description": "Endlich wieder da: SINNerfüllt: Gib deinem Leben DEINEN Sinn. https://coaching.kathrinstahl.com/gib-deinem-leben-deinen-", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "MHEWnSBcmnY", "title": "Hochbegabt? Na und? Ein Gespräch mit meiner Tochter darüber, wie es ist, aus dem Rahmen zu fallen.", "description": "Eine einfühlsame Begleitung für hochbegabte Kinder und ihre Familie: Hochbegabung - den bunten Weg selbstbewusst beschre", "published": "2023-12-09", "category": "hochsensibel"},
    {"id": "HFQe9vYkiQs", "title": "Wie unterstützen wir hochbegabte Kinder in ihrem einzigartigen Sein?", "description": "Unsere einfühlsame Begleitung für hochbegabte Kinder und ihre Familie: Hochbegabung - den bunten Weg selbstbewusst besch", "published": "2023-12-09", "category": "hochsensibel"},
    {"id": "V-EQeEeqNew", "title": "Heilung braucht Verbindung: Über Sinnlichkeit, Intuition und innere Führung", "description": "Tiefe Heilung geschieht in Kontakt und Verbindung. Die heutige Folge möchte dich daran erinnern, dass du deinen Weg nich", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "X7yHY9dzyek", "title": "Brauchst du wirklich eine Morgenroutine? Wo fängt Selbstliebe an und wo hört sie auf?", "description": "Raum für dich, für deine INNERE FÜHRUNG, für die Weisheit in dir - ein ganz besonderes, tiefes RETREAT im Schutz der Pfe", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "-YB4Fz8Bhrc", "title": "Deine Emotionen sind dein Weg in deine innere Freiheit.", "description": "Raum für dich, für deine INNERE FÜHRUNG, für die Weisheit in dir - ein ganz besonderes, tiefes RETREAT im Schutz der Pfe", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "8o2-5dHd97g", "title": "Perfektionismus und Vagusnerv: Wie du Perfektionismus durch ein reguliertes Nervensystem heilst.", "description": "Raum für dich, für deine INNERE FÜHRUNG, für die Weisheit in dir - ein ganz besonderes, tiefes RETREAT im Schutz der Pfe", "published": "2023-12-09", "category": "koerper"},
    {"id": "vFx1xUmkU-A", "title": "Deine Intuition spricht die ganze Zeit mit dir. Möchtest du sie wieder hören?", "description": "INNERE FÜHRUNG - Vertraue deiner INTUITION.  Ein ganz besonderes RETREAT im wertungsfreien, schützenden Kreis einer Herd", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "1k8JydmpVcU", "title": "Endlich frei fühlen: Heile deine Wurzeln und lebe den kühnsten Traum deiner Vorfahren.", "description": "Herzlich Willkommen bei Glück über Zweifel.  Dieses wärmende Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "6UOGjRqc1Es", "title": "Nie wieder so tun, als ob... Wie du authentisch lebst und anderen ein Vorbild bist.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses wärmende Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für ", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "PBlfxzyuvIU", "title": "Nie wieder selbstlieblos: Freunde dich mit deinem inneren Kritiker an und finde Freiheit.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses wärmende Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für ", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "tY9dK0ugsqk", "title": "Pubertät: Was dein Kind jetzt von dir braucht. Und wie du gut für dich selbst sorgen kannst.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses wärmende Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für ", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "TFmv1m7FxJw", "title": "Inneren Frieden finden: Sehnst du dich auch so sehr danach?", "description": "Im Rahmen des Sehnsucht Frieden Kongresses von Esther Seer durfte ich über die liebevolle Kraft pferdegestützten Coachin", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "BwdhB_65iZg", "title": "Mama werden und psychische Gesundheit - Was dir niemand erzählt. Am Lagerfeuer mit einer Doula", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses wärmende Lagerfeuer möchte dir ein Kraftort sein, ein Landeplatz für ", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "X-bohtm8RJc", "title": "Ent-Rollen: Wie du die Regie für dein Leben übernimmst", "description": "Ent-Rollen: Ein inspirierender, reicher Online-Abend auf Zoom.  21.04.2023 – 18 Uhr 30 bis ca 20 Uhr Ein Geschenk von mi", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "t5rL4cgMPq0", "title": "Wie du liebevoll Verantwortung für dein Leben übernimmst - Teil II.  René Träder von 7Mind", "description": "TEIL II DES GESPRÄCHES MIT RENÉ - Teil I findest du hier: https://www.youtube.com/watch?v=kJcEcKHglDo&t=4s  Herzlich Wil", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "yRiRooIJz9c", "title": "Steffen Lohrer: In dir gibt es einen unendlichen Raum der Stille. Innerer Frieden am Lagerfeuer.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses wärmende virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Lande", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "u6x40o0xqu4", "title": "Was du brauchst, um dich sicher in dir fühlen zu können: Die Kraft deines Nervensystems.", "description": "Innere Sicherheit und innere Führung - und dein Nervensystem Am virtuellen Lagerfeuer spreche ich mit Lena Scheuffler da", "published": "2023-12-09", "category": "koerper"},
    {"id": "IyM53pnYudM", "title": "Innere Führung - Erfahre, wie du dich mit deiner Intuition verbindest.", "description": "Innere Führung - eine sanft-mutige Reise Die heutige Folge möchte dir Inspiration und Einladung in deine innere Führung ", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "DfHuT5ZVR_c", "title": "Wie gelingt echte Verbindung? Über Herzmauern, Grenzen und Nichtswollen.", "description": "Herzlich Willkommen bei Glück über Zweifel. Dieses wärmende virtuelle Lagerfeuer möchte dir ein Kraftort sein, ein Lande", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "kJcEcKHglDo", "title": "Wie du liebevoll Verantwortung für dein Leben übernimmst - Teil I.  René Träder von 7Mind", "description": "TEIL I DES GESPRÄCHES MIT RENÉ - Teil II findest du hier:  https://studio.youtube.com/video/t5rL4cgMPq0  Herzlich Willko", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "IVRZ-syZQzM", "title": "Freiheit in dir - Du bist nicht deine Gedanken. Wie du deine Muster erkennst und liebevoll änderst.", "description": "Herzlich Willkommen bei Glück über Zweifel. An diesem Lagerfeuer erwarten dich Gespräche, die dein Leben reicher machen ", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "LluxPv5zcU8", "title": "Herzlich Willkommen am Lagerfeuer. Setz dich zu uns und lass dich inspirieren.", "description": "Herzlich Willkommen bei Glück über Zweifel. Wie schön, dass du hier bist. WIE KANN EIN LEBEN GELINGEN, DAS SICH FÜR UNS ", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "tG_7UPDag20", "title": "Die Krähe. Oder: wie wir Ziele erreichen.", "description": "Herzlich Willkommen bei Glück über Zweifel. An diesem Lagerfeuer erwarten dich Gespräche, die dein Leben reicher machen ", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "JBU2uDWb6DM", "title": "\"Unsere Tiere sind unser Spiegel.\" Ein Gespräch über Liebe und Heilung.", "description": "Herzlich Willkommen bei Glück über Zweifel. An diesem virtuellen Lagerfeuer erwarten dich Gespräche zu Themen, die dein ", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "F4gwDiNPgTI", "title": "Über Lebendigkeit, Sinnsuche und wie dir ein Wort dabei hilft", "description": "Herzlich Willkommen bei Glück über Zweifel. An diesem Lagerfeuer erwarten dich Gespräche zu Themen, die dein Leben reich", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "VNYOPSTXa2U", "title": "VEIT LINDAU: \"Du stirbst. Beginne zu leben.\" Ein tiefes Gespräch über ein erfülltes Leben.", "description": "Begib dich auf deine Heldinnenreise zum Sinn deines Lebens. Am 09.002.23 startet wieder meine Online-Heldinnenreise „SIN", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "FYDuymsUAaM", "title": "Glaubenssätze heilen mit dem Inneren Kind. #Glaubenssatzarbeit", "description": "Heile deine Glaubenssätze tiefgreifend: https://coaching.kathrinstahl.com Herzlich Willkommen bei Glück über Zweifel. An", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "WOW7pH-i_WE", "title": "Mit Pferden heilen: Im Trauma liegt auch Schöpferkraft. Am Lagerfeuer mit Ines Kaiser.", "description": "Herzlich Willkommen bei Glück über Zweifel. An diesem virtuellen Lagerfeuer erwarten dich Gespräche zu Themen, die dein ", "published": "2023-12-09", "category": "koerper"},
    {"id": "0POqquOuAAo", "title": "Worum geht es 2023 wirklich? Und wie gelingt ein sinnerfülltes Leben?", "description": "Herzlich Willkommen am Lagerfeuer der Heldinnen und Helden.  Heute erwartet dich wieder mal eine Solofolge, in der ich d", "published": "2023-12-09", "category": "selbstfindung"},
    {"id": "va2aFLnEN24", "title": "Beziehung statt Erziehung: Es gibt keine schwierigen Kinder. Am Lagerfeuer m. Sandra v. Ehrenstein.", "description": "Herzlich Willkommen bei Glück über Zweifel. An diesem virtuellen Lagerfeuer   erwarten dich Gespräche zu unterschiedlich", "published": "2023-12-09", "category": "beziehung"},
    {"id": "wwJsh4pHE1E", "title": "Wenn wir aufhören, etwas leisten zu wollen, wird es still. Über Orte der Heilung mit Juuna Kastrup.", "description": "Herzlich Willkommen bei Glück über Zweifel, deinem virtuellen Lagerfeuer der Inspirationen für dein inneres Wachstum, de", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "iryvWvAIwe0", "title": "Herzmeditation am Lagerfeuer. Eine sanfte Reise in dein Innerstes.", "description": "Herzlich Willkommen bei Glück über Zweifel, deinem Lagerfeuer für Inspiration, ein bewusstes Leben, Spiritualität und vi", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "p31GAqzxXkM", "title": "Das Geschenk der Meridiane: Dein Weg darf genussvoll sein.", "description": "Herzlich Willkommen am Lagerfeuer mit An Aibja, Botschafterin der Meridiane' Mein Name ist Kathrin Stahl. Als zertifizie", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "8ESVcHJNJWE", "title": "Wenn Glaubenssätze Leben klein machen. Befreie dich von der Macht unerkannter Überzeugungen.", "description": "Unbekannte Überzeugungen treiben ihr Unwesen in uns... Welches sind deine?  Heute sitze ich alleine am Lagerfeuer - bzw.", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "cb8dRSEbIWY", "title": "Gib dir die Erlaubnis, deinen Platz auf der Welt einzunehmen. Über Weiblichkeit, Berufung, Energie.", "description": "Herzlich Willkommen bei Glück über Zweifel, deinem virtuellen Lagerfeuer der Inspirationen für dein inneres Wachstum, de", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "HlHqZuRRW1g", "title": "Gib die Verantwortung für deine Schilddrüse nicht an der Praxistür ab.", "description": "Herzlich Willkommen bei Glück über Zweifel, deinem virtuellen Lagerfeuer der Inspirationen für dein inneres Wachstum, de", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "09sx0kfGqRA", "title": "Dein wildes Herz braucht dich jetzt. Am Lagerfeuer mit Karen Sailer", "description": "Herzlich Willkommen bei Glück über Zweifel, deinem virtuellen Lagerfeuer der Inspirationen. Für dein inneres Wachstum, d", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "tjkyyxNQIoM", "title": "Dein inneres Kind braucht das Gefühl: „Jetzt ist endlich jemand da.\" Am Lagerfeuer mit Susanne Hühn.", "description": "Mit uns am Lagerfeuer sitzt heute eine ganz besondere Frau: Susanne Hühn.  Als Physiotherapeutin interessierte Susanne s", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "EOGJW2ISj9s", "title": "Wie wir Freude verhindern. Und wie wir sie wieder in unser Leben einladen. Mit Minimeditation.", "description": "Herzlich Willkommen bei Glück über Zweifel. Heute geht es um nichts weniger als die Freude.  So viele von uns sehnen sic", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "vDt0M6QC1v4", "title": "Deine Stimme streichelt deine Seele. Wie unsere Stimme uns mit unserer tiefen Wahrheit verbindet.", "description": "Herzlich Willkommen bei Glück über Zweifel. Mein Name ist Kathrin Stahl. Als zertifizierte, integrale Coach begleite ich", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "ZRjbohXrAZw", "title": "Was passiert, wenn du endlich ganz sein darfst, Mann.", "description": "'Mitten im Winter habe ich erfahren, dass es in mir einen unbesiegbaren Sommer gibt.' - Camus -   In unserem heutigen ti", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "k0VFrtKwNKU", "title": "Trading ist spirituelle Persönlichkeitsentwicklung", "description": "Herzlich Willkommen bei Glück über Zweifel. Mein Name ist Kathrin Stahl. Als zertifizierte, integrale Coach begleite ich", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "WfMNUjegySk", "title": "\"Über Depressionen und Suizid muss gesprochen werden.\" Diana Doko von Freunde fürs Leben e.V.", "description": "Herzlich Willkommen bei Glück über Zweifel. Mein Name ist Kathrin Stahl. Als zertifizierte, integrale Coach begleite ich", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "PogH1FHiyZw", "title": "Wie du endlich den Sinn deines Lebens findest", "description": "Du wundervoll Mensch, es ist schön, dass du mit uns am Lagerfeuer sitzt.  Heute geht es um DIE Frage aller Fragen: Wozu ", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "y8ZQhtTDrwg", "title": "Gedanken über Schönheit, Leuchten und Selbstliebe. Mit Meditation.", "description": "Wann fühlst du dich schön? Und was bringt dich zum Leuchten?  Dieses Video ist eine Einladung zur Selbstliebe.  Am Ende ", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "wNqTVzOj98c", "title": "Deine Seele weiß, wo's lang geht. Am Lagerfeuer mit der Künstlerin Clara Morgenthau.", "description": "Herzlich Willkommen bei Glück über Zweifel. Mein Name ist Kathrin Stahl. Als zertifizierte, integrale Coach begleite ich", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "HHzB9zdMLcg", "title": "Leben als Regenbogenfamilie: Familie ist, wo Liebe ist. Kevin Silvergieter von Papapi.", "description": "An unserem Lagerfeuer sitzt heute Kevin Silvergieter.  Kevin ist Schauspieler. Und er ist Papi in einer Regenbogenfamili", "published": "2022-12-09", "category": "beziehung"},
    {"id": "0_IKC7sTDYI", "title": "Ändere deine Fragen und du änderst dein Leben", "description": "Wusstest du, dass du dir den ganzen Tag lang (unbewusst) Fragen stellst? Häufig beginnen diese Fragen mit einem 'Warum' ", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "SkB2fyRhiF8", "title": "Wenn wir unsere Liebeskraft leben, ordnet sich alles neu. Lagerfeuer m. der Visionärin Juuna Kastrup", "description": "Herzlich Willkommen bei Glück über Zweifel. Mein Name ist Kathrin Stahl. Als zertifizierte, integrale Coach begleite ich", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "yL83MzazA9I", "title": "\"Liebe und Dankbarkeit trugen mich durch die Schicksalsschläge unserer Familie.\"", "description": "Heute sitzt an unserem Lagerfeuer meine längste Freundin.  Karin und ich haben uns in der 5. Klasse kennengelernt und be", "published": "2022-12-09", "category": "beziehung"},
    {"id": "UpJFamPo6nQ", "title": "Instrumentalisieren wir unsere Dankbarkeit?", "description": "Heute erwartet dich an unserem Lagerfeuer eine Solofolge, in der ich über DANKBARKEIT spreche und darüber, wie sie unser", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "NA7cTMvICuo", "title": "Bea Knecht - Wenn du etwas willst, musst du es sagen.", "description": "Herzlich Willkommen bei Glück über Zweifel. Mein Name ist Kathrin Stahl. Als zertifizierte, integrale Coach begleite ich", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "3oQYvr1x7iI", "title": "Gesund gevögelt - Guter Sex braucht Neugier.", "description": "Let's talk about sex.  Heute sitzt bei uns am Lagerfeuer Susanne Wendel. Freue dich auf ein inspirierendes und erfüllend", "published": "2022-12-09", "category": "beziehung"},
    {"id": "vAXSDph6t2w", "title": "Selbstständigkeit als Mutter - Vom Kreißsaal zurück ins Büro?", "description": "Herzlich Willkommen bei Glück über Zweifel. Setz dich zu uns ans Lagerfeuer und lass dich inspirieren von den HeldInnenr", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "a5dgy1dnevY", "title": "Wenn das Universum dir eine Chance schenkt, greif zu.", "description": "Herzlich Willkommen bei Glück über Zweifel. Mein Name ist Kathrin Stahl. Als zertifizierte, integrale Coach begleite ich", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "E_0Mf61YQSI", "title": "Andrea Lindau - Grabe nach Leben. Jeden Tag.", "description": "Herzlich Willkommen bei Glück über Zweifel. Mein Name ist Kathrin Stahl. Als zertifizierte, integrale Coach begleite ich", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "CntbMdBgv9M", "title": "\"Diesen Stolz auf mich kann ich kaum aushalten.\" Ein Gespräch über inneres Wachstum und Selbstliebe.", "description": "Herzlich Willkommen am Lagerfeuer, du Heldin, du Held.  Mein Name ist Kathrin Stahl. Als zertifizierte, integrale Coach ", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "VIAMF1SuCfo", "title": "Du musst das nicht alleine schaffen: Hol dir Hilfe, wenn du an deine Grenzen kommst.", "description": "Herzlich Willkommen bei Glück über Zweifel, dem Lagerfeuer der Heldinnen und Helden des Lebens. Wie du und ich. Wenn du ", "published": "2022-12-09", "category": "selbstfindung"},
    {"id": "V9n0QokD3P0", "title": "Mein Rat an mein jüngeres Ich: Glaube dir!", "description": "Herzlich Willkommen bei Glück über Zweifel. Setz dich zu uns ans Lagerfeuer. Lass dich inspirieren von Geschichten aus d", "published": "2022-12-09", "category": "selbstfindung"}
];

// Videos laden - kombiniert eingebettete Daten mit RSS für Updates
async function loadYouTubeVideos() {
    const grid = document.getElementById('videoGrid');

    try {
        // Zuerst eingebettete Videos verwenden
        allVideos = EMBEDDED_VIDEOS.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description,
            publishedAt: new Date(video.published),
            category: video.category || 'selbstfindung'
        }));

        // Versuche RSS für neueste Videos zu laden (könnte neuere haben)
        try {
            const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();

            if (data.status === 'ok' && data.items) {
                // Neue Videos hinzufügen, die nicht in EMBEDDED_VIDEOS sind
                const existingIds = new Set(EMBEDDED_VIDEOS.map(v => v.id));
                const newVideos = data.items
                    .filter(item => {
                        const videoId = item.link.split('v=')[1] || item.guid.split(':').pop();
                        return !existingIds.has(videoId);
                    })
                    .map(item => {
                        const videoId = item.link.split('v=')[1] || item.guid.split(':').pop();
                        return {
                            id: videoId,
                            title: item.title,
                            description: item.description || '',
                            publishedAt: new Date(item.pubDate),
                            category: 'selbstfindung' // Default für neue Videos
                        };
                    });

                // Neue Videos an den Anfang
                allVideos = [...newVideos, ...allVideos];
            }
        } catch (rssError) {
            console.log('RSS nicht verfügbar, nutze eingebettete Daten');
        }

        // Nach Datum sortieren (neueste zuerst)
        allVideos.sort((a, b) => b.publishedAt - a.publishedAt);

        // Statistiken aktualisieren
        document.getElementById('totalVideos').textContent = `${allVideos.length} Videos`;
        document.getElementById('updateTime').textContent = `Aktualisiert: ${new Date().toLocaleDateString('de-DE')}`;

        // Videos anzeigen
        displayedVideos = 0;
        renderVideos();

        // Load More Button anzeigen wenn mehr Videos vorhanden
        if (allVideos.length > VIDEOS_PER_PAGE) {
            document.getElementById('loadMore').style.display = 'flex';
        }
    } catch (error) {
        console.error('Fehler beim Laden der Videos:', error);
        showFallbackVideos();
    }
}

// Videos rendern
function renderVideos(filter = 'all') {
    const grid = document.getElementById('videoGrid');
    const videosToShow = filter === 'all'
        ? allVideos
        : allVideos.filter(v => v.category === filter);

    const endIndex = Math.min(displayedVideos + VIDEOS_PER_PAGE, videosToShow.length);
    const newVideos = videosToShow.slice(0, endIndex);

    // mqdefault.jpg = 320x180 (schneller), hqdefault.jpg = 480x360 (Fallback)
    grid.innerHTML = newVideos.map((video, index) => `
        <div class="video-card" data-category="${video.category}">
            <div class="video-thumbnail" onclick="openVideo('${video.id}')">
                <img src="https://i.ytimg.com/vi/${video.id}/mqdefault.jpg"
                     alt="${escapeHtml(video.title)}"
                     loading="${index < 6 ? 'eager' : 'lazy'}"
                     decoding="async"
                     onerror="this.src='https://i.ytimg.com/vi/${video.id}/hqdefault.jpg'">
                <div class="play-btn">
                    <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
            </div>
            <div class="video-info">
                <span class="video-category">${getCategoryLabel(video.category)}</span>
                <h3>${escapeHtml(video.title)}</h3>
                <p>${escapeHtml(video.description.substring(0, 150))}${video.description.length > 150 ? '...' : ''}</p>
                <div class="video-meta">
                    <span>${formatDate(video.publishedAt)}</span>
                </div>
            </div>
        </div>
    `).join('');

    displayedVideos = endIndex;

    // Load More Button verstecken wenn alle Videos angezeigt
    const loadMoreBtn = document.getElementById('loadMore');
    if (displayedVideos >= videosToShow.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'flex';
    }
}

// Fallback: Statische Videos wenn API nicht erreichbar
function showFallbackVideos() {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = `
        <div class="error-message">
            <h3>Videos konnten nicht geladen werden</h3>
            <p>Besuche unseren YouTube-Kanal direkt:</p>
            <p><a href="https://www.youtube.com/channel/${CHANNEL_ID}" target="_blank">Glück über Zweifel auf YouTube</a></p>
        </div>
    `;

    document.getElementById('totalVideos').textContent = '–';
    document.getElementById('updateTime').textContent = '–';
}

// Mehr Videos laden
function loadMoreVideos() {
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    renderVideos(activeFilter);
}

// Filter initialisieren
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            displayedVideos = 0;
            renderVideos(filter);
        });
    });
}

// Video Modal
function openVideo(videoId) {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('modalVideo');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('modalVideo');
    iframe.src = '';
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Hilfsfunktionen
function getCategoryLabel(category) {
    const labels = {
        'beziehung': 'Beziehung',
        'selbstfindung': 'Selbstfindung',
        'hochsensibel': 'Hochsensibilität',
        'koerper': 'Körper & Heilung'
    };
    return labels[category] || 'Inspiration';
}

function formatDate(date) {
    return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners initialisieren
document.addEventListener('DOMContentLoaded', function() {
    initFilters();
    loadYouTubeVideos();

    // Modal schließen bei Klick außerhalb
    document.getElementById('videoModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeVideoModal();
        }
    });

    // CSP-safe event delegation for buttons
    document.addEventListener('click', function(e) {
        // Load more button
        if (e.target.closest('.load-more-btn')) {
            loadMoreVideos();
            return;
        }
        // Modal close button
        if (e.target.closest('.modal-close')) {
            closeVideoModal();
            return;
        }
    });

    // ESC-Taste zum Schließen
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeVideoModal();
        }
    });
});
