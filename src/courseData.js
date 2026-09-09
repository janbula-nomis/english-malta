// Struktura učebnice EF General English A2.2 (podle obsahu) + české vysvětlení gramatiky
export const GRAMMAR = {
  comparatives: { name: "Comparative adjectives", cz: "Stupňování: krátká přídavná jména + -er (cheaper, bigger), dlouhá s more (more expensive). Porovnáváme pomocí than.", ex: ["The train is faster than the bus.", "This hotel is more expensive than that one."] },
  advDirection: { name: "Adverbs of direction", cz: "Popis cesty: go straight on, turn left/right, go past, go along, it's opposite / next to / between.", ex: ["Go straight on and turn left at the bank.", "The station is opposite the park."] },
  politeRequests: { name: "Polite requests", cz: "Zdvořilé žádosti: Could I have…? Could you…? Can I…? Would you mind…? Odpověď: Sure / Of course / I'm afraid not.", ex: ["Could I have a return ticket, please?", "Could you tell me the time?"] },
  haveToMust: { name: "Have to / must, can / can't", cz: "Have to a must = musím (nutnost). Don't have to = nemusím. Mustn't = nesmím. Can = můžu/umím, can't = nemůžu/neumím.", ex: ["You have to buy a ticket before you get on.", "You mustn't smoke here."] },
  wasWere: { name: "Was / were", cz: "Minulý čas slovesa be: I/he/she/it was, you/we/they were. Zápor wasn't/weren't, otázka Was it…? Were you…?", ex: ["I was at home yesterday.", "Were you tired after the trip?"] },
  pastRegular: { name: "Past simple – regular verbs", cz: "Pravidelná slovesa v minulosti: + -ed (worked, played, stopped, studied). Zápor didn't + základní tvar, otázka Did you + základní tvar.", ex: ["I worked late yesterday.", "Did you watch the film? – No, I didn't."] },
  pastIrregular: { name: "Past simple – irregular verbs", cz: "Nepravidelná slovesa mají vlastní minulý tvar (go → went, buy → bought, have → had). V záporu a otázce se vrací základní tvar: didn't go, Did you go?", ex: ["We went to the beach on Saturday.", "She didn't buy anything."] },
  linkingVerbs: { name: "Be / feel as linking verbs", cz: "Po be a feel následuje přídavné jméno, ne příslovce: I feel tired, She is ill, It looks good.", ex: ["I feel terrible today.", "He was sick last week."] },
  imperativesShould: { name: "Imperatives with please, advice with should", cz: "Rozkaz: Take this medicine, please. Don't eat too much. Rada: You should rest. You shouldn't work today.", ex: ["Please sit down and open your mouth.", "You should see a doctor."] },
  could: { name: "Could for suggestions", cz: "Could = návrh: You could try yoga. We could go for a walk. Odpověď: That's a good idea / I'd rather not.", ex: ["You could walk to work instead of driving.", "We could cook something healthy tonight."] },
  pastCont1: { name: "Past continuous (1)", cz: "Co se dělo v určitou chvíli v minulosti: was/were + -ing. At 8 o'clock I was having breakfast.", ex: ["This time last week I was lying on the beach.", "What were you doing at nine?"] },
  pastCont2: { name: "Past continuous (2) and past simple", cz: "Dlouhý děj na pozadí (past continuous) přerušený krátkým dějem (past simple), často s when / while.", ex: ["I was walking home when it started to rain.", "While we were eating, the phone rang."] },
  presPerfExp: { name: "Present perfect for experiences", cz: "Zkušenosti bez určení času: have/has + 3. tvar (past participle). Have you ever been to Malta? I've never eaten sushi.", ex: ["Have you ever tried scuba diving?", "I've been to Spain three times."] },
  likeIng: { name: "Like + verb + -ing", cz: "Po like, love, hate, enjoy, don't mind následuje -ing tvar: I like swimming. She hates getting up early.", ex: ["I love travelling by train.", "He doesn't like waiting."] },
  goingTo: { name: "Going to future", cz: "Plány a záměry: be going to + sloveso. Také předpověď podle toho, co vidíme: Look at the clouds, it's going to rain.", ex: ["We're going to visit Gozo on Sunday.", "It's going to be cold tomorrow."] },
  phrasal: { name: "Phrasal verbs", cz: "Sloveso + částice = nový význam: look after (starat se), give up (vzdát), pick up (vyzvednout). Oddělitelná: pick it up; neoddělitelná: look after him.", ex: ["Who looks after the animals?", "Turn off the lights, please."] },
  superlatives: { name: "Superlative adjectives", cz: "Nejvyšší stupeň: the + -est (the biggest, the hottest), u dlouhých the most (the most beautiful). Nepravidelné: the best, the worst.", ex: ["Everest is the highest mountain in the world.", "It was the most beautiful place I've seen."] },
  willFuture: { name: "Future simple (will)", cz: "Předpovědi a spontánní rozhodnutí: will + sloveso. Zápor won't. In 20 years people will live longer.", ex: ["Robots will do a lot of jobs.", "I think it'll rain tomorrow."] },
  willVsPresCont: { name: "Will vs. present continuous for future", cz: "Present continuous = domluvený plán (I'm meeting Anna at six). Will = rozhodnutí teď nebo předpověď (I'll help you).", ex: ["We're having a party on Friday.", "Don't worry, I'll bring the drinks."] },
  presPerfResult: { name: "Present perfect for present result", cz: "Něco se stalo a teď je vidět výsledek: I've lost my keys (nemám je). S just, already, yet: I've just finished. Have you eaten yet?", ex: ["I've already booked the tickets.", "She hasn't finished yet."] },
};

export const COURSE = [
  { id: "u1", n: 1, title: "Out & about", page: 9, lessons: [
    { id: "u1l12", n: "1 & 2", title: "Getting around", page: 10, grammar: ["comparatives"], vocab: "transport and travel", cz: "doprava a cestování" },
    { id: "u1l34", n: "3 & 4", title: "Around town", page: 15, grammar: ["advDirection"], vocab: "buildings and places", cz: "budovy a místa ve městě" },
    { id: "u1l56", n: "5 & 6", title: "Visiting new places", page: 21, grammar: ["politeRequests"], vocab: "buying tickets", cz: "kupování lístků" },
    { id: "u1l7", n: "7", title: "Listening & Speaking focus", page: 26, grammar: [], vocab: "checking information", cz: "ověřování informací" },
    { id: "u1l8", n: "8", title: "Review", page: 29, grammar: ["haveToMust"], vocab: "", cz: "opakování unitu", review: true },
  ]},
  { id: "u2", n: 2, title: "The past", page: 33, lessons: [
    { id: "u2l12", n: "1 & 2", title: "Childhood memories", page: 34, grammar: ["wasWere"], vocab: "adjectives for describing places", cz: "přídavná jména pro popis míst" },
    { id: "u2l34", n: "3 & 4", title: "What a day!", page: 38, grammar: ["pastRegular"], vocab: "actions at work", cz: "činnosti v práci" },
    { id: "u2l56", n: "5 & 6", title: "What did you get up to last weekend?", page: 42, grammar: ["pastIrregular"], vocab: "common irregular verbs", cz: "běžná nepravidelná slovesa", drill: "irr" },
    { id: "u2l7", n: "7", title: "Listening & Speaking focus", page: 47, grammar: [], vocab: "the meaning of new words", cz: "ptát se na význam slov" },
    { id: "u2l8", n: "8", title: "Review", page: 50, grammar: ["advDirection", "politeRequests"], vocab: "", cz: "opakování unitu", review: true },
  ]},
  { id: "u3", n: 3, title: "Body & health", page: 55, lessons: [
    { id: "u3l12", n: "1 & 2", title: "How do you feel?", page: 56, grammar: ["linkingVerbs"], vocab: "accidents and illness", cz: "úrazy a nemoci" },
    { id: "u3l34", n: "3 & 4", title: "At the doctor's", page: 60, grammar: ["imperativesShould"], vocab: "phrases with take", cz: "fráze se slovesem take" },
    { id: "u3l56", n: "5 & 6", title: "Staying healthy", page: 65, grammar: ["could"], vocab: "health and fitness", cz: "zdraví a kondice" },
    { id: "u3l7", n: "7", title: "Listening & Speaking focus", page: 69, grammar: [], vocab: "making appointments", cz: "domlouvání schůzek" },
    { id: "u3l8", n: "8", title: "Review", page: 72, grammar: ["comparatives", "pastRegular"], vocab: "", cz: "opakování unitu", review: true },
  ]},
  { id: "u4", n: 4, title: "Experiences", page: 77, lessons: [
    { id: "u4l12", n: "1 & 2", title: "This time last week", page: 78, grammar: ["pastCont1"], vocab: "action verbs", cz: "slovesa činnosti" },
    { id: "u4l34", n: "3 & 4", title: "Best and worst", page: 83, grammar: ["pastCont2"], vocab: "travel and holidays", cz: "cestování a dovolená" },
    { id: "u4l56", n: "5 & 6", title: "Have you ever…?", page: 89, grammar: ["presPerfExp"], vocab: "past participles of irregular verbs", cz: "3. tvary nepravidelných sloves", drill: "irr" },
    { id: "u4l7", n: "7", title: "Listening & Speaking focus", page: 95, grammar: [], vocab: "encouraging others to speak", cz: "povzbuzování k mluvení" },
    { id: "u4l8", n: "8", title: "Review", page: 98, grammar: ["linkingVerbs", "likeIng"], vocab: "", cz: "opakování unitu", review: true },
  ]},
  { id: "u5", n: 5, title: "Natural world", page: 103, lessons: [
    { id: "u5l12", n: "1 & 2", title: "Four seasons in one day", page: 104, grammar: ["goingTo"], vocab: "seasons and weather", cz: "roční období a počasí" },
    { id: "u5l34", n: "3 & 4", title: "The animal world", page: 110, grammar: ["phrasal"], vocab: "animals", cz: "zvířata", drill: "phr" },
    { id: "u5l56", n: "5 & 6", title: "The world around us", page: 116, grammar: ["superlatives"], vocab: "the natural world", cz: "příroda" },
    { id: "u5l7", n: "7", title: "Listening & Speaking focus", page: 122, grammar: [], vocab: "giving a presentation", cz: "prezentace" },
    { id: "u5l8", n: "8", title: "Review", page: 125, grammar: ["pastCont1", "presPerfExp"], vocab: "", cz: "opakování unitu", review: true },
  ]},
  { id: "u6", n: 6, title: "Looking ahead", page: 129, lessons: [
    { id: "u6l12", n: "1 & 2", title: "The future's bright", page: 130, grammar: ["willFuture"], vocab: "science and technology", cz: "věda a technologie" },
    { id: "u6l34", n: "3 & 4", title: "Planning an event", page: 135, grammar: ["willVsPresCont"], vocab: "planning an event", cz: "plánování akce" },
    { id: "u6l56", n: "5 & 6", title: "Personal goals", page: 140, grammar: ["presPerfResult"], vocab: "talking about life goals", cz: "životní cíle" },
    { id: "u6l7", n: "7", title: "Listening & Speaking focus", page: 146, grammar: [], vocab: "agreeing and disagreeing", cz: "souhlas a nesouhlas" },
    { id: "u6l8", n: "8", title: "Review", page: 149, grammar: ["goingTo", "phrasal"], vocab: "", cz: "opakování unitu", review: true },
  ]},
];
export const ALL_LESSONS = COURSE.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u })));
export const findCourseLesson = (id) => ALL_LESSONS.find((l) => l.id === id);
