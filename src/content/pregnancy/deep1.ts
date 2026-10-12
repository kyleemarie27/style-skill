import type { WeekDeep } from "./types";

/**
 * Weeks 4–13 in depth: how the baby is developing, what your body and hormones are doing,
 * the questions people most often ask, and decisions coming up. Paragraphs are separated by
 * blank lines. General information based on ACOG, NHS, CDC and Mayo Clinic guidance.
 */
export const DEEP_T1: Record<number, WeekDeep> = {
  4: {
    baby: `About two weeks after conception, the fertilized egg has become a blastocyst: a hollow ball of a few hundred cells that has buried itself in your uterine lining. Its outer layer (the trophoblast) is sending tiny root-like projections into the lining to tap your blood supply. That outer layer becomes the placenta; a small cluster of cells inside, the inner cell mass, becomes the baby.

This week the inner cells organize into a flat, two-layered disc. Two fluid-filled spaces form beside it: the amniotic sac, which will cushion the baby for the rest of pregnancy, and the yolk sac, which makes the first blood cells and feeds the embryo until the placenta takes over around weeks 10–12. Next week a third layer appears, and those three layers go on to form every organ.`,
    body: `The trophoblast cells make human chorionic gonadotropin (hCG), the hormone your test detects. hCG's job is to tell the corpus luteum (the leftover follicle on your ovary) to keep making progesterone, so your period doesn't come and the lining stays put. In early pregnancy hCG roughly doubles every 48–72 hours, which is why tests get darker day by day.

Progesterone is the main reason you may feel tired, bloated or have tender breasts already. It relaxes smooth muscle all over the body (including your gut, which slows digestion) and raises your body temperature slightly. Estrogen is climbing too, increasing blood flow to the uterus and breasts.

Many people feel nothing at all at 4 weeks. Light spotting or cramping around now can come from implantation, and is usually nothing to worry about. Heavy bleeding, or sharp pain on one side, is different: call your doctor the same day.`,
    faq: [
      { q: "Is it normal to feel no symptoms yet?", a: "Yes. Most symptoms are driven by rising hCG and progesterone, and many people don't notice anything until week 5 or 6. Having no symptoms doesn't mean anything is wrong." },
      { q: "How soon should I see a doctor?", a: "Call now to book. Most practices schedule the first visit around 8–10 weeks, when an ultrasound can show the heartbeat. Ask for an earlier appointment if you've had an ectopic pregnancy or miscarriage before, have a chronic condition, or take regular medication." },
      { q: "I drank alcohol before I knew. Is that a problem?", a: "This is very common. In the first couple of weeks after conception, the embryo isn't yet sharing your blood supply in the same way. The advice is simply to stop now. Mention it at your first visit so your doctor can reassure you." },
      { q: "Should I get blood tests for hCG?", a: "Not routinely. A home test is very accurate once it's positive. Doctors check hCG levels when there's bleeding, pain or a history of loss, and then they look at whether it rises over 48 hours rather than at one number." },
    ],
    decisions: [
      { t: "Choose who will care for you: an OB-GYN, a midwife, or a family doctor. Check who your insurance covers and which hospital or birth center they deliver at." },
    ],
  },
  5: {
    baby: `This is the week of gastrulation, one of the most important steps in human development. The flat disc of cells folds in on itself and forms three layers. The ectoderm (outer) will become the brain, spinal cord, nerves, skin, hair and eyes. The mesoderm (middle) becomes the heart, blood vessels, muscles, bones and kidneys. The endoderm (inner) becomes the lining of the gut, the liver, pancreas and lungs.

A groove runs down the back of the embryo and starts to fold up into the neural tube, which becomes the brain and spinal cord. It closes like a zipper from the middle outward and finishes around day 28 after conception (the end of week 6). Folic acid is so important early because it helps this closure happen properly.

The heart begins as two small tubes that fuse into one. By the end of this week or early next, it starts to contract: the first organ to work.`,
    body: `hCG is now somewhere in the low thousands (mIU/mL) for many people, and still roughly doubling every two to three days. Progesterone and estrogen keep rising. Together they cause the classic early signs: sore or heavy breasts, tiredness, needing to pee more, and sometimes a metallic taste or a strong sense of smell.

Your blood volume is starting to increase; it will rise by 40–50% by the third trimester. Your kidneys are filtering more, which is part of why you pee more often. The uterus has begun to grow, which can feel like period cramps. Mild, crampy, central aches are common. Strong pain, or pain on one side, isn't, and is worth a call.

Nausea often begins between weeks 5 and 6. It tends to follow the rise in hCG, so it usually peaks around weeks 8–10 and eases by 12–14 weeks for most people.`,
    faq: [
      { q: "Is mild cramping normal?", a: "Yes. A growing uterus and stretching ligaments often cause mild, period-like cramps. Call your doctor if the pain is strong, one-sided, or comes with bleeding, dizziness or shoulder-tip pain." },
      { q: "How much folic acid do I need?", a: "At least 400 mcg a day from a supplement (most prenatals have 400–800 mcg, sometimes as methylfolate). Your total target from food and supplements is about 600 mcg. Some people need more (e.g. a prior pregnancy with a neural tube defect, some medications, diabetes); ask your doctor." },
      { q: "Can I keep exercising?", a: "Yes, in most cases. Keep doing what you were doing before, at a level where you can still talk. Avoid contact sports, activities with a high fall risk, and overheating (hot yoga, saunas)." },
    ],
  },
  6: {
    baby: `The embryo is now curled into a C-shape about 4–6 mm long, with a tail that will disappear by week 8. The heart is beating, often 100–120 times a minute, and a transvaginal ultrasound can sometimes pick it up as a tiny flicker. The heart is still a single tube that's looping and folding; its four chambers form over the next few weeks.

Small buds appear on the sides of the body that will become arms, followed a couple of days later by leg buds. On the head, thickened patches mark where the eyes and inner ears will form, and the jaw and face begin as a set of arches (the pharyngeal arches) under the head.

The neural tube closes this week. The front end, which will become the brain, is growing quickly and forming its first three bulges: forebrain, midbrain and hindbrain.`,
    body: `This is when many people start to feel properly pregnant. Nausea and vomiting affect about 70–80% of pregnant people and can happen at any time of day, not just mornings. The exact cause isn't fully known, but it's linked to rising hCG and estrogen, and to a hormone called GDF15 made by the placenta. Nausea is common and is usually a sign of healthy hormone levels, but not having it is completely normal too.

Fatigue can be intense. Progesterone has a sedating effect, your metabolism is up, and your body is building a whole new organ, the placenta. Blood pressure often drops slightly in early pregnancy, which can make you lightheaded when you stand quickly.

Your breasts are preparing for feeding: the milk ducts are growing, the areolas may darken, and the small bumps on them (Montgomery's glands) can become more noticeable.`,
    faq: [
      { q: "What actually helps nausea?", a: "Eat small amounts every 2–3 hours so your stomach is never empty; keep crackers by the bed; try cold, bland or salty foods; ginger (tea, chews, capsules); acupressure wristbands. If that's not enough, vitamin B6 (10–25 mg up to 3× a day) with or without doxylamine (Unisom) is the first-line medicine ACOG recommends. Ask your doctor." },
      { q: "When is nausea a problem?", a: "Call if you can't keep any fluids down for 24 hours, are peeing very little or it's dark, feel dizzy or faint, or are losing weight. That can be hyperemesis gravidarum, which is treatable with medicine and IV fluids." },
      { q: "Should I be able to see a heartbeat on an ultrasound now?", a: "Sometimes, but not always. Dates are often a few days off, so a heartbeat might not be visible until 7 weeks. If an early scan doesn't show one, doctors usually repeat it in 7–14 days before drawing conclusions." },
      { q: "Is caffeine okay?", a: "Up to 200 mg a day is considered safe by ACOG: about one 12-oz cup of brewed coffee. Remember tea, cola, energy drinks and chocolate count too." },
    ],
  },
  7: {
    baby: `The embryo is about 1 cm from crown to rump and growing fast. The brain is the busiest organ: it's generating roughly 100 new nerve cells every minute, and the head is large compared with the body to make room for it.

The arm buds have lengthened and the ends flatten into hand plates, where fingers will appear as ridges next week. The leg buds are following a few days behind. The face is forming: the nostrils are small pits, the lenses of the eyes are developing, and the upper lip is starting to come together from separate parts.

The kidneys are entering their final stage of development, and the liver is making red blood cells. The umbilical cord has formed and is now the lifeline between the embryo and the developing placenta.`,
    body: `Your uterus has roughly doubled in size, though it's still tucked inside your pelvis. As it grows it presses on your bladder, which is part of why you pee so often. Your heart is pumping more blood each minute and your resting heart rate may be a few beats faster.

Progesterone relaxes the muscles in your gut, so food moves more slowly. That helps you absorb more nutrients, but it also causes bloating, gas and constipation. Iron in prenatal vitamins can make constipation worse.

Many people notice food aversions (often to meat, coffee or strong smells) and cravings. Increased saliva, a stuffy nose and mild headaches are also common. Mood swings are normal; hormones are changing faster than at almost any other time in life.`,
    faq: [
      { q: "How do I deal with constipation?", a: "Drink plenty of water, add fiber gradually (oats, beans, fruit, prunes, chia), and walk daily. If that's not enough, fiber supplements (psyllium) and stool softeners (docusate) are generally considered safe; ask your doctor or pharmacist." },
      { q: "Is it okay to have sex?", a: "Yes, in a healthy pregnancy. The baby is well protected by the amniotic sac and the cervix. Light spotting afterward can happen because the cervix has more blood flow; heavier bleeding or pain is worth a call." },
      { q: "Can I take Tylenol for headaches?", a: "Acetaminophen (Tylenol) is the usual choice for pain or fever in pregnancy, at the lowest dose that works. Avoid ibuprofen, naproxen and aspirin unless your doctor recommends them." },
    ],
  },
  8: {
    baby: `By the end of this week, every major organ has started to form. That's why weeks 3–8 are called the embryonic period and are the most sensitive to things like alcohol, certain medications and high fevers. From next week the baby is mostly growing and maturing what's already there.

Fingers and toes are visible, still joined by webbing. The embryo has started making small spontaneous movements, far too small to feel. The tail is almost gone, the eyelids are forming, and the outer ears are taking shape.

The heart has divided into its chambers and is beating around 150–170 times a minute, roughly twice your rate. Nerve cells are branching and connecting, laying down the first pathways of the nervous system.`,
    body: `Your uterus is now about the size of a large orange. You probably don't look pregnant, but your clothes may feel snug around the waist from bloating.

hCG is getting close to its peak, which usually happens around weeks 8–11. That's why nausea and tiredness are often at their worst right now. They usually ease once hCG levels off and the placenta takes over making progesterone, around weeks 10–12.

Heartburn may start because progesterone relaxes the valve at the top of your stomach. Vivid dreams, mood swings and feeling emotional are all common. If you feel low, hopeless or anxious most of the day, most days, tell your doctor: depression and anxiety in pregnancy are common and treatable.`,
    faq: [
      { q: "What happens at the first prenatal visit?", a: "A detailed health history, your last period date, medications and family history; a physical exam; blood tests (blood type and Rh, blood count, immunity to rubella and chickenpox, hepatitis B, HIV, syphilis, sometimes thyroid); a urine test; and often an ultrasound to confirm the heartbeat and due date. Bring your Bloom visit summary and questions." },
      { q: "What does it mean if I'm Rh-negative?", a: "If your blood type is negative (e.g. O-) and the baby's father is positive, your body could make antibodies against a positive baby. A shot called Rh immune globulin (RhoGAM) prevents that. It's given around 28 weeks, after birth if the baby is positive, and after any bleeding." },
      { q: "How likely is a miscarriage now?", a: "About 10–15% of known pregnancies end in miscarriage, most before 10 weeks and most because of chromosome problems that nothing could prevent. Once a heartbeat has been seen on ultrasound, the chance of continuing is much higher, and it keeps rising each week." },
    ],
    decisions: [
      { t: "Genetic screening: you'll be offered tests to screen for chromosome conditions. The main options are cell-free DNA screening (NIPT), a blood test from 10 weeks, and the NT scan with first-trimester blood work at 11–14 weeks. Both are optional. Screening gives a likelihood; only diagnostic tests (CVS or amniocentesis) give a definite answer." },
      { t: "Carrier screening: a blood test that checks whether you carry genes for conditions such as cystic fibrosis, spinal muscular atrophy or sickle cell disease. If you do, your partner can be tested too." },
    ],
  },
  9: {
    baby: `The baby is about 2.3 cm long and starting to look recognizably human. The heart has finished dividing into four chambers and the valves are forming. Muscles are developing so the baby can bend at the elbows and wrists, and the tiny limbs move in jerky, reflexive ways.

The face is filling in: the upper lip has fused, the nose has a tip, and the eyelids almost cover the eyes. The external ears are moving into place. Inside, the intestines are growing faster than the abdomen and temporarily bulge into the umbilical cord. That's normal, and they move back by week 12.

The placenta is growing rapidly. It's developing the tree-like villi that let oxygen, nutrients and antibodies pass from your blood to the baby's without the two blood supplies ever mixing.`,
    body: `Your blood volume is noticeably higher, which can show as visible blue veins on your chest and belly. Your heart works harder to move all that blood, so you may feel short of breath with less effort than usual.

Headaches are common in the first trimester. Causes include hormone shifts, more blood volume, dehydration, low blood sugar, poor sleep and cutting back on caffeine. Water, regular snacks, rest and acetaminophen if needed usually help.

Your waist may be thickening and your breasts growing; many people go up a cup size or more in the first trimester. A comfortable, stretchy bra without underwire often feels much better.`,
    faq: [
      { q: "Is it normal for symptoms to suddenly ease?", a: "Symptoms naturally go up and down from day to day. A sudden change on its own isn't a sign of a problem. If you're worried, or have bleeding or cramping as well, call your doctor; they can check with a scan or blood test." },
      { q: "What foods should I avoid?", a: "Raw or undercooked meat, fish and eggs; unpasteurized milk and cheeses; deli meats and hot dogs unless heated until steaming; high-mercury fish (shark, swordfish, king mackerel, tilefish, bigeye tuna); raw sprouts; and alcohol. Most other foods are fine, and eating well is more important than being perfect." },
      { q: "Do I need to change my skincare?", a: "Avoid retinoids (tretinoin, retinol, isotretinoin) and high-dose salicylic acid peels. Azelaic acid, glycolic acid, benzoyl peroxide in small amounts, and mineral sunscreen are generally considered safe. Check with your doctor or pharmacist." },
    ],
  },
  10: {
    baby: `The baby is now called a fetus, meaning "offspring". The embryonic period is over: all the essential structures are in place, and from here the focus is growth and maturation. The baby is about 3 cm long and weighs around 4 grams.

The fingers and toes have separated and tiny nails are starting to grow. Bones are beginning to harden (ossify), starting with the collarbone and jaw. The kidneys produce urine, which becomes part of the amniotic fluid, and the baby has started swallowing that fluid, which helps the gut and lungs develop.

If the baby is a boy, the testes have started making testosterone. The external genitals look the same for both sexes until about week 12, which is why the sex usually can't be seen on ultrasound yet.`,
    body: `The placenta is taking over progesterone production from the corpus luteum on your ovary, a handover that's usually complete by about 12 weeks. As hCG levels off over the next couple of weeks, many people find nausea and fatigue start to ease.

You might notice more vaginal discharge (leukorrhea): thin, milky and mild-smelling. It's caused by higher estrogen and more blood flow to the pelvis, and it helps protect against infection. Discharge that's green, gray, itchy, burning or strong-smelling should be checked.

Round ligament pain can start: brief, sharp twinges low in the belly or groin when you stand up, cough or roll over. It comes from the ligaments that support your uterus stretching as it grows.`,
    faq: [
      { q: "What is NIPT and should I do it?", a: "Cell-free DNA screening (NIPT) analyzes fragments of placental DNA in your blood from 10 weeks. It screens for Down syndrome (trisomy 21), trisomies 18 and 13, and sex chromosome conditions, and can tell you the sex. It's very accurate for Down syndrome (detecting about 99%), but it's still a screen: a high-risk result needs a diagnostic test to confirm. It's optional, and ACOG says it should be offered to everyone." },
      { q: "Can I find out the sex now?", a: "NIPT can tell you the sex from 10 weeks with high accuracy. Ultrasound can sometimes show it from 12–14 weeks, but it's much more reliable at the anatomy scan (18–22 weeks)." },
      { q: "Is the risk of miscarriage lower now?", a: "Yes. After 10 weeks, and especially once a healthy heartbeat has been seen, the risk of miscarriage drops considerably, to around 1–3% for many people." },
    ],
    decisions: [
      { t: "Decide whether to have NIPT (from 10 weeks) and/or an NT scan (11–14 weeks). Ask your doctor what's covered by your insurance and what they recommend for you." },
    ],
  },
  11: {
    baby: `The baby is about 4 cm long. The head is still almost half of the body length, but the body is starting to catch up. Hair follicles are forming, and tooth buds are developing under the gums.

The baby is very active, stretching, rolling and even hiccupping, though you won't feel any of it for another couple of months. The diaphragm is forming, which allows practice breathing movements to begin. The hands can open and close into fists.

The NT scan, if you have one, measures the clear fluid at the back of the baby's neck (the nuchal translucency). More fluid can be linked to chromosome conditions and heart differences, so the measurement is combined with your age and blood tests to estimate a likelihood.`,
    body: `Your energy may start to come back, little by little. Many people still feel nauseous at 11 weeks, but it often becomes more predictable and easier to manage.

Your hair may seem thicker and shinier because higher estrogen keeps more hairs in the growing phase. (The extra hair is shed in the months after birth, which is normal.) Nails may grow faster too.

Lightheadedness is common: blood vessels relax under progesterone, blood pressure drops a little, and more blood is directed to the uterus. Stand up slowly, eat regularly, drink water, and lie on your side if you feel faint.`,
    faq: [
      { q: "What's the difference between screening and diagnostic tests?", a: "Screening tests (NIPT, NT scan, quad screen) estimate the chance of a condition and carry no risk to the pregnancy. Diagnostic tests (CVS at 10–13 weeks or amniocentesis from 15 weeks) look at the baby's cells directly and give a definite answer, with a very small risk of miscarriage (well under 1%)." },
      { q: "Is it safe to travel?", a: "Usually yes. Mid-pregnancy is the most comfortable time. On flights, walk and stretch regularly, drink water and consider compression socks to lower clot risk. Check Zika and other travel health advisories before going abroad." },
      { q: "How much weight should I have gained?", a: "Not much yet: about 1–4.5 lb (0.5–2 kg) in the whole first trimester is typical, and some people lose a little because of nausea. Most gain happens in the second and third trimesters." },
    ],
  },
  12: {
    baby: `By 12 weeks the baby is about 5–6 cm long, about the size of a lime, and weighs around 14 grams. All the organs, muscles, limbs and bones are in place, and the baby will now mostly grow and mature.

Reflexes are developing: the fingers curl, the toes flex, and the mouth makes sucking movements. The intestines have moved back into the abdomen from the umbilical cord. The kidneys are working, and the pituitary gland at the base of the brain has started making hormones.

The face has a more human profile, with the eyes closer to the front of the head and the ears near their final position. The external genitals are becoming distinguishable, though not always clear on ultrasound yet.`,
    body: `The top of your uterus has risen above your pubic bone, and your doctor may be able to feel it when pressing on your lower belly. Some people start to show a little, especially in a second pregnancy.

The placenta is now fully making the progesterone that sustains the pregnancy. hCG has peaked and is starting to fall, which is why nausea and fatigue often lift around now. For some people it takes a few more weeks.

Skin changes can appear: a dark line down the middle of the belly (linea nigra), darker nipples, and patches of darker skin on the face (melasma, the "mask of pregnancy"). These are caused by hormones stimulating pigment cells. Sunscreen helps limit melasma, and most of it fades after birth.`,
    faq: [
      { q: "Is it safe to tell people now?", a: "Many people share around 12 weeks because the chance of miscarriage is much lower by then. But there's no rule. Some tell close people early so they have support either way; others wait for scan or screening results." },
      { q: "Do I have to tell my employer now?", a: "In the US there's no legal deadline. It can help to share before you need accommodations or time off for appointments. The Pregnant Workers Fairness Act requires many employers to provide reasonable accommodations." },
      { q: "What's a normal heart rate for the baby?", a: "Around 120–180 beats per minute at this stage, often near 160. Your doctor may be able to hear it with a handheld Doppler from about 10–12 weeks." },
    ],
  },
  13: {
    baby: `In the last week of the first trimester the baby is about 7–8 cm long. The body is growing faster than the head now, so proportions look more like a newborn's. Fingerprints are forming on the fingertips; their pattern is unique and set for life.

Vocal cords are developing, and the baby practices swallowing and breathing movements with amniotic fluid. The bones of the skull and long bones are hardening. The baby can bring a hand to the mouth and may suck a thumb.

The placenta is now fully mature in its structure and has taken over all hormone production, nutrition, oxygen delivery and waste removal.`,
    body: `For many people the end of the first trimester brings relief: more energy, less nausea and a returning appetite. If nausea is getting worse rather than better after 13 weeks, tell your doctor.

Your blood volume and heart output are still rising, and the extra fluid can cause a stuffy nose or occasional nosebleeds. Some people get more vaginal discharge or mild pelvic pressure.

You may notice your libido returning. Sex is safe in a healthy pregnancy unless your doctor has advised otherwise (for example, with placenta previa or bleeding).`,
    faq: [
      { q: "Will I start to feel better now?", a: "Most people find nausea and fatigue ease between 12 and 16 weeks. About 1 in 10 have nausea that lasts longer, sometimes throughout pregnancy. If it's affecting your eating, work or daily life, there are effective medicines; ask your doctor." },
      { q: "When should I start buying maternity clothes?", a: "Whenever your clothes stop being comfortable. Many people manage with stretchy pants, belly bands or bigger sizes until the second trimester. Borrowing is a great option since you'll only wear them for a few months." },
      { q: "When will I feel the baby move?", a: "Usually between 16 and 22 weeks in a first pregnancy, often as flutters or bubbles. In a second pregnancy, people often notice movement a couple of weeks earlier." },
    ],
  },
};
