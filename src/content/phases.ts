import type { Phase, Today } from "../../shared/cycle";

/**
 * The daily-note library. Each tip is a short line plus an optional "why" (the hormone or
 * evidence behind it). Lists rotate by cycle day so the top few change from day to day.
 * General information written to be gentle and practical, not medical advice.
 */
export interface Item {
  t: string;
  why?: string;
}

export interface PhaseContent {
  title: string;
  tagline: string;
  hormones: string;
  expect: { body: Item[]; mind: Item[] };
  superpowers: Item[];
  watchouts: Item[];
  care: { food: Item[]; movement: Item[]; rest: Item[] };
  makeTheMost: { work: Item[]; social: Item[]; relationship: Item[] };
  ttc: Item[];
}

export const PHASES: Record<Phase, PhaseContent> = {
  menstrual: {
    title: "Menstrual phase",
    tagline: "Your winter: rest, reset and let the new cycle begin.",
    hormones: "Estrogen and progesterone are at their lowest. The uterine lining sheds, and prostaglandins cause the cramping.",
    expect: {
      body: [
        { t: "Cramps and a heavy, achy lower belly or back, strongest on days 1–2.", why: "Prostaglandins make the uterus contract to shed its lining." },
        { t: "Lower energy and a pull toward more sleep.", why: "Low hormones plus blood loss; iron can dip too." },
        { t: "Looser digestion or more trips to the bathroom.", why: "The same prostaglandins act on the bowel." },
        { t: "Headaches as estrogen bottoms out.", why: "Estrogen withdrawal is a common migraine trigger." },
        { t: "Bloating easing off over the first couple of days.", why: "Progesterone, which holds on to water, has dropped." },
        { t: "Feeling colder than usual.", why: "Body temperature falls back to its pre-ovulation baseline." },
      ],
      mind: [
        { t: "Relief: many people feel mood lift once bleeding starts.", why: "The PMS-driving hormone drop is over." },
        { t: "Inward, reflective, less up for socializing.", why: "Energy is low and your brain is in a quieter, evaluative mode." },
        { t: "Sharper intuition and quick gut reactions.", why: "Many people report clearer 'that's not working' signals this week." },
        { t: "A short fuse on day 1 if cramps are bad.", why: "Pain plus fatigue lowers stress tolerance." },
      ],
    },
    superpowers: [
      { t: "Clear-eyed review: notice what's working and what isn't.", why: "Both brain hemispheres communicate well now, which helps with evaluating." },
      { t: "Saying no and protecting your time.", why: "You have less energy to people-please." },
      { t: "Setting intentions for the cycle ahead.", why: "It's a natural reset point." },
      { t: "Honest conversations, delivered calmly.", why: "You're less reactive once the PMS days are behind you." },
      { t: "Listening to your body's signals.", why: "Low energy makes it obvious what you actually need." },
    ],
    watchouts: [
      { t: "Iron: replace what you're losing.", why: "Low iron causes fatigue and can affect fertility. Pair iron foods with vitamin C." },
      { t: "Don't schedule your most draining meetings on days 1–2 if you can help it." },
      { t: "Hard HIIT can feel punishing. Lighter training is fine and still counts." },
      { t: "Ibuprofen works best taken early, at the first twinge.", why: "It blocks prostaglandin production; it works less well once cramps are full-blown." },
      { t: "Soaking a pad or tampon every 1–2 hours, clots bigger than a quarter, or severe pain: call your doctor." },
      { t: "Skipped meals make cramps and moods worse." },
    ],
    care: {
      food: [
        { t: "Iron-rich foods: lentils, beans, spinach, red meat, eggs.", why: "Replaces iron lost in bleeding." },
        { t: "Add vitamin C (citrus, berries, peppers) to iron meals.", why: "Vitamin C boosts iron absorption several-fold." },
        { t: "Magnesium: pumpkin seeds, almonds, dark chocolate, leafy greens.", why: "May ease cramps and help sleep." },
        { t: "Warm, easy meals: soups, stews, oats.", why: "Gentler on a sensitive gut." },
        { t: "Ginger tea.", why: "Ginger has shown cramp relief similar to ibuprofen in small trials." },
        { t: "Plenty of water.", why: "Helps with headaches and bloating." },
      ],
      movement: [
        { t: "Walking, gentle yoga or stretching.", why: "Light movement increases blood flow and can ease cramps." },
        { t: "Child's pose, cat-cow and knees-to-chest for back and belly ache." },
        { t: "Save PR attempts for next week; strength work at a lighter load is fine." },
        { t: "Rest days count as training." },
      ],
      rest: [
        { t: "Heat on your belly or lower back.", why: "Heat relaxes uterine muscle; it's as effective as some pain relievers." },
        { t: "An earlier bedtime and a no-plans evening." },
        { t: "A warm bath or shower before bed." },
        { t: "Keep tomorrow's to-do list short." },
      ],
    },
    makeTheMost: {
      work: [
        { t: "Review, edit and plan rather than start big new things." },
        { t: "Batch admin: inbox zero, expenses, scheduling." },
        { t: "Plan the next two weeks while your judgment is clear; energy rises soon." },
        { t: "Decide what to drop from your plate." },
      ],
      social: [
        { t: "Low-key plans: a movie at home, a walk with one friend." },
        { t: "Give yourself permission to cancel." },
        { t: "Journal: what do you want this cycle to feel like?" },
      ],
      relationship: [
        { t: "Ask for what helps: a heat pack, dinner sorted, a quiet night." },
        { t: "Closeness without pressure. Cuddles count." },
        { t: "Debrief last cycle together, gently, if it was a hard one." },
      ],
    },
    ttc: [
      { t: "Log day 1 so Bloom can time your fertile window.", why: "Every prediction is counted from day 1." },
      { t: "Keep taking a prenatal with folate (400–800 mcg) every day.", why: "Folate protects early neural tube development, often before you know you're pregnant." },
      { t: "Restock ovulation strips so you're ready to start testing around day {lhStart}." },
      { t: "If last cycle was a disappointment, let yourself feel it. Showing up again is the hard part." },
      { t: "Alcohol and smoking both lower fertility; this is a good week to reset habits for both partners." },
    ],
  },

  follicular: {
    title: "Follicular phase",
    tagline: "Your spring: energy is rising and so is your optimism.",
    hormones: "FSH grows a few follicles; the lead follicle pumps out rising estrogen, which lifts mood, energy and focus.",
    expect: {
      body: [
        { t: "Energy and stamina climbing day by day.", why: "Rising estrogen improves insulin sensitivity and muscle recovery." },
        { t: "Clearer, brighter skin.", why: "Estrogen boosts collagen and skin hydration." },
        { t: "Better sleep and easier mornings." },
        { t: "Appetite steady or a little lower.", why: "Estrogen has a mild appetite-suppressing effect." },
        { t: "Cervical mucus moving from dry to sticky to creamy.", why: "Estrogen tells the cervix to make more, wetter mucus as ovulation nears." },
        { t: "Workouts feel easier and you recover faster." },
      ],
      mind: [
        { t: "Optimism, motivation and a 'let's go' feeling." },
        { t: "Curious and open to new ideas and people." },
        { t: "Faster learning and a better memory for new information.", why: "Estrogen supports the hippocampus." },
        { t: "More resilient to stress." },
      ],
    },
    superpowers: [
      { t: "Brainstorming and big-picture thinking." },
      { t: "Learning new skills. Your brain soaks things up now." },
      { t: "Starting projects and taking on challenges." },
      { t: "Strength gains: a great time to push training.", why: "Research suggests follicular-phase strength training may build more muscle." },
      { t: "Networking and making new connections." },
    ],
    watchouts: [
      { t: "It's easy to overcommit when you feel great. Leave buffer for the second half of your cycle." },
      { t: "Don't skip meals because you're busy. Steady fuel keeps the energy going." },
      { t: "Caffeine: keep it under 200 mg a day (about two small coffees) while trying.", why: "Higher intake is linked to slightly higher miscarriage risk." },
      { t: "Hydrate before hard workouts; you'll push harder than you realize." },
      { t: "Don't pack your calendar into the two-week wait." },
    ],
    care: {
      food: [
        { t: "Fresh, light foods: salads, grains, lean protein, fermented foods." },
        { t: "Cruciferous veg (broccoli, kale, cabbage).", why: "Supports healthy estrogen metabolism." },
        { t: "Omega-3s: salmon, sardines, walnuts, chia.", why: "Linked to better egg quality in some studies." },
        { t: "Protein at every meal to fuel harder training." },
        { t: "Colorful fruit and veg for antioxidants.", why: "Eggs mature over about 90 days, and antioxidants help protect them." },
      ],
      movement: [
        { t: "Strength training, intervals, a new class: your best training window." },
        { t: "Try for a personal best this week." },
        { t: "Mix in mobility so you don't get stiff from harder sessions." },
        { t: "Outdoor runs or rides, with morning light as a bonus." },
      ],
      rest: [
        { t: "Morning light within an hour of waking.", why: "It anchors your body clock, which supports sleep and hormone rhythms." },
        { t: "Consistent bedtimes, even when you feel like staying up." },
        { t: "A quick weekly reset: plan meals and the week ahead." },
      ],
    },
    makeTheMost: {
      work: [
        { t: "Kick off the project, pitch the idea, start the course." },
        { t: "Brainstorming sessions and strategy work." },
        { t: "Tackle the thing you've been avoiding; it feels easier now." },
        { t: "Learn something hard." },
      ],
      social: [
        { t: "Say yes to new people and plans." },
        { t: "Try somewhere new: a restaurant, class or neighborhood." },
        { t: "Plan a fun date for the fertile window ahead." },
      ],
      relationship: [
        { t: "Plan together: what's the 'baby-making' week going to look like?" },
        { t: "Keep intimacy playful and unscheduled now, so it doesn't feel like a chore later." },
        { t: "Share the fertility to-dos with your partner." },
      ],
    },
    ttc: [
      { t: "Start LH testing around cycle day {lhStart}. Afternoons (2–8pm) catch the surge best.", why: "LH is made in the morning and shows up in urine a few hours later." },
      { t: "Check cervical mucus daily. Watch for it turning creamy, then wet and slippery." },
      { t: "Sex every 2–3 days keeps sperm healthy and on standby.", why: "Long gaps let older, less mobile sperm build up." },
      { t: "Your fertile window is predicted to open in {daysToFertile} days." },
      { t: "Partner health matters too: no hot tubs, laptops off laps, and a multivitamin.", why: "Sperm take about 70 days to develop and are sensitive to heat." },
    ],
  },

  fertile: {
    title: "Fertile window",
    tagline: "Your summer begins: peak confidence, peak connection.",
    hormones: "Estrogen is near its peak and testosterone gets a small bump. LH is starting to rise toward the surge.",
    expect: {
      body: [
        { t: "Higher libido, right on cue.", why: "The estrogen and testosterone peak boosts desire." },
        { t: "Cervical mucus gets wetter and stretchier, like raw egg white at its most fertile.", why: "Fertile mucus helps sperm swim and survive." },
        { t: "LH strips getting darker. Watch for High readings." },
        { t: "Mild one-sided pelvic twinges as a follicle grows." },
        { t: "Skin glowing and energy high." },
        { t: "A slightly higher cervix that feels softer, if you check." },
      ],
      mind: [
        { t: "Confident, social and articulate.", why: "Estrogen supports verbal fluency." },
        { t: "Feeling attractive and magnetic." },
        { t: "Some pressure or anxiety about timing, which is completely normal." },
        { t: "More impulsive than usual." },
      ],
    },
    superpowers: [
      { t: "Communication: conversations, negotiations and presentations land well." },
      { t: "Magnetism: you tend to feel, and come across as, more confident." },
      { t: "Collaboration and hard conversations." },
      { t: "Big asks: pitch, interview, or ask for the raise." },
      { t: "Connection: empathy and warmth come naturally." },
    ],
    watchouts: [
      { t: "Don't let timing pressure kill the fun. Keep it connected, not clinical." },
      { t: "Many lubricants are sperm-unfriendly. Use a fertility-friendly one if you need one.", why: "Common lubes can slow sperm down." },
      { t: "Skip hot tubs and saunas for your partner this week." },
      { t: "Impulse spending and over-promising. You feel invincible now." },
      { t: "Don't wait for a positive test to start having sex.", why: "The two days before ovulation are the most fertile." },
    ],
    care: {
      food: [
        { t: "Hydrate well.", why: "Water helps your body make fertile cervical mucus." },
        { t: "Zinc foods (pumpkin seeds, beef, chickpeas) for both partners.", why: "Zinc supports sperm health and ovulation." },
        { t: "Fiber and leafy greens to support estrogen balance." },
        { t: "Easy, quick meals so dinner doesn't get in the way of date night." },
      ],
      movement: [
        { t: "Keep training strong, but don't run yourself into the ground." },
        { t: "Group classes, dance, team sports. Social movement feels great now." },
        { t: "Watch your knees in plyometric work.", why: "Some research links peak-estrogen days to looser ligaments." },
      ],
      rest: [
        { t: "Protect sleep; it's easy to stay up late when you're buzzing." },
        { t: "Wind down with something calming if timing anxiety creeps in." },
        { t: "Leave space in your evenings this week." },
      ],
    },
    makeTheMost: {
      work: [
        { t: "Presentations, pitches and tricky conversations." },
        { t: "Networking and reaching out to new contacts." },
        { t: "Record the video, do the podcast, give the talk." },
      ],
      social: [
        { t: "Plan something social or celebratory." },
        { t: "Reconnect with people you've lost touch with." },
      ],
      relationship: [
        { t: "Plan date nights: dinner, dancing, anything that feels like you two." },
        { t: "Flirt during the day; it makes evenings easier." },
        { t: "Talk openly if the schedule is stressing either of you." },
      ],
    },
    ttc: [
      { t: "Fertile window day {fertileDay} of {fertileLength}: aim for sex today or every other day.", why: "Every 1–2 days through the window gives about the same odds as daily." },
      { t: "Test LH twice a day (around 2pm and 8pm) so you don't miss a short surge." },
      { t: "The 2 days before ovulation are the most fertile. Don't wait for a positive test." },
      { t: "Sperm can live up to 5 days, so sex now still counts toward ovulation day." },
      { t: "Egg-white mucus is your body's own fertility signal. Log it when you see it." },
    ],
  },

  ovulation: {
    title: "Ovulation",
    tagline: "Peak summer: this is the main event.",
    hormones: "The LH surge triggers the egg's release within about 24–36 hours. Estrogen peaks, then dips; progesterone starts rising.",
    expect: {
      body: [
        { t: "LH strips at High or Peak, with the test line as dark as or darker than control." },
        { t: "Egg-white cervical mucus, at its most slippery." },
        { t: "A mild one-sided cramp (mittelschmerz) that can last minutes or hours." },
        { t: "Light spotting for some people.", why: "A brief estrogen dip at ovulation." },
        { t: "Breast tenderness and bloating starting as progesterone rises." },
        { t: "BBT rises 0.3–0.5°F a day or so after ovulation, confirming it." },
      ],
      mind: [
        { t: "Confidence and libido at their highest." },
        { t: "A brief dip in mood for some people as estrogen drops right after." },
        { t: "Timing pressure. Breathe; the day before counts just as much." },
      ],
    },
    superpowers: [
      { t: "Charisma: social energy and verbal skills peak." },
      { t: "Courage: ask for what you want." },
      { t: "Intimacy and empathy come naturally." },
      { t: "Persuasion: a great day to sell an idea." },
    ],
    watchouts: [
      { t: "If you've only seen High (not Peak), keep testing. Some surges are short." },
      { t: "Sharp, severe or one-sided pain that won't ease isn't typical. Call your doctor." },
      { t: "Don't treat today as all-or-nothing; yesterday and the day before count too." },
      { t: "Lube and heat watch-outs still apply." },
    ],
    care: {
      food: [
        { t: "Protein and fiber to steady the post-peak estrogen dip." },
        { t: "Keep drinking water." },
        { t: "A treat is fine. This is a celebration week." },
      ],
      movement: [
        { t: "Whatever feels good. Energy is still high." },
        { t: "Gentle stretching if ovulation pain shows up." },
      ],
      rest: [
        { t: "A good night's sleep tonight." },
        { t: "Heat for one-sided ovulation cramps." },
        { t: "Plan something relaxing so the day doesn't feel like a test." },
      ],
    },
    makeTheMost: {
      work: [
        { t: "The big conversation, the pitch, the raise." },
        { t: "Collaborative work and team decisions." },
      ],
      social: [
        { t: "Say yes to the social thing." },
        { t: "Celebrate something: a win, a friend, yourself." },
      ],
      relationship: [
        { t: "Make tonight about connection, not just timing." },
        { t: "Tell your partner what you appreciate about them." },
      ],
    },
    ttc: [
      { t: "Prime time: sex today and tomorrow gives the best odds." },
      { t: "Got a Peak? Ovulation is likely in the next 24–36 hours. Log it so Bloom can confirm your window." },
      { t: "After a Peak you can stop testing LH for this cycle." },
      { t: "Lying down for 10–15 minutes afterwards won't hurt and might help." },
      { t: "Track BBT for the next few mornings if you want confirmation of ovulation." },
    ],
  },

  tww_early: {
    title: "Two-week wait: early luteal",
    tagline: "Your autumn begins: settle in and nest.",
    hormones: "The empty follicle becomes the corpus luteum and pumps out progesterone to prepare the uterine lining.",
    expect: {
      body: [
        { t: "Feeling warmer and a little sleepier.", why: "Progesterone raises body temperature and is mildly sedating." },
        { t: "Breast tenderness and bloating. This happens whether or not you're pregnant." },
        { t: "Appetite creeping up.", why: "Your body burns slightly more energy in the luteal phase." },
        { t: "Cervical mucus drying up or turning sticky." },
        { t: "Slower digestion and maybe constipation.", why: "Progesterone relaxes smooth muscle, including the gut." },
      ],
      mind: [
        { t: "Calmer, steadier, more inward." },
        { t: "The urge to symptom-spot. Very normal." },
        { t: "Good focus for detail work." },
      ],
    },
    superpowers: [
      { t: "Focus and follow-through: great for finishing what you started." },
      { t: "Detail work: editing, organizing, tying up loose ends." },
      { t: "A calm, steady mood for many people." },
      { t: "Nesting energy at home." },
    ],
    watchouts: [
      { t: "Early 'symptoms' are almost all progesterone, pregnant or not. Try not to read into them." },
      { t: "Avoid alcohol and keep caffeine moderate, as if you might be pregnant." },
      { t: "Skip early tests. A negative now means nothing and can sting.", why: "hCG isn't made until after implantation, usually 6–10 DPO." },
      { t: "Hot tubs and saunas: skip them for now." },
      { t: "Check any medications with your doctor or pharmacist." },
    ],
    care: {
      food: [
        { t: "Complex carbs and protein to keep blood sugar steady." },
        { t: "Fiber and water for progesterone-slowed digestion." },
        { t: "Well-cooked meat and fish, pasteurized dairy.", why: "Standard pregnancy food safety, just in case." },
        { t: "Keep taking your prenatal." },
      ],
      movement: [
        { t: "Moderate exercise is great: walking, Pilates, steady strength work." },
        { t: "You don't need to rest just in case.", why: "Normal exercise doesn't affect implantation." },
        { t: "Yoga or swimming if you feel bloated." },
      ],
      rest: [
        { t: "Plan distractions you'll actually enjoy for the next two weeks." },
        { t: "A slightly earlier bedtime; you may need it." },
        { t: "Limit fertility forums if they spike your anxiety." },
      ],
    },
    makeTheMost: {
      work: [
        { t: "Finish projects and tie up loose ends." },
        { t: "Deep-focus work blocks." },
        { t: "Organize systems and files." },
      ],
      social: [
        { t: "Cozy plans: dinner at home, a book club, a craft." },
        { t: "Time with friends who don't ask about the baby plan." },
      ],
      relationship: [
        { t: "Plan something for the two of you that isn't about the wait." },
        { t: "Agree together on when you'll test." },
      ],
    },
    ttc: [
      { t: "{dpo} DPO. If an egg was fertilized, it's travelling toward the uterus right now." },
      { t: "Implantation usually happens 6–10 DPO, so testing is still too early." },
      { t: "Keep taking your prenatal." },
      { t: "Decide your test day now ({testDate} or later) to ease the temptation." },
    ],
  },

  tww_mid: {
    title: "Two-week wait: mid luteal",
    tagline: "Steady autumn: progesterone is at its peak.",
    hormones: "Progesterone peaks, with a second, smaller estrogen rise. If an embryo implants, it starts making hCG.",
    expect: {
      body: [
        { t: "Bloating, breast tenderness and tiredness at their most noticeable." },
        { t: "Light spotting or cramping around 6–10 DPO for some people.", why: "It can be implantation, or nothing at all." },
        { t: "Cravings starting to show up." },
        { t: "Lighter or more broken sleep." },
        { t: "Your skin might get oilier." },
      ],
      mind: [
        { t: "Hope and worry taking turns. Both are normal." },
        { t: "Anxiety creeping up mid-wait." },
        { t: "Good at details, less patient with chaos." },
      ],
    },
    superpowers: [
      { t: "Getting things done: admin and systems feel satisfying." },
      { t: "Nesting energy: home projects and meal prep." },
      { t: "Quality control: your inner editor is sharp." },
      { t: "Following through on routines." },
    ],
    watchouts: [
      { t: "Name the anxiety, then do something kind for yourself." },
      { t: "Snack before you're starving.", why: "Blood sugar swings hit harder in the luteal phase." },
      { t: "Testing now often gives false negatives. Hold off if you can." },
      { t: "Don't make big decisions on a low-mood day." },
    ],
    care: {
      food: [
        { t: "Magnesium and B6 foods: bananas, salmon, chickpeas, spinach.", why: "May ease PMS-type symptoms." },
        { t: "Regular meals with protein to steady mood." },
        { t: "Dark chocolate counts." },
        { t: "Limit very salty food if you're bloated." },
      ],
      movement: [
        { t: "Gentle exercise: walks, yoga, swimming." },
        { t: "Lower intensity if you feel flat; that's normal now." },
        { t: "Stretch before bed for better sleep." },
      ],
      rest: [
        { t: "An earlier wind-down at night." },
        { t: "Lower the bar on social plans if you're depleted." },
        { t: "Something absorbing (a book, puzzle or project) makes the wait fly." },
      ],
    },
    makeTheMost: {
      work: [
        { t: "Tasks that need attention to detail." },
        { t: "Plan next week and meal-prep." },
        { t: "Finish rather than start." },
      ],
      social: [
        { t: "Small, comfortable plans with close friends." },
        { t: "A day trip or outing to break up the wait." },
      ],
      relationship: [
        { t: "Check in with each other about how the wait feels." },
        { t: "Plan a treat for test day, whatever the result." },
      ],
    },
    ttc: [
      { t: "{dpo} DPO: the implantation window. Nothing to do but be kind to yourself." },
      { t: "Earliest reliable test: around {testDate}." },
      { t: "Keep logging how you feel. It's useful pattern data either way." },
    ],
  },

  tww_late: {
    title: "Two-week wait: late luteal",
    tagline: "Late autumn: turn inward and be gentle.",
    hormones: "Without pregnancy, progesterone and estrogen fall, which brings on PMS. With pregnancy, hCG keeps them up.",
    expect: {
      body: [
        { t: "PMS-type symptoms: bloating, cravings, breakouts, sore breasts." },
        { t: "Tiredness. Pregnancy and PMS look the same at this point." },
        { t: "Headaches as hormones shift." },
        { t: "Your temperature staying high if you're pregnant, or dropping just before your period." },
      ],
      mind: [
        { t: "Irritability, sensitivity or low mood.", why: "Falling hormones affect serotonin." },
        { t: "More sensitive to stress and to sleep loss." },
        { t: "Test anxiety." },
      ],
    },
    superpowers: [
      { t: "Truth-telling: you notice what's not working. Write it down for next week." },
      { t: "Wrapping up: closing loops feels great." },
      { t: "Self-awareness and honest reflection." },
      { t: "Setting boundaries." },
    ],
    watchouts: [
      { t: "Decide your test day in advance and stick to it." },
      { t: "Don't make big decisions on the hardest PMS day." },
      { t: "Salty and sugary cravings can worsen bloating and mood dips." },
      { t: "Mood that tanks every cycle and affects daily life is worth raising with your doctor.", why: "PMDD is common and treatable." },
    ],
    care: {
      food: [
        { t: "Warm, grounding meals and complex carbs.", why: "Carbs support serotonin." },
        { t: "Calcium foods (yogurt, cheese, fortified milks).", why: "Shown to reduce PMS symptoms." },
        { t: "Cut back on caffeine if you're anxious or not sleeping." },
        { t: "Have a comforting snack plan instead of grazing." },
      ],
      movement: [
        { t: "Easy movement; even a 20-minute walk lifts mood." },
        { t: "Restorative yoga or stretching." },
      ],
      rest: [
        { t: "Extra sleep, a bath, fewer obligations." },
        { t: "Tell your partner or a friend how you're feeling." },
        { t: "Screens off a bit earlier." },
      ],
    },
    makeTheMost: {
      work: [
        { t: "Clean out, close out, cancel what drains you." },
        { t: "Solo work over big group sessions." },
        { t: "Rest is productive this week." },
      ],
      social: [
        { t: "Low-key plans only." },
        { t: "Comfort-watch something you love." },
      ],
      relationship: [
        { t: "Ask for patience and tell them why." },
        { t: "Plan test morning together if you want company." },
      ],
    },
    ttc: [
      { t: "{dpo} DPO. A first-morning test from {testDate} is reasonably reliable." },
      { t: "If you test negative but your period hasn't come, test again in 2 days." },
      { t: "Whatever the result, you did everything right this cycle." },
    ],
  },

  late: {
    title: "Period due",
    tagline: "Your period is due. Time to find out.",
    hormones: "If your period hasn't come, hCG may be holding progesterone up.",
    expect: {
      body: [
        { t: "Either PMS winding into your period, or a missed period." },
        { t: "Cramping, tiredness and breast tenderness can mean either." },
      ],
      mind: [{ t: "Hope and nerves at the same time." }],
    },
    superpowers: [{ t: "Resilience: you've made it through the wait." }],
    watchouts: [
      { t: "Cycles vary by a few days even when regular. A late period alone isn't a diagnosis." },
      { t: "Several negative tests and no period for over a week: check in with your doctor." },
    ],
    care: {
      food: [{ t: "Eat something comforting and steady." }],
      movement: [{ t: "A gentle walk to clear your head." }],
      rest: [
        { t: "Be extra gentle with yourself today, whichever way it goes." },
        { t: "Plan something comforting for this evening." },
      ],
    },
    makeTheMost: {
      work: [{ t: "Keep your schedule light if you can." }],
      social: [{ t: "Have one person you can text, whatever the result." }],
      relationship: [{ t: "Decide together how you want to find out." }],
    },
    ttc: [
      { t: "Time to test: use first-morning urine." },
      { t: "Positive? Log it, then call your doctor to book your first appointment. 💛" },
      { t: "Period arrived? Log day 1 and Bloom starts the next cycle's predictions." },
    ],
  },

  unknown: {
    title: "Welcome to Bloom",
    tagline: "Log your last period (or import your history) to unlock your daily note.",
    hormones: "",
    expect: { body: [{ t: "Once Bloom knows your last period, you'll see what to expect each day." }], mind: [] },
    superpowers: [{ t: "Importing your Clue or Premom history gives you predictions from day one." }],
    watchouts: [],
    care: { food: [], movement: [], rest: [] },
    makeTheMost: { work: [], social: [], relationship: [] },
    ttc: [{ t: "Tap “Import history” or log your last period start to begin." }],
  },
};

/** Day-specific notes that sit on top of the phase content. */
export function dayNotes(info: Today): Item[] {
  const out: Item[] = [];
  if (info.daysUntilOvulation === 2) out.push({ t: "Ovulation is about 2 days away: one of your most fertile days.", why: "Sperm waiting before the egg arrives gives the best odds." });
  if (info.daysUntilOvulation === 1) out.push({ t: "Ovulation is likely tomorrow. Today and tomorrow are your best days." });
  if (info.dpo && DPO[info.dpo]) out.push(DPO[info.dpo]);
  if (info.phase === "menstrual" && info.cycleDay === 1) out.push({ t: "Day 1: a fresh start. Bloom has updated your predictions for this cycle." });
  return out;
}

const DPO: Record<number, Item> = {
  1: { t: "1 DPO: the egg lives about 12–24 hours. If it met sperm, fertilization happens now." },
  2: { t: "2 DPO: a fertilized egg would be dividing as it travels down the tube." },
  3: { t: "3 DPO: still travelling; nothing to feel yet." },
  4: { t: "4 DPO: a fertilized egg would be a tiny ball of cells about to reach the uterus." },
  5: { t: "5 DPO: the embryo would be arriving in the uterus." },
  6: { t: "6 DPO: the earliest implantation can start." },
  7: { t: "7 DPO: implantation window. Any spotting now could be implantation, or nothing." },
  8: { t: "8 DPO: a common day for implantation." },
  9: { t: "9 DPO: if implanted, hCG starts rising, but too little for most tests." },
  10: { t: "10 DPO: very sensitive tests catch some pregnancies now, but many are still negative." },
  11: { t: "11 DPO: hCG roughly doubles every 2 days if pregnant. Waiting a little longer gives clearer answers." },
  12: { t: "12 DPO: a first-morning test is reasonably reliable from today." },
  13: { t: "13 DPO: test accuracy keeps improving." },
  14: { t: "14 DPO: your period is due around now. A test today is very reliable." },
};

/** Rotate a list by cycle day so the first few items change from day to day. */
export function rotate<T>(pool: T[], seed: number): T[] {
  if (pool.length < 2) return pool;
  const k = seed % pool.length;
  return [...pool.slice(k), ...pool.slice(0, k)];
}

export function fill(line: string, vars: Record<string, string | number | null | undefined>): string {
  return line.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "—").toString());
}
