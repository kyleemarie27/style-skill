/**
 * Reference library shared by every week of the guide: what each symptom means and what helps,
 * nutrient targets, typical hCG ranges and weight-gain guidance.
 * General information from ACOG, NIH Office of Dietary Supplements, IOM, NHS and Mayo Clinic.
 */

export interface SymptomInfo {
  why: string;
  helps: string[];
  call: string;
}

/** Keyed by the symptom names used in the check-in (plus nausea, spotting and cramping). */
export const SYMPTOMS: Record<string, SymptomInfo> = {
  Nausea: {
    why: "Linked to rising hCG and estrogen and a placental hormone called GDF15. It usually peaks at 8–10 weeks and eases by 12–14 weeks.",
    helps: ["Small snacks every 2–3 hours; never let your stomach get empty", "Crackers before getting out of bed", "Cold, bland, salty or sour foods", "Ginger tea, chews or capsules", "Vitamin B6 (10–25 mg up to 3× a day) ± doxylamine, after checking with your doctor"],
    call: "You can't keep fluids down for 24 hours, you're peeing very little, you feel faint, or you're losing weight.",
  },
  Spotting: {
    why: "Light spotting happens in about 1 in 4 early pregnancies, from implantation, a sensitive cervix after sex or an exam, or small bleeds that resolve on their own.",
    helps: ["Rest and avoid sex until it stops", "Use a pad (not a tampon) so you can see how much there is", "Note the color and amount for your doctor"],
    call: "Always tell your doctor. Call right away for heavy bleeding, clots, strong cramps, one-sided pain, shoulder-tip pain or dizziness.",
  },
  Cramping: {
    why: "The growing uterus and stretching ligaments cause mild, period-like cramps, especially in the first trimester.",
    helps: ["Rest and lie on your side", "A warm (not hot) shower or bath", "Drink water; dehydration can cause tightening", "Acetaminophen if needed"],
    call: "Cramps are strong, rhythmic or one-sided, or come with bleeding, fever, fluid leaking or pain when you pee.",
  },
  Fatigue: {
    why: "Progesterone is sedating, your metabolism is up, and in early pregnancy your body is building the placenta. It often returns in the third trimester.",
    helps: ["Earlier bedtimes and short naps", "Iron-rich foods (ask to check for anemia)", "A short walk or fresh air", "Lowering expectations for a few weeks"],
    call: "Extreme tiredness with breathlessness, a racing heart or feeling very low most days.",
  },
  "Tender breasts": {
    why: "Estrogen and progesterone grow milk ducts and increase blood flow. Breasts often grow a cup size or more.",
    helps: ["A soft, supportive bra without underwire", "Sleeping in a light sports bra", "Cool or warm compresses"],
    call: "A hard, red, hot area or a lump that doesn't go away.",
  },
  "Frequent peeing": {
    why: "hCG increases blood flow to the kidneys, and the growing uterus (and later the baby's head) presses on the bladder.",
    helps: ["Keep drinking water during the day; cut back in the evening", "Lean forward when you pee to empty fully", "Kegels for leaks"],
    call: "Burning, pain, blood, urgency with little urine, fever or back pain: these can be a UTI.",
  },
  "Food aversions": {
    why: "Heightened smell and taste in early pregnancy, possibly to protect you from risky foods.",
    helps: ["Eat what you can; your prenatal covers gaps", "Cold foods smell less", "Swap foods you can't face for similar nutrients (e.g. eggs or beans instead of meat)"],
    call: "You can barely eat anything or are losing weight.",
  },
  Cravings: {
    why: "Likely a mix of hormones, changes in taste and smell, and emotional comfort.",
    helps: ["It's fine to give in, within reason", "Pair sweets with protein to steady blood sugar", "Keep healthy versions on hand"],
    call: "You crave non-food things like ice, clay, chalk or dirt (pica). It can be a sign of low iron.",
  },
  Bloating: {
    why: "Progesterone relaxes your gut, slowing digestion and trapping gas.",
    helps: ["Smaller meals, eaten slowly", "Walk after eating", "Limit fizzy drinks and gassy foods if they bother you"],
    call: "Bloating with severe pain, vomiting or no bowel movement.",
  },
  Constipation: {
    why: "Progesterone slows the gut, iron in prenatals adds to it, and the uterus presses on the bowel.",
    helps: ["8–12 cups of water a day", "Fiber: oats, beans, fruit, prunes, chia, vegetables", "Daily walking", "Psyllium or a stool softener (docusate) if needed; ask first"],
    call: "No bowel movement for 4+ days, severe pain, or rectal bleeding that won't stop.",
  },
  Heartburn: {
    why: "Progesterone relaxes the valve at the top of the stomach, and later the uterus pushes the stomach up.",
    helps: ["Small meals; don't lie down for 2–3 hours after eating", "Raise the head of your bed", "Avoid spicy, fatty or acidic trigger foods", "Tums are generally fine; ask about famotidine (Pepcid) if needed"],
    call: "After 20 weeks, upper belly pain under the right ribs (it can be preeclampsia, not heartburn).",
  },
  Headache: {
    why: "Hormone shifts, more blood volume, dehydration, low blood sugar, poor sleep and less caffeine.",
    helps: ["Water and a snack first", "Rest in a dark, quiet room", "A cool cloth on your forehead or neck", "Acetaminophen (Tylenol); avoid ibuprofen and aspirin unless your doctor advises"],
    call: "After 20 weeks: a severe headache, one that won't go away, or one with vision changes, swelling or upper belly pain (possible preeclampsia).",
  },
  Dizziness: {
    why: "Relaxed blood vessels lower blood pressure, more blood goes to the uterus, and blood sugar can dip.",
    helps: ["Stand up slowly", "Eat small, regular meals", "Drink water", "Lie on your left side if you feel faint"],
    call: "Fainting, or dizziness with bleeding, belly pain, palpitations, headache or vision changes.",
  },
  "Discharge change": {
    why: "More estrogen and blood flow increase normal discharge (leukorrhea): thin, milky and mild-smelling.",
    helps: ["Breathable cotton underwear", "Panty liners if needed", "Avoid douching and scented products"],
    call: "Green, gray or yellow discharge; itching or burning; a fishy or strong smell; or watery fluid you can't control.",
  },
  Insomnia: {
    why: "Hormones, needing to pee, heartburn, leg cramps, a growing bump and a busy mind.",
    helps: ["A consistent wind-down routine", "Side-sleeping with a pregnancy pillow", "Less screen time before bed", "Short daytime naps if needed"],
    call: "Sleep problems with low mood, anxiety or loud snoring and daytime sleepiness.",
  },
  "Back pain": {
    why: "Your center of gravity shifts forward, and relaxin loosens the ligaments that support your spine and pelvis.",
    helps: ["Supportive, low-heeled shoes", "Pelvic tilts and cat-cow stretches", "A support belt", "Heat packs (warm, not hot)", "Prenatal massage or physical therapy"],
    call: "Back pain with fever, pain when you pee, one-sided flank pain, or rhythmic pain (possible labor).",
  },
  "Leg cramps": {
    why: "Changes in circulation, pressure on nerves and fatigue, mostly in the second half of pregnancy.",
    helps: ["Flex your foot toward your shin to stop a cramp", "Stretch your calves before bed", "Stay hydrated", "Magnesium-rich foods (nuts, seeds, greens)"],
    call: "One calf stays painful, swollen, warm or red (possible blood clot).",
  },
  "Round ligament pain": {
    why: "The ligaments that hold your uterus stretch as it grows, causing sharp, brief jabs low in the belly or groin.",
    helps: ["Move slowly when you stand up or roll over", "Bend toward the pain to ease it", "Support your bump with your hand or a belt"],
    call: "Pain that's constant, severe or rhythmic, or comes with fever, bleeding or fluid.",
  },
  "Braxton Hicks": {
    why: "Practice contractions: the uterus tightens for 30 seconds to 2 minutes, irregular and usually painless.",
    helps: ["Drink a glass of water", "Change position or rest", "Empty your bladder"],
    call: "Before 37 weeks: 4 or more in an hour, regular or painful tightening, pelvic pressure, back pain, bleeding or fluid.",
  },
  "Swollen feet": {
    why: "Extra fluid and pressure on pelvic veins slow blood returning from the legs.",
    helps: ["Put your feet up", "Move every hour", "Compression socks", "Drink enough water (it helps, not hurts)"],
    call: "Sudden swelling of the face or hands, swelling in one leg, or swelling with headache or vision changes.",
  },
  Itching: {
    why: "Stretching skin and dryness are the usual causes.",
    helps: ["Fragrance-free moisturizer", "Lukewarm showers", "Loose cotton clothing"],
    call: "Intense itching, especially on the palms and soles or at night, without a rash (possible cholestasis).",
  },
  "Severe headache": {
    why: "Most headaches are harmless, but a severe one after 20 weeks can be a sign of preeclampsia.",
    helps: ["Check your blood pressure if you can", "Rest and drink water"],
    call: "After 20 weeks, call your doctor now. Go in if you can't reach them or have vision changes.",
  },
  "Vision changes": {
    why: "Fluid changes can blur vision slightly, but blurred vision, spots or flashing lights after 20 weeks can be preeclampsia.",
    helps: ["Check your blood pressure if you can"],
    call: "After 20 weeks, call your doctor now.",
  },
  "Sudden swelling": {
    why: "Gradual ankle swelling is normal; sudden swelling of the face, hands or around the eyes can be preeclampsia.",
    helps: ["Check your blood pressure if you can"],
    call: "Call your doctor today, especially with headache, vision changes or upper belly pain.",
  },
};

export interface Nutrient {
  name: string;
  target: string;
  why: string;
  sources: string;
}

export const NUTRIENTS: Nutrient[] = [
  { name: "Folate / folic acid", target: "600 mcg (400 mcg from a supplement)", why: "Closes the neural tube by week 6; builds DNA and red blood cells.", sources: "Prenatal vitamin, fortified cereal, lentils, beans, spinach, asparagus, avocado" },
  { name: "Iron", target: "27 mg", why: "Your blood volume rises 40–50%; prevents anemia and fatigue.", sources: "Lean red meat, chicken, fish, beans, lentils, tofu, fortified cereal. Pair with vitamin C" },
  { name: "Calcium", target: "1,000 mg", why: "Builds baby's bones and teeth; protects your own bones.", sources: "Milk, yogurt, cheese, fortified plant milk, tofu, canned salmon with bones, almonds" },
  { name: "Vitamin D", target: "600 IU (many prenatals have more)", why: "Helps absorb calcium; supports bones and immunity.", sources: "Sunlight, fortified milk, salmon, eggs, prenatal vitamin" },
  { name: "Iodine", target: "220 mcg", why: "Needed for baby's brain and thyroid development.", sources: "Iodized salt, dairy, eggs, seafood. Check your prenatal includes it" },
  { name: "Choline", target: "450 mg", why: "Supports brain and spinal cord development; most prenatals have little.", sources: "Eggs (about 150 mg each), meat, fish, soybeans, broccoli" },
  { name: "DHA (omega-3)", target: "200–300 mg", why: "Builds baby's brain and eyes.", sources: "Salmon, sardines, trout, anchovies (2–3 servings a week of low-mercury fish), or a DHA supplement" },
  { name: "Protein", target: "About 70–100 g", why: "Raw material for baby's tissues, the placenta and your growing blood supply.", sources: "Eggs, Greek yogurt, beans, lentils, chicken, fish, tofu, nuts" },
  { name: "Vitamin B12", target: "2.6 mcg", why: "Nervous system development; important if you eat little or no animal food.", sources: "Meat, fish, eggs, dairy, fortified foods, supplement if vegan" },
  { name: "Fiber + water", target: "28 g fiber, 8–12 cups water", why: "Prevents constipation and hemorrhoids.", sources: "Whole grains, fruit, vegetables, beans, prunes, chia" },
];

export const CALORIES = "No extra calories in the first trimester. About +340 a day in the second and +450 in the third (ACOG). Roughly a yogurt and a handful of nuts, then a small extra meal.";

/** Typical hCG range (mIU/mL) by weeks since the last period. The trend matters more than one number. */
export const HCG: { weeks: string; range: string }[] = [
  { weeks: "3", range: "5–50" },
  { weeks: "4", range: "5–426" },
  { weeks: "5", range: "18–7,340" },
  { weeks: "6", range: "1,080–56,500" },
  { weeks: "7–8", range: "7,650–229,000" },
  { weeks: "9–12", range: "25,700–288,000" },
  { weeks: "13–16", range: "13,300–254,000" },
];

/** IOM total weight-gain guidance for a single pregnancy. */
export const WEIGHT_GAIN: { bmi: string; total: string; perWeek: string }[] = [
  { bmi: "Under 18.5", total: "28–40 lb", perWeek: "1–1.3 lb" },
  { bmi: "18.5–24.9", total: "25–35 lb", perWeek: "0.8–1 lb" },
  { bmi: "25–29.9", total: "15–25 lb", perWeek: "0.5–0.7 lb" },
  { bmi: "30 or more", total: "11–20 lb", perWeek: "0.4–0.6 lb" },
];

export const FOOD_SAFETY = {
  enjoy: "Well-cooked meat, poultry and eggs; pasteurized dairy and hard cheeses; low-mercury fish (salmon, sardines, cod, shrimp, canned light tuna); washed fruit and vegetables; up to 200 mg caffeine a day.",
  avoid: "Alcohol; raw or undercooked meat, fish, shellfish and eggs; unpasteurized milk and soft cheeses (unless labeled pasteurized); deli meat and hot dogs unless steaming hot; high-mercury fish (shark, swordfish, king mackerel, tilefish, bigeye tuna); raw sprouts; liver in large amounts.",
  meds: "Usually OK: acetaminophen, Tums, famotidine, loratadine/cetirizine, docusate, psyllium. Avoid unless your doctor says: ibuprofen, naproxen, aspirin, retinoids, high-dose vitamin A, many herbal supplements. Always check new medicines with your doctor or pharmacist.",
};
