/* ============================================================
   GENERÁTOR MATEMATICKÝCH PŘÍKLADŮ
   Každá úroveň má vlastní obtížnost a typy příkladů.
   ============================================================ */
(function () {
  "use strict";

  const MINUS = "−";
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const round3 = (n) => Math.round(n * 1000) / 1000;
  const fmt = (n) => {
    const r = round3(n);
    if (Object.is(r, -0) || r === 0) return "0";
    return String(r).replace(".", ",");
  };
  const pretty = (n) => fmt(n).replace("-", MINUS);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- banky otázek pro češtinu a angličtinu ---------- */
  const q = (text, answer, wrong, category, hint) => ({ text, answer, wrong, category, hint });

  const CZECH_BANK = {
    1: [
      q("Které písmeno je samohláska?", "A", ["B", "M", "K"], "hlásky", "Samohlásky jsou A, E, I, O, U, Y."),
      q("Kolik slabik má slovo MÁMA?", "2", ["1", "3", "4"], "slabiky", "Vytleskej slovo po slabikách: Má-ma."),
      q("Které slovo se rýmuje se slovem KOČKA?", "myška", ["pes", "strom", "auto"], "rýmy", "Hledej slovo, které končí stejně."),
      q("Doplň písmeno: MÁ_A", "M", ["P", "B", "T"], "písmena", "Vznikne slovo pro maminku."),
      q("Které slovo označuje zvíře?", "pes", ["stůl", "kniha", "okno"], "slovní zásoba", "Zvíře je živé a může štěkat."),
      q("Kolik písmen má slovo SLUNCE?", "6", ["5", "7", "4"], "písmena", "Počítej písmena: S-L-U-N-C-E."),
      q("Které slovo začíná na písmeno M?", "míč", ["pes", "auto", "ryba"], "hlásky", "Míč si bereš na hřiště."),
      q("Co patří do pohádky?", "princezna", ["autobus", "počítač", "telefon"], "pohádky", "V pohádkách bývají králové a princezny."),
      q("Které písmeno je souhláska?", "P", ["A", "E", "I"], "hlásky", "Souhlásky nejsou samohlásky."),
      q("Které slovo je zdrobnělina?", "pejsek", ["pes", "kočka", "kůň"], "slovní zásoba", "Zdrobnělina zní mazlivě a je menší.")
    ],
    2: [
      q("Které slovo je vyjmenované po B?", "být", ["bít", "bota", "bob"], "vyjmenovaná slova", "Vyjmenovaná slova po B: být, bydlit, obyvatel, byt..."),
      q("Doplň i/y: M__ jsme kamarádi.", "y", ["i", "í", "ý"], "i/y", "Zájmeno my píšeme s tvrdým y."),
      q("Které slovo je podstatné jméno?", "škola", ["běžet", "veselý", "rychle"], "slovní druhy", "Podstatná jména pojmenovávají osoby, zvířata a věci."),
      q("Které slovo je sloveso?", "skáče", ["strom", "modrý", "pomalu"], "slovní druhy", "Slovesa vyjadřují činnost."),
      q("Kolik slabik má slovo KOČIČKA?", "3", ["2", "4", "5"], "slabiky", "Ko-čič-ka."),
      q("Které slovo má předponu?", "přijít", ["jít", "chodit", "běžet"], "stavba slova", "Předpona je část slova před kořenem."),
      q("Které slovo je vyjmenované po L?", "lyže", ["les", "lev", "lampa"], "vyjmenovaná slova", "Vyjmenovaná slova po L: slyšet, mlýn, blýskat se, lyže..."),
      q("Doplň i/y: Na jaře kvetou b__liny.", "y", ["i", "í", "ý"], "i/y", "Bylina patří mezi vyjmenovaná slova po B."),
      q("Které slovo je přídavné jméno?", "veselý", ["skákat", "škola", "rychle"], "slovní druhy", "Přídavná jména popisují vlastnosti."),
      q("Která věta je napsaná správně?", "Maminka vaří oběd.", ["maminka vaří oběd.", "Maminka vaří Oběd.", "Maminka Vaří oběd."], "pravopis", "Věta začíná velkým písmenem.")
    ],
    3: [
      q("Doplň i/y: V__jmenovaná slova se učíme.", "y", ["i", "í", "ý"], "vyjmenovaná slova", "Slovo vyjmenovaná začíná na vy-."),
      q("Doplň správný tvar: Děti __ na hřišti.", "si hrají", ["si hraje", "si hrajou", "si hrajeme"], "shoda", "Podmět děti je v množném čísle."),
      q("Které slovo je příslovce?", "rychle", ["rychlý", "rychlost", "zrychlit"], "slovní druhy", "Příslovce odpovídají na otázku jak."),
      q("Která věta obsahuje předložku?", "Jdu do školy.", ["Jdu rychle.", "Jdu a zpívám.", "Jdu, ale nevím."], "slovní druhy", "Předložka stojí před podstatným jménem."),
      q("Jaký slovní druh je slovo ALE?", "spojka", ["předložka", "příslovce", "částice"], "slovní druhy", "Spojky spojují slova nebo věty."),
      q("Které slovo je zdrobnělina?", "domeček", ["dům", "domov", "domácí"], "slovní zásoba", "Zdrobnělina vyjadřuje menší věc."),
      q("Doplň správně: Na obloze zář__ slunce.", "í", ["ý", "e", "ou"], "pravopis", "Sloveso zářit má v 3. osobě čísla jednotného koncovku -í."),
      q("Které slovo je mnohoznačné?", "kohoutek", ["stůl", "kniha", "tužka"], "slovní zásoba", "Kohoutek může být pták i vodovodní část."),
      q("Co je to přirovnání?", "porovnání pomocí jako", ["opakování slov", "nadsázka", "zvířecí řeč"], "literatura", "Přirovnání často obsahuje slovo jako."),
      q("Která věta je souvětí?", "Pršelo, a proto jsme zůstali doma.", ["Pršelo.", "Zůstali jsme doma.", "Doma bylo teplo."], "věty", "Souvětí má alespoň dvě věty.")
    ],
    4: [
      q("Které slovo je napsané správně?", "výjimka", ["víjimka", "vyjímka", "vijímka"], "pravopis", "Slovo výjimka má předponu vý-."),
      q("Urči slovní druh slova PŘESTOŽE.", "spojka", ["předložka", "příslovce", "částice"], "slovní druhy", "Přestože spojuje dvě věty."),
      q("Která věta má správnou shodu?", "Chlapci přišli včas.", ["Chlapci přišel včas.", "Chlapci přišly včas.", "Chlapci přišlo včas."], "shoda", "Podmět chlapci je rodu mužského životného."),
      q("Co je metafora?", "přenášení významu na základě podobnosti", ["přirovnání pomocí jako", "nadsázka", "opakování na začátku veršů"], "literatura", "Metafora přenáší význam bez slova jako."),
      q("Které slovo je přejaté z cizího jazyka?", "telefon", ["stůl", "voda", "dům"], "slovní zásoba", "Telefon pochází z řečtiny."),
      q("Doplň: Kdybych __ čas, přišel bych.", "měl", ["mám", "budu mít", "mít"], "slovesa", "Podmiňovací způsob používá minulý tvar slovesa."),
      q("Která věta je v trpném rodě?", "Dům byl postaven v roce 1900.", ["Stavitel postavil dům.", "Dům stojí na kopci.", "Postavíme nový dům."], "slovesa", "V trpném rodě je děj vyjádřen opisem s být."),
      q("Které slovo je přídavné jméno přivlastňovací?", "matčin", ["milý", "červený", "rychlý"], "slovní druhy", "Přivlastňovací přídavná jména ukazují, komu něco patří."),
      q("Co je předpona?", "část slova před kořenem", ["část slova za kořenem", "koncová část slova", "část slova bez kořene"], "stavba slova", "Předpona mění význam slova."),
      q("Která věta obsahuje vsuvku?", "Můj bratr, který je starší, studuje lékařství.", ["Můj bratr studuje lékařství.", "Bratr je starší.", "Studuje lékařství."], "věty", "Vsuvka je vložená část věty oddělená čárkami.")
    ],
    5: [
      q("Které slovo je napsané správně?", "zpěv", ["spjev", "zpěf", "zpiev"], "pravopis", "Slovo zpěv píšeme se z na začátku."),
      q("Co je oxymóron?", "spojení protikladných slov", ["opakování slov", "přirovnání", "nadsázka"], "literatura", "Oxymóron spojuje zdánlivě protikladné pojmy."),
      q("Která věta je v podmiňovacím způsobu?", "Kdybych měl čas, přišel bych.", ["Přijdu zítra.", "Přišel jsem včas.", "Přijď zítra!"], "slovesa", "Podmiňovací způsob vyjadřuje podmínku."),
      q("Urči větný člen: Ve větě „Rychle běžel.“ je slovo „rychle“...", "příslovečné určení způsobu", ["předmět", "přívlastek", "podmět"], "větné členy", "Příslovečné určení odpovídá na otázku jak."),
      q("Které slovo je napsané správně?", "nepochybně", ["nepochibně", "nepochybňe", "nepochibňe"], "pravopis", "Slovo nepochybně obsahuje y po b."),
      q("Co je personifikace?", "přisouzení lidských vlastností neživým věcem", ["přirovnání", "nadsázka", "opakování"], "literatura", "Personifikace oživuje věci."),
      q("Která věta je souvětí podřadné?", "Nevěděl, kdy přijde.", ["Přišel a sedl si.", "Pršelo, ale šli jsme ven.", "Přišel, nebo ne?"], "věty", "V podřadném souvětí je jedna věta závislá."),
      q("Který tvar je správný?", "s oběma kamarády", ["s obouma kamarády", "s oběmi kamarády", "s oběma kamarádama"], "skloňování", "Číslovka oba má tvar oběma ve 7. pádě."),
      q("Které slovo je přejaté?", "fotbal", ["míč", "hřiště", "branka"], "slovní zásoba", "Fotbal pochází z angličtiny."),
      q("Co znamená rčení „mít něco za lubem“?", "mít tajný plán", ["být nemocný", "něco hledat", "být naštvaný"], "frazeologie", "Rčení se používá obrazně.")
    ],
    6: [
      q("Co je to elipsa?", "vynechání části výpovědi", ["nadsázka", "opakování", "přirovnání"], "literatura", "Elipsa záměrně vynechává slova."),
      q("Která věta je v trpném rodě?", "Kniha byla napsána autorem.", ["Autor napsal knihu.", "Kniha leží na stole.", "Autor píše knihu."], "slovesa", "Trpný rod často používá být + příčestí."),
      q("Urči styl: „Vážený pane, dovoluji si...“", "úřední styl", ["umělecký styl", "hovorový styl", "publicistický styl"], "stylistika", "Oslovení Vážený pane je typické pro úřední styk."),
      q("Co je to hyperbola?", "nadsázka", ["přirovnání", "personifikace", "metafora"], "literatura", "Hyperbola zveličuje."),
      q("Které slovo je napsané správně?", "konsensus", ["konsensuz", "konsenssus", "konsensys"], "pravopis", "Slovo konsensus se píše se s uprostřed."),
      q("Která věta obsahuje přechodník?", "Přijda domů, uvařil čaj.", ["Přišel domů a uvařil čaj.", "Když přišel domů, uvařil čaj.", "Přijde domů a uvaří čaj."], "slovesa", "Přechodník vyjadřuje současný nebo předchozí děj."),
      q("Co je to aluze?", "narážka na jiné dílo", ["opakování slov", "nadsázka", "přímá řeč"], "literatura", "Aluze odkazuje na známý text nebo událost."),
      q("Který tvar je spisovný?", "bychom", ["by jsme", "bysme", "bychme"], "pravopis", "Podmiňovací způsob 1. osoby množného čísla je bychom."),
      q("Urči slovesný rod: „Bylo rozhodnuto.“", "trpný", ["činný", "podmiňovací", "rozkazovací"], "slovesa", "Děj není vyjádřen aktivním podmětem."),
      q("Které souvětí je podřadné?", "Ačkoli pršelo, vyšli jsme.", ["Pršelo a vyšli jsme.", "Pršelo, nebo jsme zůstali.", "Pršelo, ale vyšli jsme."], "věty", "Spojka ačkoli uvozuje vedlejší větu.")
    ]
  };

  const ENGLISH_BANK = {
    1: [
      q("What color is the sky?", "blue", ["red", "green", "yellow"], "colors", "The sky is usually blue."),
      q("Which animal says 'meow'?", "cat", ["dog", "cow", "duck"], "animals", "A cat says meow."),
      q("How do you say 'ahoj' in English?", "hello", ["goodbye", "please", "thank you"], "greetings", "Hello is a common greeting."),
      q("What number comes after three?", "four", ["two", "five", "six"], "numbers", "Count: one, two, three, four."),
      q("Which one is a fruit?", "apple", ["car", "book", "chair"], "vocabulary", "An apple is a fruit."),
      q("How do you say 'děkuji'?", "thank you", ["hello", "sorry", "please"], "greetings", "Thank you means děkuji."),
      q("What is the opposite of 'big'?", "small", ["tall", "fast", "new"], "opposites", "Big and small are opposites."),
      q("Which word means 'máma'?", "mother", ["father", "sister", "brother"], "family", "Mother is máma."),
      q("What color is a banana?", "yellow", ["blue", "purple", "black"], "colors", "A banana is yellow."),
      q("Which is a day of the week?", "Monday", ["January", "summer", "morning"], "time", "Monday is a day of the week.")
    ],
    2: [
      q("What is the plural of 'cat'?", "cats", ["cat", "cates", "catz"], "plurals", "Add -s to make most plurals."),
      q("Choose the correct sentence.", "She is my friend.", ["She are my friend.", "She am my friend.", "She be my friend."], "grammar", "She goes with is."),
      q("What is the opposite of 'hot'?", "cold", ["warm", "sunny", "dry"], "opposites", "Hot and cold are opposites."),
      q("Which word is a verb?", "run", ["table", "happy", "blue"], "word classes", "A verb describes an action."),
      q("How do you say 'kniha'?", "book", ["look", "cook", "hook"], "vocabulary", "Book means kniha."),
      q("Choose the correct question.", "Do you like apples?", ["Does you like apples?", "Are you like apples?", "Is you like apples?"], "questions", "Use do with you."),
      q("What is the plural of 'child'?", "children", ["childs", "childes", "childrens"], "plurals", "Child has an irregular plural."),
      q("Which word means 'učitel'?", "teacher", ["student", "doctor", "driver"], "vocabulary", "A teacher teaches."),
      q("Choose the correct form: I ___ a student.", "am", ["is", "are", "be"], "grammar", "I goes with am."),
      q("What is the opposite of 'fast'?", "slow", ["quick", "late", "early"], "opposites", "Fast and slow are opposites.")
    ],
    3: [
      q("Choose the correct sentence in present simple.", "He plays football every day.", ["He play football every day.", "He is play football every day.", "He playing football every day."], "present simple", "He/she/it takes -s in present simple."),
      q("What is the past tense of 'go'?", "went", ["goed", "gone", "going"], "past simple", "Go is irregular: go - went - gone."),
      q("Choose the correct preposition: The book is ___ the table.", "on", ["at", "in", "to"], "prepositions", "On means na povrchu."),
      q("What does 'breakfast' mean?", "snídaně", ["oběd", "večeře", "svačina"], "vocabulary", "Breakfast is the first meal of the day."),
      q("Choose the correct plural: one mouse, two ___.", "mice", ["mouses", "mouse", "mices"], "plurals", "Mouse has the irregular plural mice."),
      q("Which word is an adjective?", "beautiful", ["run", "quickly", "table"], "word classes", "An adjective describes a noun."),
      q("Choose the correct question: ___ do you live?", "Where", ["What", "Who", "When"], "questions", "Where asks about a place."),
      q("What is the opposite of 'always'?", "never", ["sometimes", "often", "usually"], "opposites", "Always and never are opposites."),
      q("Choose the correct sentence.", "There are two apples on the table.", ["There is two apples on the table.", "There are two apple on the table.", "There be two apples on the table."], "grammar", "Use are with a plural noun."),
      q("What does 'library' mean?", "knihovna", ["knihkupectví", "škola", "obchod"], "vocabulary", "A library is a place with books.")
    ],
    4: [
      q("Choose the correct past simple sentence.", "She visited her grandmother yesterday.", ["She visit her grandmother yesterday.", "She was visit her grandmother yesterday.", "She visiting her grandmother yesterday."], "past simple", "Regular verbs take -ed in past simple."),
      q("What is the comparative form of 'good'?", "better", ["gooder", "best", "more good"], "comparatives", "Good is irregular: good - better - best."),
      q("Choose the correct sentence with 'going to'.", "We are going to travel next week.", ["We going to travel next week.", "We are go to travel next week.", "We is going to travel next week."], "future", "Use am/is/are + going to + verb."),
      q("What does 'borrow' mean?", "půjčit si", ["koupit", "prodat", "ukrást"], "vocabulary", "Borrow means to take something temporarily."),
      q("Choose the correct preposition: I'm interested ___ history.", "in", ["on", "at", "for"], "prepositions", "Interested in is a fixed phrase."),
      q("What is the past participle of 'write'?", "written", ["wrote", "writed", "writing"], "irregular verbs", "Write - wrote - written."),
      q("Choose the correct question tag: You like tea, ___?", "don't you", ["do you", "aren't you", "didn't you"], "question tags", "The main verb is like in present simple."),
      q("Which word means 'životopis'?", "CV", ["cover letter", "diary", "invoice"], "vocabulary", "CV is short for curriculum vitae."),
      q("Choose the correct sentence.", "If it rains, we will stay at home.", ["If it will rain, we stay at home.", "If it rains, we would stay at home.", "If it rain, we will stay at home."], "conditionals", "Use present simple after if in the first conditional."),
      q("What is the opposite of 'expensive'?", "cheap", ["costly", "rich", "valuable"], "opposites", "Expensive and cheap are opposites.")
    ],
    5: [
      q("Choose the correct present perfect sentence.", "I have never been to London.", ["I never was to London.", "I have never went to London.", "I am never been to London."], "present perfect", "Use have/has + past participle."),
      q("What is the passive form of 'They built the house'?", "The house was built.", ["The house is build.", "The house built.", "The house has build."], "passive", "Use was/were + past participle."),
      q("Choose the correct conditional sentence.", "If I had more time, I would learn Spanish.", ["If I have more time, I would learn Spanish.", "If I had more time, I will learn Spanish.", "If I would have more time, I learned Spanish."], "conditionals", "The second conditional uses past simple + would."),
      q("What does 'although' mean?", "ačkoli", ["protože", "takže", "pokud"], "vocabulary", "Although introduces a contrast."),
      q("Choose the correct form: She suggested ___ a break.", "taking", ["to take", "take", "took"], "gerunds", "Suggest is followed by -ing."),
      q("Choose the correct reported speech: 'I am tired,' he said.", "He said that he was tired.", ["He said that he is tired.", "He said that I was tired.", "He says that he was tired."], "reported speech", "Move the tense back in reported speech."),
      q("Which word is a phrasal verb?", "give up", ["give", "up", "gift"], "phrasal verbs", "A phrasal verb is a verb plus a particle."),
      q("Choose the correct sentence.", "Neither of the answers is correct.", ["Neither of the answers are correct.", "Neither of the answer is correct.", "Neither answers is correct."], "grammar", "Neither of + plural noun takes a singular verb."),
      q("What does 'reluctant' mean?", "neochotný", ["nadšený", "zvědavý", "líný"], "vocabulary", "Reluctant means not willing."),
      q("Choose the correct preposition: She is good ___ maths.", "at", ["in", "on", "for"], "prepositions", "Good at is a fixed phrase.")
    ],
    6: [
      q("Choose the correct sentence.", "Had I known, I would have come.", ["If I would have known, I would have come.", "Had I knew, I would have come.", "If I had known, I would come."], "conditionals", "This is the third conditional with inversion."),
      q("What does 'notwithstanding' mean?", "navzdory", ["protože", "zatímco", "podle"], "vocabulary", "Notwithstanding means in spite of."),
      q("Choose the correct passive sentence.", "The report has been completed.", ["The report have been completed.", "The report has completed.", "The report is been completed."], "passive", "Use has been + past participle."),
      q("Which word is a collocation with 'make'?", "make a decision", ["make a photo", "make a shower", "make a walk"], "collocations", "We say make a decision."),
      q("Choose the correct form: I wish I ___ more time.", "had", ["have", "will have", "would have"], "wish", "After wish, use past simple for the present."),
      q("What does 'to put up with' mean?", "snášet", ["odložit", "postavit", "nabídnout"], "phrasal verbs", "Put up with means tolerate."),
      q("Choose the correct sentence.", "She denied having taken the money.", ["She denied to take the money.", "She denied have taken the money.", "She denied took the money."], "gerunds", "Deny is followed by -ing."),
      q("What is the synonym of 'crucial'?", "essential", ["optional", "minor", "unusual"], "vocabulary", "Crucial means very important."),
      q("Choose the correct sentence.", "Hardly had he arrived when the phone rang.", ["Hardly he had arrived when the phone rang.", "Hardly had he arrived than the phone rang.", "Hardly he arrived when the phone rang."], "inversion", "Hardly at the beginning requires inversion."),
      q("What does 'ambiguous' mean?", "nejednoznačný", ["zřejmý", "přesný", "jednoduchý"], "vocabulary", "Ambiguous means unclear.")
    ]
  };

  function fromBank(bank, level, subjectId) {
    const question = pick(bank || CZECH_BANK[3]);
    const count = Math.max(3, Number(level.choices) || 4);
    const choices = [question.answer];
    const seen = new Set(choices);
    for (const wrong of shuffle(question.wrong || [])) {
      if (choices.length >= count) break;
      if (wrong === question.answer || seen.has(wrong)) continue;
      seen.add(wrong);
      choices.push(wrong);
    }
    return {
      text: question.text,
      answer: question.answer,
      value: question.answer,
      choices: shuffle(choices),
      hint: question.hint || "Přečti si otázku pozorně a vyluč nesprávné možnosti.",
      category: question.category || (subjectId === "anglictina" ? "angličtina" : "čeština"),
      tier: level.mathTier,
      subject: subjectId
    };
  }

  function makeChoices(answer, count, extras, step, min, max) {
    const answerText = fmt(answer);
    const options = [answerText];
    const seen = new Set(options);
    let guard = 0;

    const push = (value) => {
      if (options.length >= count) return;
      if (!Number.isFinite(value)) return;
      const rounded = round3(value);
      if (rounded < min || rounded > max) return;
      const text = fmt(rounded);
      if (seen.has(text)) return;
      seen.add(text);
      options.push(text);
    };

    shuffle((extras || []).map(round3)).forEach(push);

    const offsets = shuffle([1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 8, -8, 10, -10, 15, -15, 20, -20]);
    for (const o of offsets) push(answer + o * step);

    while (options.length < count && guard++ < 80) {
      push(answer + rnd(-12, 12) * step);
    }
    if (options.length < count) {
      // velmi vzácný případ – doplníme nejbližší volná čísla
      let candidate = Math.max(min, answer - 50);
      while (options.length < count && candidate <= Math.max(max, answer + 50)) {
        push(candidate);
        candidate += step;
      }
    }
    return shuffle(options);
  }

  function finish(raw, level) {
    const count = Math.max(3, Number(level.choices) || 4);
    const step = raw.step || (Number.isInteger(raw.answer) ? 1 : 0.1);
    const min = raw.min !== undefined ? raw.min : -100000;
    const max = raw.max !== undefined ? raw.max : 100000;
    const choices = makeChoices(raw.answer, count, raw.extras, step, min, max);
    return {
      text: raw.text,
      answer: fmt(raw.answer),
      value: raw.answer,
      choices,
      hint: raw.hint || "Zkus si příklad rozložit na menší kroky.",
      category: raw.category || "počítání",
      tier: level.mathTier,
      subject: "matematika"
    };
  }

  /* ---------- 1. TŘÍDA: do 10 ---------- */
  function tier1() {
    const type = pick(["add", "sub", "missingAdd", "missingSub"]);
    if (type === "add") {
      const a = rnd(1, 6), b = rnd(1, 9 - a);
      return {
        text: `${a} + ${b} = ?`, answer: a + b, min: 0, max: 20,
        extras: [a + b + 1, a + b - 1, a + b + 2],
        category: "sčítání",
        hint: "Sečti obě čísla. Můžeš si pomoct prsty nebo číselnou osou."
      };
    }
    if (type === "sub") {
      const a = rnd(2, 10), b = rnd(1, a - 1);
      return {
        text: `${a} ${MINUS} ${b} = ?`, answer: a - b, min: 0, max: 20,
        extras: [a - b + 1, a - b - 1, a - b + 2],
        category: "odčítání",
        hint: "Odečti menší číslo od většího. Kolik zbývá?"
      };
    }
    if (type === "missingAdd") {
      const total = rnd(3, 10), a = rnd(1, total - 1);
      return {
        text: `${a} + ? = ${total}`, answer: total - a, min: 0, max: 10,
        category: "doplňování",
        hint: "Kolik musíš přičíst k prvnímu číslu, abys dostal výsledek?"
      };
    }
    const total = rnd(4, 10), answer = rnd(1, total - 1), b = total - answer;
    return {
      text: `${total} ${MINUS} ? = ${b}`, answer, min: 0, max: 10,
      category: "doplňování",
      hint: "Hledej číslo, které po odečtení dá výsledek napravo."
    };
  }

  /* ---------- 2. TŘÍDA: do 100, malá násobilka ---------- */
  function tier2() {
    const type = pick(["add", "sub", "mul", "div", "missing"]);
    if (type === "add") {
      const a = rnd(12, 49), b = rnd(12, Math.min(50, 99 - a));
      return {
        text: `${a} + ${b} = ?`, answer: a + b, min: 0, max: 120,
        extras: [a + b + 1, a + b - 1, a + b + 10],
        category: "sčítání",
        hint: "Rozlož si čísla na desítky a jednotky: 34 + 25 = 30 + 20 + 4 + 5."
      };
    }
    if (type === "sub") {
      const a = rnd(35, 99), b = rnd(12, a - 15);
      return {
        text: `${a} ${MINUS} ${b} = ?`, answer: a - b, min: 0, max: 120,
        extras: [a - b + 1, a - b - 1, a - b + 10],
        category: "odčítání",
        hint: "Odečti nejdřív desítky a pak jednotky. Nebo si pomoz dopočítáním."
      };
    }
    if (type === "mul") {
      const a = rnd(2, 5), b = rnd(2, 10);
      return {
        text: `${a} · ${b} = ?`, answer: a * b, min: 0, max: 70,
        extras: [a * (b + 1), a * (b - 1), a * b + a],
        category: "násobení",
        hint: "Násobení je opakované sčítání: 4 · 6 = 6 + 6 + 6 + 6."
      };
    }
    if (type === "div") {
      const quotient = rnd(2, 10), divisor = rnd(2, 5);
      return {
        text: `${quotient * divisor} : ${divisor} = ?`, answer: quotient, min: 0, max: 20,
        extras: [quotient + 1, quotient - 1, quotient * divisor],
        category: "dělení",
        hint: "Zeptej se: kolikrát se vejde dělitel do děleného čísla?"
      };
    }
    const total = rnd(35, 99), part = rnd(12, total - 12);
    return {
      text: `${part} + ? = ${total}`, answer: total - part, min: 0, max: 100,
      category: "doplňování",
      hint: "Do celkového součtu chybí jen jedno číslo. Kolik to je?"
    };
  }

  /* ---------- 3.–4. TŘÍDA: násobilka, dělení, zlomky ---------- */
  function tier3() {
    const type = pick(["mul", "div", "big", "fraction", "parens"]);
    if (type === "mul") {
      const a = rnd(2, 10), b = rnd(2, 10);
      return {
        text: `${a} · ${b} = ?`, answer: a * b, min: 0, max: 130,
        extras: [a * (b + 1), a * (b - 1), (a + 1) * b, a + b],
        category: "násobilka",
        hint: "Rozlož jeden činitel: 7 · 8 = 7 · 5 + 7 · 3."
      };
    }
    if (type === "div") {
      const quotient = rnd(2, 10), divisor = rnd(2, 10);
      return {
        text: `${quotient * divisor} : ${divisor} = ?`, answer: quotient, min: 0, max: 20,
        extras: [quotient + 1, quotient - 1, quotient + 2, divisor],
        category: "dělení",
        hint: "Dělení je opak násobení. Které číslo krát dělitel dá dělenec?"
      };
    }
    if (type === "big") {
      const a = rnd(12, 89) * 10, b = rnd(11, 49) * 10;
      const plus = Math.random() < 0.5;
      const answer = plus ? a + b : a - b;
      return {
        text: `${a} ${plus ? "+" : MINUS} ${b} = ?`, answer, step: 10, min: 0, max: 2000,
        extras: [answer + 10, answer - 10, answer + 100, answer - 100],
        category: plus ? "sčítání" : "odčítání",
        hint: "Počítej s desítkami jako s jednotkami a na konci přidej nulu."
      };
    }
    if (type === "fraction") {
      const den = pick([2, 3, 4, 5, 6, 8]);
      const num = rnd(1, den - 1);
      const base = den * rnd(2, 9);
      const answer = (base / den) * num;
      return {
        text: `${num}/${den} z ${base} = ?`, answer, min: 0, max: 100,
        extras: [base / den, answer + base / den, base - num, answer + 1],
        category: "zlomky",
        hint: "Nejdřív vyděl celek jmenovatelem a potom vynásob čitatelem."
      };
    }
    const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 5);
    return {
      text: `(${a} + ${b}) · ${c} = ?`, answer: (a + b) * c, min: 0, max: 200,
      extras: [a + b * c, a + b + c, (a + b) * c + c],
      category: "závorky",
      hint: "Nejdřív spočítej, co je v závorce, a teprve potom násob."
    };
  }

  /* ---------- 5.–6. TŘÍDA: desetinná čísla, procenta, zlomky ---------- */
  function tier4() {
    const type = pick(["decimal", "multDecimal", "fraction", "percent", "order", "negative"]);
    if (type === "decimal") {
      const plus = Math.random() < 0.55;
      if (plus) {
        const a = rnd(11, 79), b = rnd(11, 79);
        return {
          text: `${fmt(a / 10)} + ${fmt(b / 10)} = ?`, answer: (a + b) / 10, step: 0.1, min: 0, max: 30,
          extras: [(a + b + 1) / 10, (a + b - 1) / 10, (a + b + 10) / 10],
          category: "desetinná čísla",
          hint: "Sečti nejdřív celé části a potom desetiny. Desetinnou čárku piš pod sebe."
        };
      }
      const a = rnd(30, 95), b = rnd(11, a - 10);
      return {
        text: `${fmt(a / 10)} ${MINUS} ${fmt(b / 10)} = ?`, answer: (a - b) / 10, step: 0.1, min: 0, max: 20,
        extras: [(a - b + 1) / 10, (a - b - 1) / 10, (a - b + 10) / 10],
        category: "desetinná čísla",
        hint: "Odečti celé části a pak desetiny. Dávej pozor na přechod přes desítku."
      };
    }
    if (type === "multDecimal") {
      const n = rnd(12, 98), factor = pick([10, 100]);
      const answer = (n * factor) / 10;
      return {
        text: `${fmt(n / 10)} · ${factor} = ?`, answer, step: factor === 100 ? 10 : 1, min: 0, max: 2000,
        extras: [answer * 10, answer / 10, answer + factor / 10, answer - factor / 10],
        category: "desetinná čísla",
        hint: "Při násobení deseti se čárka posune o jedno místo doprava, u stovky o dvě."
      };
    }
    if (type === "fraction") {
      const den = pick([2, 3, 4, 5, 6, 8]);
      const num = rnd(1, den - 1);
      const base = den * rnd(3, 15);
      const answer = (base / den) * num;
      return {
        text: `Kolik je ${num}/${den} z ${base}?`, answer, min: 0, max: 200,
        extras: [base / den, answer + base / den, base - num, answer + 1],
        category: "zlomky",
        hint: "Vyděl celek jmenovatelem. Výsledek pak vynásob čitatelem."
      };
    }
    if (type === "percent") {
      const base = rnd(2, 20) * 20;
      const percent = pick([10, 20, 25, 50]);
      const answer = (base * percent) / 100;
      return {
        text: `Kolik je ${percent} % z ${base}?`, answer, min: 0, max: 300,
        extras: [base / 10, answer + 10, answer - 10, base - answer],
        category: "procenta",
        hint: "1 % je jedna setina základu. 10 % = základ děleno 10, 50 % = polovina."
      };
    }
    if (type === "order") {
      const a = rnd(2, 12), b = rnd(2, 9), c = rnd(2, 6);
      return {
        text: `${a} + ${b} · ${c} = ?`, answer: a + b * c, min: 0, max: 100,
        extras: [(a + b) * c, a + b + c, a + b * c + c],
        category: "pořadí operací",
        hint: "Násobení má přednost před sčítáním. Nejprve spočítej b · c."
      };
    }
    const a = rnd(2, 15), b = rnd(a + 1, 25);
    return {
      text: `${a} ${MINUS} ${b} = ?`, answer: a - b, min: -30, max: 30,
      extras: [b - a, a - b + 1, a - b - 1, a + b],
      category: "záporná čísla",
      hint: "Když je druhý číslo větší, výsledek bude záporný. Kolik chybí do nuly?"
    };
  }

  /* ---------- 7.–9. TŘÍDA: záporná čísla, mocniny, rovnice, procenta ---------- */
  function tier5() {
    const type = pick(["negative", "power", "sqrt", "percent", "equation", "ratio"]);
    if (type === "negative") {
      const variant = rnd(1, 3);
      if (variant === 1) {
        const a = rnd(3, 20), b = rnd(4, 25);
        return {
          text: `${MINUS}${a} + ${b} = ?`, answer: b - a, min: -30, max: 30,
          extras: [a - b, b - a + 1, b - a - 1, b + a],
          category: "záporná čísla",
          hint: "Od kladného čísla odečti absolutní hodnotu záporného čísla."
        };
      }
      if (variant === 2) {
        const a = rnd(3, 15), b = rnd(2, 15);
        return {
          text: `${MINUS}${a} ${MINUS} ${b} = ?`, answer: -a - b, min: -40, max: 40,
          extras: [a + b, -a + b, -a - b + 1, -a - b - 1],
          category: "záporná čísla",
          hint: "Součet dvou záporných čísel je záporný. Sečti jejich absolutní hodnoty."
        };
      }
      const a = rnd(2, 10), b = rnd(2, 9);
      return {
        text: `(${MINUS}${a}) · ${b} = ?`, answer: -a * b, min: -100, max: 100,
        extras: [a * b, -a * b + 1, -a * b - 1, -a + b],
        category: "záporná čísla",
        hint: "Záporné číslo krát kladné je záporné. Vynásob čísla a doplň znaménko."
      };
    }
    if (type === "power") {
      const variant = rnd(1, 2);
      if (variant === 1) {
        const base = rnd(2, 5), exp = pick([2, 3]);
        return {
          text: `${base}${exp === 2 ? "²" : "³"} = ?`, answer: Math.pow(base, exp), min: 0, max: 160,
          extras: [base * exp, base * base * base, base + exp, Math.pow(base, exp) + base],
          category: "mocniny",
          hint: "Mocnina je opakované násobení: 4³ = 4 · 4 · 4."
        };
      }
      const a = rnd(2, 6), b = rnd(2, 6);
      return {
        text: `${a}² + ${b}² = ?`, answer: a * a + b * b, min: 0, max: 100,
        extras: [(a + b) * (a + b), a * a + b, a + b * b, a * b * 2],
        category: "mocniny",
        hint: "Umocni každé číslo zvlášť a potom obě mocniny sečti."
      };
    }
    if (type === "sqrt") {
      const root = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      return {
        text: `√${root * root} = ?`, answer: root, min: 0, max: 20,
        extras: [root * 2, root + 1, root - 1, root * root],
        category: "odmocniny",
        hint: "Hledej číslo, které po vynásobení samo sebou dá číslo pod odmocninou."
      };
    }
    if (type === "percent") {
      const base = rnd(2, 30) * 20;
      const percent = pick([5, 10, 15, 20, 25, 40, 60, 75]);
      const answer = (base * percent) / 100;
      return {
        text: `Kolik je ${percent} % z ${base}?`, answer, min: 0, max: 600,
        extras: [base / 10, answer + 10, answer - 10, base - answer],
        category: "procenta",
        hint: "Vypočítej 1 % (základ děleno 100) a vynásob počtem procent."
      };
    }
    if (type === "equation") {
      const a = rnd(2, 7), x = rnd(-5, 9), b = rnd(-12, 15);
      const c = a * x + b;
      const bTxt = b === 0 ? "" : b > 0 ? ` + ${b}` : ` ${MINUS} ${Math.abs(b)}`;
      return {
        text: `${a}x${bTxt} = ${pretty(c)}`, answer: x, min: -20, max: 25,
        extras: [x + 1, x - 1, -x, c - b, Math.round(c / a)],
        category: "rovnice",
        hint: "Nejdřív odečti stejné číslo od obou stran, potom vyděl koeficientem u x."
      };
    }
    const a = rnd(2, 5), b = rnd(2, 5), k = rnd(2, 9);
    const total = (a + b) * k;
    const larger = Math.max(a, b) * k;
    return {
      text: `Rozděl ${total} v poměru ${a} : ${b}. Kolik je větší část?`, answer: larger, min: 0, max: 200,
      extras: [Math.min(a, b) * k, k, total, larger - k],
      category: "poměry",
      hint: "Sečti obě čísla poměru, zjisti hodnotu jednoho dílu a vynásob ji větší částí."
    };
  }

  /* ---------- STŘEDNÍ ŠKOLA ---------- */
  function tier6() {
    const type = pick(["parenEquation", "quadratic", "system", "percentChange", "negativePower", "fractionEquation"]);
    if (type === "parenEquation") {
      const a = rnd(2, 4), x = rnd(2, 10), b = pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
      const c = a * (x + b);
      const bTxt = b > 0 ? ` + ${b}` : ` ${MINUS} ${Math.abs(b)}`;
      return {
        text: `${a}(x${bTxt}) = ${pretty(c)}`, answer: x, min: -10, max: 20,
        extras: [x + b, x - 1, x + 1, c / a, -x],
        category: "rovnice",
        hint: "Vyděl obě strany číslem před závorkou a potom osamostatni x."
      };
    }
    if (type === "quadratic") {
      const r1 = rnd(1, 4), r2 = rnd(5, 9);
      const sum = r1 + r2, prod = r1 * r2;
      return {
        text: `x² ${MINUS} ${sum}x + ${prod} = 0. Větší kořen?`, answer: r2, min: 0, max: 15,
        extras: [r1, -r2, sum, prod],
        category: "kvadratické rovnice",
        hint: "Hledej dvojici čísel, jejichž součet je číslo u x a součin absolutní člen."
      };
    }
    if (type === "system") {
      const y = rnd(1, 8), x = rnd(y + 2, y + 10);
      const sum = x + y, diff = x - y;
      return {
        text: `x + y = ${sum} a současně x ${MINUS} y = ${diff}. Kolik je x?`, answer: x, min: 0, max: 30,
        extras: [y, sum, diff, x - 1],
        category: "soustavy rovnic",
        hint: "Obě rovnice sečti – y se vyruší a zůstane 2x."
      };
    }
    if (type === "percentChange") {
      const base = rnd(4, 20) * 20;
      const percent = pick([10, 20, 25, 50]);
      const answer = (base * (100 + percent)) / 100;
      return {
        text: `Cena ${base} Kč stoupla o ${percent} %. Kolik stojí teď?`, answer, min: 0, max: 800,
        extras: [base + percent, base * (percent / 100), base, answer - base],
        category: "procenta",
        hint: "Nejdřív spočítej, kolik je percent z ceny, a přičti to k původní ceně."
      };
    }
    if (type === "negativePower") {
      const base = pick([2, 4]);
      const exp = pick([-1, -2]);
      const answer = Math.pow(base, exp);
      return {
        text: `${base}${exp === -1 ? "⁻¹" : "⁻²"} = ?`, answer, step: 0.05, min: 0, max: 2,
        extras: [Math.pow(base, Math.abs(exp)), 1 / base, 1 - base / 10, Math.pow(base, exp) * 2],
        category: "mocniny",
        hint: "Záporný exponent znamená převrácenou hodnotu: a⁻ⁿ = 1 / aⁿ."
      };
    }
    const a = rnd(2, 5), quotient = rnd(2, 10), x = a * quotient;
    const b = rnd(1, 9), c = quotient + b;
    return {
      text: `x/${a} + ${b} = ${c}`, answer: x, min: 0, max: 50,
      extras: [quotient, c - b, x + a, x - a],
      category: "rovnice",
      hint: "Nejdřív odečti b od obou stran. Potom celou rovnici vynásob jmenovatelem."
    };
  }

  const generators = { 1: tier1, 2: tier2, 3: tier3, 4: tier4, 5: tier5, 6: tier6 };

  function create(level, subject) {
    const subjectId = typeof subject === "string"
      ? subject
      : subject && subject.id
        ? subject.id
        : "matematika";
    if (subjectId === "cestina") {
      return fromBank(CZECH_BANK[level.mathTier] || CZECH_BANK[3], level, subjectId);
    }
    if (subjectId === "anglictina") {
      return fromBank(ENGLISH_BANK[level.mathTier] || ENGLISH_BANK[3], level, subjectId);
    }
    const gen = generators[level.mathTier] || tier3;
    let raw;
    try {
      raw = gen();
    } catch (err) {
      console.error("Chyba generátoru příkladu", err);
      raw = { text: "2 + 2 = ?", answer: 4, hint: "Sečti obě čísla." };
    }
    return finish(raw, level);
  }

  window.QuestionEngine = { create, fmt };
})();
