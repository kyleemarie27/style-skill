import type { WeekContent } from "./types";

/** Weeks 4–13. Week numbers count from the first day of the last period. */
export const T1: WeekContent[] = [
  {
    week: 4,
    headline: "Implantation is done and the pregnancy hormone is rising fast. That's your positive test.",
    size: {
      fruit: { name: "a poppy seed", art: "poppy" },
      object: { name: "a grain of salt", art: "salt" },
      animal: { name: "an ant egg", art: "antEgg" },
    },
    baby: [
      { t: "A tiny ball of cells (the blastocyst) has burrowed into your uterine lining.", why: "Implantation happens about 6–10 days after ovulation." },
      { t: "It's splitting into two groups: one becomes the baby, the other the placenta.", why: "The placenta-to-be starts making hCG, the hormone your test detects." },
      { t: "The amniotic sac and yolk sac are forming. The yolk sac feeds the embryo until the placenta takes over." },
      { t: "hCG roughly doubles every 2–3 days right now.", why: "That's why lines get darker day by day." },
    ],
    body: [
      { t: "You might feel almost nothing yet, or period-like cramps and light spotting.", why: "Implantation can cause both." },
      { t: "Tender, heavy breasts are often the first sign.", why: "Progesterone and estrogen are rising." },
      { t: "Tiredness out of nowhere.", why: "Progesterone has a sedating effect." },
      { t: "Needing to pee more often.", why: "hCG increases blood flow to your pelvis and kidneys." },
      { t: "A metallic taste or a stronger sense of smell." },
    ],
    mind: [
      { t: "Excitement, disbelief and worry all at once. All normal.", why: "It can take weeks for it to feel real." },
      { t: "The urge to take test after test. Many people do." },
    ],
    care: {
      food: [{ t: "If you aren't on a prenatal vitamin yet, start today.", why: "Folic acid matters most in these first weeks." }],
      rest: [{ t: "Celebrate in whatever way feels right: a special dinner, a note to your future self, a quiet moment." }],
    },
    watchouts: [
      { t: "Stop alcohol, smoking and recreational drugs now. Review medications with a pharmacist or doctor." },
      { t: "Sharp one-sided pain or bleeding with dizziness can be an ectopic pregnancy. Get checked the same day." },
    ],
    todo: [
      { t: "Log your positive test in Bloom (done!)." },
      { t: "Call your OB, midwife or family doctor to book your first visit.", why: "Many book it for 8–10 weeks; some do an earlier blood test." },
      { t: "Make sure you're taking a prenatal vitamin with folic acid." },
      { t: "Check your health insurance's maternity coverage." },
    ],
    partner: [
      { t: "Take over anything involving strong smells: cooking, trash, cat litter." },
      { t: "Mark the day. Some couples keep the test, write a letter, or take a photo." },
    ],
    days: [
      "Today your test turned positive. Behind it, a cluster of cells smaller than a poppy seed is settling in.",
      "The placenta's earliest cells are pumping out hCG, roughly doubling every two to three days.",
      "The yolk sac has formed. It's the baby's first lunchbox until the placenta takes over around week 10.",
      "Three layers of cells are organizing: one becomes skin and brain, one heart and muscle, one gut and lungs.",
      "This is a good day to call your doctor's office and get your first appointment on the calendar.",
      "If you feel nothing yet, that's completely normal. Symptoms often start around week 6.",
      "Tomorrow is week 5, when the heart and brain begin. Be gentle with yourself tonight.",
    ],
  },
  {
    week: 5,
    headline: "The heart, brain and spinal cord are starting to form.",
    size: {
      fruit: { name: "a sesame seed", art: "sesame" },
      object: { name: "a pinhead", art: "pin" },
      animal: { name: "a baby ant", art: "ant" },
    },
    baby: [
      { t: "The neural tube (future brain and spine) is forming and will close by the end of week 6.", why: "This is why folic acid matters so much right now." },
      { t: "A simple tube heart starts to form and will soon begin to beat." },
      { t: "The embryo is shaped a bit like a tiny tadpole, with a tail that will disappear." },
    ],
    body: [
      { t: "Your period is officially late." },
      { t: "Sore breasts, darker nipples, and tiredness." },
      { t: "Mild cramping and a bloated feeling.", why: "Your uterus is growing and progesterone slows digestion." },
      { t: "Nausea may start this week or next.", why: "It tracks rising hCG and usually peaks around weeks 8–10." },
    ],
    mind: [
      { t: "Mood swings, like PMS turned up.", why: "Hormones are rising very quickly." },
      { t: "Worry about whether everything is okay. Early weeks often feel like waiting." },
    ],
    care: {
      food: [{ t: "Keep crackers by the bed and eat a few before you stand up." }],
      movement: [{ t: "A daily walk helps energy and mood." }],
    },
    watchouts: [
      { t: "Light spotting is common; heavy bleeding or bleeding with strong pain isn't. Call your doctor about either." },
    ],
    todo: [
      { t: "Write down the first day of your last period. Your doctor will ask (Bloom has it in Settings)." },
      { t: "List your medications and supplements with doses for your first visit." },
      { t: "Start a list of questions for your doctor in Bloom." },
    ],
    partner: [
      { t: "Stock the kitchen with plain, easy snacks: crackers, toast, bananas, ginger chews." },
      { t: "Ask how it all feels emotionally, not just physically." },
    ],
    days: [
      "This week the neural tube, the start of the brain and spinal cord, begins to fold closed.",
      "A tiny heart tube is forming. In a few days it may start to flicker.",
      "Blood vessels are forming, and the first blood cells are made in the yolk sac.",
      "Today's job: take your prenatal and drink an extra glass of water.",
      "The embryo has a little tail right now. It disappears by week 8.",
      "If smells suddenly bother you, that's the hormones. It's one of the most common early signs.",
      "By tomorrow the embryo is about the size of a lentil. Rest is productive work this week.",
    ],
  },
  {
    week: 6,
    headline: "A heartbeat may be visible on ultrasound, and nausea often starts.",
    size: {
      fruit: { name: "a lentil", art: "lentil" },
      object: { name: "a grain of rice", art: "rice" },
      animal: { name: "a ladybug", art: "ladybug" },
    },
    baby: [
      { t: "The heart is beating around 100–120 times a minute, often visible on a transvaginal ultrasound." },
      { t: "Small buds appear that will become arms and legs." },
      { t: "Dark spots mark where the eyes will be; little pits become ears." },
      { t: "The neural tube closes this week." },
    ],
    body: [
      { t: "Morning sickness (which can happen any time of day).", why: "About 70–80% of pregnant people get it." },
      { t: "Exhaustion that a full night's sleep doesn't fix." },
      { t: "Peeing more, including at night." },
      { t: "Bloating and gas; your jeans may feel tight already." },
    ],
    mind: [
      { t: "Feeling unwell and anxious at the same time is a hard combination. Go easy on yourself." },
      { t: "Nausea is often a sign of strong hormone levels, but not having it is also perfectly normal." },
    ],
    care: {
      food: [
        { t: "Eat whatever you can keep down. Bland carbs are fine for now; your prenatal fills the gaps." },
        { t: "Sour or salty snacks (lemon water, pretzels, pickles) help some people." },
      ],
      rest: [{ t: "Nap at lunch if you can, even 15 minutes." }],
    },
    watchouts: [
      { t: "If you can't keep fluids down for 24 hours, or you're peeing very little, call. Hyperemesis is treatable." },
    ],
    todo: [
      { t: "Try B6 (and ask about doxylamine) if nausea is bad. Check the dose with your doctor." },
      { t: "Confirm your first appointment date." },
    ],
    partner: [
      { t: "Bring water and a snack to bed in the morning, before getting up." },
      { t: "Cook (or order) without strong smells: no frying fish or garlic for a while." },
    ],
    days: [
      "This week a heartbeat may show on ultrasound, about twice as fast as yours.",
      "Arm and leg buds are appearing, little paddles that will grow fingers and toes.",
      "The neural tube is closing today or soon. Your folic acid has been doing its job.",
      "Feeling queasy? Try something cold and salty, and a short walk outside.",
      "The face is starting: dark spots for eyes and openings for nostrils.",
      "Tiredness this week is your body building a placenta. That's a big project.",
      "Your baby's heart has beaten about a million times already.",
    ],
  },
  {
    week: 7,
    headline: "The brain is growing fast, and tiny hands and feet are forming.",
    size: {
      fruit: { name: "a blueberry", art: "blueberry" },
      object: { name: "an M&M", art: "candy" },
      animal: { name: "a honeybee", art: "bee" },
    },
    baby: [
      { t: "The brain is making about 100 new nerve cells every minute." },
      { t: "Arm buds are lengthening and forming hand plates." },
      { t: "The kidneys are forming, and the liver is making red blood cells." },
      { t: "The umbilical cord is now carrying oxygen and nutrients." },
    ],
    body: [
      { t: "Nausea, food aversions and cravings.", why: "Often strongest in weeks 7–10." },
      { t: "More saliva than usual, for some people." },
      { t: "Breakouts or oily skin." },
      { t: "Constipation.", why: "Progesterone relaxes your gut muscles." },
    ],
    mind: [
      { t: "Brain fog and forgetfulness. It's real and it's temporary." },
      { t: "Wondering when and how to tell people. There's no wrong answer." },
    ],
    care: {
      food: [{ t: "Prunes, pears, oats and plenty of water for constipation." }],
      movement: [{ t: "Gentle yoga or stretching on low-energy days still counts." }],
    },
    watchouts: [
      { t: "Constipation that comes with severe pain, or no bowel movement for over 4 days: mention it to your doctor." },
    ],
    todo: [
      { t: "Think about who you'll tell before 12 weeks: people who'd support you either way." },
      { t: "Start a photo or journal series if you'd like to remember these weeks." },
    ],
    partner: [
      { t: "Take something off your partner's plate this week: an errand, a dinner, a call." },
      { t: "Read up on the first trimester yourself so the research isn't one person's job." },
    ],
    days: [
      "This week the brain grows by about 100 nerve cells a minute.",
      "Hands are starting as little paddles at the ends of the arms.",
      "The umbilical cord is now working, carrying oxygen and food to the baby.",
      "Today, try ginger tea or ginger chews if you're queasy.",
      "Kidneys are forming. They'll start making urine in a few weeks.",
      "A tiny tongue and the beginnings of teeth buds are forming.",
      "Baby has roughly doubled in size since the start of the week.",
    ],
  },
  {
    week: 8,
    headline: "Baby is moving (you can't feel it yet) and fingers are forming.",
    size: {
      fruit: { name: "a raspberry", art: "raspberry" },
      object: { name: "a gummy bear", art: "gummy" },
      animal: { name: "a newborn kangaroo joey", art: "joey" },
    },
    baby: [
      { t: "Fingers and toes are forming, slightly webbed for now." },
      { t: "Baby makes tiny spontaneous movements, far too small to feel." },
      { t: "The tail is almost gone, and eyelids are forming." },
      { t: "Every major organ has begun to form." },
    ],
    body: [
      { t: "Your uterus has grown from the size of a fist to the size of a large orange." },
      { t: "Nausea is often at its peak around now." },
      { t: "Vivid dreams." },
      { t: "Heartburn may start.", why: "Progesterone relaxes the valve at the top of your stomach." },
    ],
    mind: [
      { t: "The first ultrasound can bring huge relief and big emotions." },
      { t: "If you're feeling flat or low most days, tell your doctor. Depression in pregnancy is common and treatable." },
    ],
    care: {
      food: [{ t: "For heartburn: smaller meals, stay upright after eating, and avoid spicy or fatty foods late at night." }],
      rest: [{ t: "Raise the head of your bed a little if heartburn wakes you." }],
    },
    watchouts: [
      { t: "Antacids like Tums are generally fine for heartburn; check others with your doctor." },
    ],
    todo: [
      { t: "First prenatal visit is coming up (often 8–10 weeks). Review your visit summary in Bloom." },
      { t: "Ask about genetic screening options (NIPT, NT scan) so you can decide in time." },
    ],
    partner: [
      { t: "Come to the first appointment if you can. Hearing the heartbeat together is special." },
    ],
    days: [
      "This week baby starts making tiny movements. Too small to feel, but they're happening.",
      "Fingers and toes are forming, with a little webbing between them for now.",
      "The tail has nearly disappeared. Baby looks more like a baby every day.",
      "Today, write down three questions for your first appointment.",
      "Eyelids are forming, and the tip of the nose is visible.",
      "Your uterus is now about the size of a large orange.",
      "Every major organ has begun to form. The rest of pregnancy is growing and refining.",
    ],
  },
  {
    week: 9,
    headline: "No longer an embryo, almost a fetus. The heart has four chambers.",
    size: {
      fruit: { name: "a cherry", art: "cherry" },
      object: { name: "a quarter", art: "quarter" },
      animal: { name: "a tadpole", art: "tadpole" },
    },
    baby: [
      { t: "The heart has divided into four chambers, and the valves are forming." },
      { t: "Tiny muscles are forming so baby can wiggle arms and legs." },
      { t: "Ears, upper lip and nose tip are taking shape." },
      { t: "The placenta is getting ready to take over from the yolk sac." },
    ],
    body: [
      { t: "Your waist may be thickening, and bras feel tight." },
      { t: "Mood swings, fatigue and nausea are still in full swing." },
      { t: "Headaches.", why: "Hormones, more blood volume, and less caffeine can all contribute." },
      { t: "Visible veins on your chest and belly.", why: "Your body is carrying more blood." },
    ],
    mind: [
      { t: "Feeling more like 'this is happening' after seeing or hearing the heartbeat." },
    ],
    care: {
      food: [{ t: "Water and a snack first if you get a headache; acetaminophen if you need it." }],
      rest: [{ t: "Invest in a comfortable, stretchy bra. It makes a real difference." }],
    },
    watchouts: [
      { t: "A headache with fever, a stiff neck or vision changes needs a call." },
    ],
    todo: [
      { t: "If you're having NIPT, it can usually be done from 10 weeks; ask at your visit." },
      { t: "Ask your doctor which prenatal vitamin and dose they recommend." },
    ],
    partner: [
      { t: "Plan a low-key evening: a favorite comfort food and an early night." },
    ],
    days: [
      "This week the heart finishes dividing into four chambers.",
      "Muscles are forming, and baby can now bend at the elbows.",
      "Tiny ears are taking shape on the sides of the head.",
      "Today, give yourself a real break: 20 minutes doing nothing at all.",
      "The placenta is preparing to take over feeding the baby next week.",
      "Your blood volume is up noticeably; that's the visible veins and extra thirst.",
      "Tomorrow baby graduates from embryo to fetus.",
    ],
  },
  {
    week: 10,
    headline: "Officially a fetus. The riskiest weeks are behind you.",
    size: {
      fruit: { name: "a strawberry", art: "strawberry" },
      object: { name: "a paperclip", art: "paperclip" },
      animal: { name: "a tree frog", art: "frog" },
    },
    baby: [
      { t: "Baby is now called a fetus: all the organs are in place and starting to work." },
      { t: "Fingers and toes have separated, and tiny nails are starting." },
      { t: "Bones and cartilage are forming." },
      { t: "Baby can swallow and kick, though you won't feel it for weeks." },
    ],
    body: [
      { t: "Your belly may pop slightly, often bloating more than baby." },
      { t: "Round ligament twinges: brief, sharp pains low in your belly when you move." },
      { t: "Nausea may start to ease for some people." },
      { t: "More vaginal discharge (clear or milky, mild smell).", why: "More estrogen and blood flow." },
    ],
    mind: [
      { t: "Relief as the miscarriage risk drops, mixed with impatience for 12 weeks." },
    ],
    care: {
      food: [{ t: "As appetite returns, add colorful vegetables and protein back in." }],
      movement: [{ t: "If you've been resting a lot, start easing back into regular walks." }],
    },
    watchouts: [
      { t: "Discharge that's green, gray, strong-smelling, itchy or burning: tell your doctor." },
    ],
    todo: [
      { t: "NIPT (cell-free DNA) blood test is available from 10 weeks, if you want it." },
      { t: "Book the NT scan (11–14 weeks) if your practice offers it." },
    ],
    partner: [
      { t: "Start thinking about how you'll share the news, when you're both ready." },
    ],
    days: [
      "This week baby officially becomes a fetus. The organs are formed and starting to work.",
      "Fingers have separated. Tiny fingernails are beginning.",
      "Baby can swallow now, practicing with amniotic fluid.",
      "Today, if nausea has eased, add one extra vegetable to a meal.",
      "Bones are forming. Knees and ankles can bend.",
      "The placenta is now doing most of the work of feeding the baby.",
      "After 10 weeks, the chance of miscarriage is much lower.",
    ],
  },
  {
    week: 11,
    headline: "Baby is busy: hiccupping, stretching and forming tooth buds.",
    size: {
      fruit: { name: "a fig", art: "fig" },
      object: { name: "a golf ball", art: "golfball" },
      animal: { name: "a baby sea turtle", art: "turtle" },
    },
    baby: [
      { t: "Baby can open and close fists and may hiccup." },
      { t: "Tooth buds and hair follicles are forming." },
      { t: "The head is still about half of baby's length." },
      { t: "The diaphragm is forming, so breathing movements can start." },
    ],
    body: [
      { t: "Energy may start to come back, little by little." },
      { t: "Heartburn and constipation can stick around." },
      { t: "Your hair may look thicker.", why: "Estrogen slows normal shedding." },
      { t: "Dizzy spells when you stand quickly." },
    ],
    mind: [
      { t: "Starting to plan, research and dream a little more." },
    ],
    care: {
      food: [{ t: "Snack on nuts, cheese and fruit to keep your blood sugar steady and avoid dizziness." }],
      movement: [{ t: "Strength training is safe if you're used to it; skip heavy straining." }],
    },
    watchouts: [
      { t: "Feeling faint often, or fainting: tell your doctor." },
    ],
    todo: [
      { t: "NT scan window opens (11–14 weeks)." },
      { t: "Look into your workplace's parental leave policy, quietly if needed." },
    ],
    partner: [
      { t: "Look into your own parental leave options." },
    ],
    days: [
      "This week baby can hiccup. You won't feel it, but it's happening.",
      "Tooth buds are forming under the gums.",
      "Baby can open and close tiny fists.",
      "Today, stand up slowly and keep a snack in your bag.",
      "Hair follicles are forming all over baby's body.",
      "Baby's head is about half the length of their body right now.",
      "Next week the end of the first trimester is in sight.",
    ],
  },
  {
    week: 12,
    headline: "Reflexes are working, and many people start to share their news.",
    size: {
      fruit: { name: "a lime", art: "lime" },
      object: { name: "an egg", art: "egg" },
      animal: { name: "a newborn hedgehog", art: "hedgehog" },
    },
    baby: [
      { t: "Reflexes: baby will curl fingers, squint and suck if touched." },
      { t: "Kidneys are making urine." },
      { t: "The intestines move into the abdomen from the umbilical cord." },
      { t: "The pituitary gland starts making hormones." },
    ],
    body: [
      { t: "Your uterus rises above your pubic bone; your doctor may feel it." },
      { t: "Nausea and fatigue often start to lift around now." },
      { t: "Darker skin patches or a line down your belly may appear.", why: "Pregnancy hormones stimulate pigment." },
    ],
    mind: [
      { t: "Excitement about telling people, or wanting to keep it private longer. Both are fine." },
    ],
    care: {
      rest: [{ t: "Use sunscreen daily.", why: "Melasma (dark patches on the face) gets worse with sun." }],
    },
    watchouts: [
      { t: "If you're Rh-negative and have any bleeding, tell your doctor; you may need a shot." },
    ],
    todo: [
      { t: "Get NIPT and NT results back and ask what they mean." },
      { t: "Decide when and how to tell work. You don't have to rush." },
    ],
    partner: [
      { t: "Plan the announcement together: who first, how, and what's off-limits to share." },
    ],
    days: [
      "This week baby has reflexes: fingers curl, toes flex, and the mouth makes sucking motions.",
      "Kidneys are working, and baby is making urine.",
      "The intestines are moving into place inside the belly.",
      "Today, put on sunscreen. Pregnancy makes skin more sensitive to sun.",
      "Baby's face looks more human: eyes moving to the front, ears near their final spot.",
      "Your uterus has risen out of your pelvis. Some people start to show.",
      "One more week until the second trimester.",
    ],
  },
  {
    week: 13,
    headline: "The last week of the first trimester. Fingerprints are forming.",
    size: {
      fruit: { name: "a lemon", art: "lemon" },
      object: { name: "a tube of lip balm", art: "lipbalm" },
      animal: { name: "a hummingbird", art: "hummingbird" },
    },
    baby: [
      { t: "Fingerprints are forming on tiny fingertips." },
      { t: "Vocal cords are developing." },
      { t: "The body is starting to catch up with the head." },
      { t: "Bones are hardening, especially in the skull and long bones." },
    ],
    body: [
      { t: "Energy returning, nausea fading for many." },
      { t: "Your appetite may come back strong." },
      { t: "A small bump, or just a thicker waist." },
      { t: "Clear or white discharge continues." },
    ],
    mind: [
      { t: "A sense of relief and a new chapter starting." },
    ],
    care: {
      food: [{ t: "Build meals around protein, fiber and color now that food appeals again." }],
      movement: [{ t: "Good time to start a prenatal yoga or swim routine." }],
    },
    watchouts: [
      { t: "Nausea that's getting worse instead of better after 13 weeks: tell your doctor." },
    ],
    todo: [
      { t: "Start thinking about maternity clothes, or borrowing some." },
      { t: "Make a rough budget for the next year." },
    ],
    partner: [
      { t: "Celebrate the end of the first trimester together. You both made it through." },
    ],
    days: [
      "This week fingerprints are forming. They're already unique.",
      "Vocal cords are developing, for a voice you'll hear in about six months.",
      "Baby's body is catching up to the head.",
      "Today, notice one thing that feels easier than a few weeks ago.",
      "Baby can bring a thumb to the mouth.",
      "The placenta is now fully in charge of feeding, oxygen and hormones.",
      "Tomorrow starts the second trimester. You've done the hardest stretch.",
    ],
  },
];
