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
      tier: level.mathTier
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

  function create(level) {
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
