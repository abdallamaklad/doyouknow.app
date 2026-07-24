import { readdir, readFile, writeFile, access, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url).pathname;
const googleTag = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-6VQZY87LJB"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-6VQZY87LJB');
</script>`;

// editorial-review.json is the single source of truth for the noindex queue.
const editorialReviewPolicy = JSON.parse(await readFile(join(root, 'editorial-review.json'), 'utf8'));
const editorialReview = new Set(
  Object.values(editorialReviewPolicy.pages).flat().map((path) => path.replace(/^\//, ''))
);
const removedContent = new Set([
  'en/article/10-facts-about-uae-formation.html',
  'en/article/bedouin-culture-uae.html',
  'en/article/falconry-uae-tradition.html',
  'en/article/history-pearl-diving-uae.html',
  'en/article/sheikh-zayed-biography.html',
  'en/article/trucial-states-history.html',
  'en/article/uae-minister-happiness.html',
  'en/article/uae-national-day.html',
  'en/category/uae.html'
]);
const removedArticleSlugs = [...removedContent]
  .filter((path) => path.startsWith('en/article/'))
  .map((path) => path.split('/').at(-1).replace('.html', ''));
const worldCupArticleSlugs = [
  'morocco-world-cup-2026',
  'egypt-world-cup-2026',
  'saudi-arabia-world-cup-2026',
  'tunisia-world-cup-2026',
  'algeria-world-cup-2026',
  'iraq-world-cup-2026',
  'jordan-world-cup-2026',
  'qatar-world-cup-2026',
  'arab-teams-world-cup-2026',
  'morocco-defensive-structure-world-cup-2026',
  'egypt-midfield-world-cup-2026',
  'saudi-technical-ceiling-world-cup-2026',
  'tunisia-defensive-grit-world-cup-2026',
  'algeria-attack-world-cup-2026',
  'iraq-jordan-tournament-discipline-world-cup-2026',
  'arab-team-semifinals-world-cup-2026',
  'world-cup-2026-group-stage-pressure-arab-teams',
  'morocco-egypt-algeria-world-cup-2026',
  'arab-fans-world-cup-2026',
  'arab-football-legacy-world-cup-2026',
  'world-cup-2026-final-referee',
  'world-cup-2026-tickets-guide',
  'ballon-dor-2026-explained',
  'marc-cucurella-profile'
];
const worldCupCategorySlugs = [...worldCupArticleSlugs, 'arab-teams-world-cup-2026-pillar'];
const categoryGroups = [
  { lang: 'en', slug: 'world-cup-2026', title: 'World Cup 2026 & Arab Football', description: 'Bilingual World Cup 2026 explainers focused on Arab teams, tactics, fans, and football legacy.', files: worldCupCategorySlugs },
  { lang: 'en', slug: 'dubai', title: 'Dubai & UAE Places', description: 'Discover Dubai and Abu Dhabi landmarks, engineering stories, cultural destinations, and practical travel inspiration.', files: ['abu-dhabi-complete-guide','best-time-visit-dubai','burj-khalifa-facts','deep-dive-dubai','dubai-art-culture-scene','dubai-frame','dubai-free-zones-guide','dubai-metro-guide','dubai-miracle-garden','dubai-police-lamborghini','dubai-vs-abu-dhabi','expo-city-dubai','hidden-gems-uae','louvre-abu-dhabi','palm-jumeirah-engineering','sheikh-zayed-grand-mosque-guide','things-to-do-dubai-this-week','uae-imports-sand','yas-island-abu-dhabi'] },
  { lang: 'en', slug: 'guides', title: 'UAE Practical Guides', description: 'Clear UAE guides for residents, visitors, professionals, and anyone planning a major decision in the Emirates.', files: ['best-beach-clubs-dubai','best-beaches-dubai','best-brunches-dubai','best-restaurants-dubai','dewa-setup-guide','du-etisalat-sim-guide','dubai-day-trips','dubai-driving-car-guide','dubai-families-guide','dubai-fitness-outdoor-guide','dubai-free-things-to-do','dubai-nightlife-guide','dubai-parking-guide','dubai-shopping-guide','dubai-tourist-visa-guide','dubai-traffic-fines-guide','dubai-water-parks-guide','emirates-id-guide','renting-apartment-dubai','save-money-dubai','start-business-dubai','uae-bank-account-types','uae-corporate-tax','uae-driving-license-guide','uae-golden-visa-guide','uae-gratuity-calculator-guide','uae-health-insurance-guide','uae-labor-law-basics','uae-residence-visa-types','uae-school-year-guide','uae-speeding-fines-guide','uae-fuel-prices-explained','amazon-prime-uae-guide','turkish-airlines-istanbul-stopover-guide','uae-debt-travel-ban-explained'] },
  { lang: 'en', slug: 'technology', title: 'Technology Explained', description: 'Plain-language introductions to important artificial intelligence tools and the technology changing everyday life.', files: ['what-is-chatgpt','what-is-google-gemini','what-is-claude-ai','what-is-an-ai-agent','what-is-a-large-language-model','what-is-prompt-engineering','ai-in-uae-government-services','what-is-quantum-computing','what-is-physical-ai','what-are-humanoid-robots','what-are-ai-chips','what-is-agentic-ai','what-is-ai-video-generation','what-is-a-small-language-model','what-is-a-digital-twin','what-is-6g','what-is-synthetic-data','what-is-a-world-model','huawei-google-services-explained','iphone-prices-egypt-explained'] },
  { lang: 'en', slug: 'islamic', title: 'Islamic Knowledge & Culture', description: 'Clear English explainers on Islamic practice, finance, and religious seasons, written with care and sourced from authoritative institutions.', files: ['five-pillars-of-islam','hajj-guide','hijri-calendar-explained','islamic-finance-guide','islamic-new-year-celebrations','laylat-al-qadr-explained','ramadan-health-guide','sadaqah-vs-zakat','two-holy-mosques-history','umrah-guide','what-is-zakat','friday-prayer-jummah-guide','how-prayer-times-calculated', 'what-is-itikaf'] },
  { lang: 'en', slug: 'business', title: 'Business and Economy', description: 'Practical business, economy, and market-entry guides for professionals working across Arabic-speaking markets.', files: ['arabic-facebook-ads-guide','cold-email-startup-guide','dubai-company-registration-cost','golden-visa-investor-track','saudi-ai-market-entry-guide','saudi-sme-support-programs','uae-free-zones-comparison','uae-vs-saudi-business-setup','why-is-dubai-rich','gold-prices-saudi-arabia','gold-prices-egypt-karats','egyptian-pound-explained'] },
  { lang: 'en', slug: 'saudi-guides', title: 'Saudi Practical Guides', description: 'Clear English guides to essential Saudi government services and procedures, from Absher and Qiyas to driving licenses, bank accounts, iqama, visas, payments, and housing.', files: ['absher-portal-guide','open-bank-account-saudi','qiyas-guide','qobool-guide','renting-apartment-riyadh','saudi-bank-account-types','saudi-customs-import-guide','saudi-driving-license','saudi-driving-license-transfer','saudi-family-visit-visa','saudi-foreign-property-ownership','saudi-gosi-guide','saudi-health-insurance','saudi-inheritance-law-guide','saudi-iqama-guide','saudi-job-transfer-guide','saudi-labor-law-basics','saudi-mobile-plans-guide','saudi-nafath-guide','saudi-power-of-attorney-guide','saudi-public-holidays-guide','saudi-sadad-payments','saudi-vat-registration-guide','tawakkalna-guide','sakani-housing-program-guide','saudi-public-prosecution-explained','saudi-retirement-pension-explained'] },
  { lang: 'en', slug: 'saudi', title: 'Saudi Arabia', description: 'Discover Saudi Arabia\'s history, culture, landscapes, and travel experiences through clear, reliable guides.', files: ['alula-saudi-arabia','best-places-saudi-arabia','best-restaurants-riyadh','complete-saudi-travel-guide','diriyah-saudi-arabia','edge-of-the-world-riyadh','jeddah-travel-guide','pearl-diving-saudi','riyadh-complete-guide','riyadh-nightlife-guide','ronaldo-saudi-arabia','saudi-arabia-history','saudi-archaeology-ancient-sites-guide','saudi-asir-abha-guide','saudi-coffee-culture-guide','saudi-cuisine-guide','saudi-desert-camping','saudi-e-visa-guide','saudi-eastern-province-guide','saudi-education-system-guide','saudi-football-global','saudi-hail-northern-region-guide','saudi-national-day','saudi-no-rivers','saudi-red-sea-coast-guide','saudi-tabuk-neom-region-guide','saudi-traditional-crafts-souks-guide','saudi-traditional-dress-culture-guide','saudi-wildlife-nature-reserves-guide','saudi-rain-weather-explained','yanbu-saudi-arabia-guide','afc-champions-league-elite-explained','samu-costa-profile'] },
  { lang: 'en', slug: 'vision-2030', title: 'Saudi Vision 2030 & Megaprojects', description: 'Clear explainers on Saudi Vision 2030, NEOM, and the megaprojects reshaping the Kingdom.', files: ['neom-city-facts','saudi-vision-2030-guide','what-is-neom','the-line-neom','red-sea-project-saudi','kingdom-tower-riyadh','riyadh-season','qiddiya-saudi-arabia', 'what-is-the-saudi-green-initiative', 'what-is-roshn-saudi-housing-program'] },
  { lang: 'en', slug: 'egypt', title: 'Egypt', description: 'Discover Egypt\'s ancient history, pharaohs, monuments, and living culture through clear, reliable guides.', files: ['pyramids-of-giza-facts','egypt-ancient-history','great-sphinx-facts','egyptian-pharaohs-guide','valley-of-the-kings-guide','egyptian-mummies-facts','rosetta-stone-facts','tutankhamun-facts','egyptian-hieroglyphs-guide','grand-egyptian-museum-guide','cairo-complete-guide','luxor-travel-guide','aswan-travel-guide','alexandria-travel-guide','sharm-el-sheikh-guide','hurghada-guide','dahab-guide','siwa-oasis-guide','nile-river-facts','red-sea-egypt-guide','white-desert-egypt','egypt-western-desert-guide','egyptian-cuisine-guide','koshari-egyptian-food-guide','coptic-heritage-egypt','islamic-cairo-guide','egyptian-music-culture','egyptian-traditional-crafts','egypt-water-supply-explained','gerd-ethiopia-dam-explained','zamalek-sc-explained','abdullah-el-said-profile'] },
  { lang: 'en', slug: 'egypt-guides', title: 'Egypt Practical Guides', description: 'Clear English guides for travelers to Egypt, covering visas, money, transport, and practical trip planning.', files: ['egypt-e-visa-guide','egypt-tourist-visa-guide','best-time-visit-egypt','getting-around-egypt','egypt-sim-mobile-guide','egypt-money-currency-guide','egypt-tipping-baksheesh-guide','egypt-safety-guide','cairo-airport-guide','nile-cruise-guide','egypt-driving-guide','egypt-bank-account-guide','egypt-ration-card-subsidies','egypt-rent-law-explained','tansik-egypt-university-admissions'] },
  { lang: 'ar', slug: 'world-cup-2026', title: 'كأس العالم 2026 والكرة العربية', description: 'شروحات عربية وإنجليزية عن كأس العالم 2026 والمنتخبات العربية والتكتيك والجمهور والإرث الكروي.', files: worldCupCategorySlugs },
  { lang: 'ar', slug: 'dubai', title: 'دبي والإمارات', description: 'اكتشف دبي وأبوظبي والإمارات من خلال أدلة عربية واضحة عن المعالم، الهندسة، والوجهات السياحية والعملية.', files: ['abu-dhabi-complete-guide','best-beach-clubs-dubai','best-beaches-dubai','best-brunches-dubai','best-restaurants-dubai','best-time-visit-dubai','burj-khalifa-facts','deep-dive-dubai','dubai-art-culture-scene','dubai-day-trips','dubai-driving-car-guide','dubai-families-guide','dubai-fitness-outdoor-guide','dubai-frame','dubai-free-things-to-do','dubai-free-zones-guide','dubai-metro-guide','dubai-miracle-garden','dubai-nightlife-guide','dubai-parking-guide','dubai-police-lamborghini','dubai-shopping-guide','dubai-tourist-visa-guide','dubai-vs-abu-dhabi','dubai-water-parks-guide','expo-city-dubai','hidden-gems-uae','louvre-abu-dhabi','palm-jumeirah-engineering','save-money-dubai','sheikh-zayed-grand-mosque-guide','things-to-do-dubai-this-week','uae-imports-sand','yas-island-abu-dhabi'] },
  { lang: 'ar', slug: 'business', title: 'الأعمال والاقتصاد', description: 'أدلة عملية في الأعمال والاقتصاد ودخول الأسواق للمحترفين في الأسواق العربية والسعودية.', files: ['arabic-facebook-ads-guide','cold-email-startup-guide','dubai-company-registration-cost','golden-visa-investor-track','saudi-ai-market-entry-guide','saudi-sme-support-programs','start-business-dubai','uae-corporate-tax','uae-free-zones-comparison','uae-golden-visa-guide','uae-vs-saudi-business-setup','why-is-dubai-rich','gold-prices-saudi-arabia','gold-prices-egypt-karats','egyptian-pound-explained'] },
  { lang: 'ar', slug: 'technology', title: 'التقنية', description: 'شروحات عربية واضحة لأهم أدوات الذكاء الاصطناعي والتقنيات التي تغيّر حياتنا اليومية.', files: ['what-is-chatgpt','what-is-google-gemini','what-is-claude-ai','what-is-an-ai-agent','what-is-a-large-language-model','what-is-prompt-engineering','ai-in-uae-government-services','what-is-quantum-computing','what-is-physical-ai','what-are-humanoid-robots','what-are-ai-chips','what-is-agentic-ai','what-is-ai-video-generation','what-is-a-small-language-model','what-is-a-digital-twin','what-is-6g','what-is-synthetic-data','what-is-a-world-model','huawei-google-services-explained','iphone-prices-egypt-explained'] },
  { lang: 'ar', slug: 'saudi', title: 'السعودية: التاريخ والثقافة', description: 'اكتشف تاريخ المملكة العربية السعودية وتراثها ومدنها وثقافتها من خلال مقالات عربية واضحة وموثوقة.', files: ['alula-saudi-arabia','best-places-saudi-arabia','complete-saudi-travel-guide','diriyah-saudi-arabia','edge-of-the-world-riyadh','jeddah-travel-guide','pearl-diving-saudi','riyadh-complete-guide','riyadh-nightlife-guide','ronaldo-saudi-arabia','saudi-arabia-history','saudi-archaeology-ancient-sites-guide','saudi-asir-abha-guide','saudi-coffee-culture-guide','saudi-cuisine-guide','saudi-desert-camping','saudi-eastern-province-guide','saudi-education-system-guide','saudi-football-global','saudi-hail-northern-region-guide','saudi-national-day','saudi-no-rivers','saudi-red-sea-coast-guide','saudi-tabuk-neom-region-guide','saudi-traditional-crafts-souks-guide','saudi-traditional-dress-culture-guide','saudi-wildlife-nature-reserves-guide','saudi-rain-weather-explained','yanbu-saudi-arabia-guide','afc-champions-league-elite-explained','samu-costa-profile'] },
  { lang: 'ar', slug: 'vision-2030', title: 'رؤية السعودية 2030 والمشاريع الكبرى', description: 'تعرف على مشاريع رؤية السعودية 2030 والمدن والوجهات الجديدة من خلال شروحات تفصل الحقائق عن التوقعات.', files: ['kingdom-tower-riyadh','neom-city-facts','qiddiya-saudi-arabia','red-sea-project-saudi','riyadh-season','saudi-vision-2030-guide','the-line-neom','what-is-neom', 'what-is-the-saudi-green-initiative', 'what-is-roshn-saudi-housing-program'] },
  { lang: 'ar', slug: 'guides', title: 'أدلة عملية في السعودية', description: 'أدلة عربية مبسطة للخدمات والمنصات والإجراءات المهمة في السعودية مع إحالات إلى المصادر الرسمية.', files: ['absher-portal-guide','best-restaurants-riyadh','dewa-setup-guide','du-etisalat-sim-guide','dubai-traffic-fines-guide','emirates-id-guide','open-bank-account-saudi','qiyas-guide','qobool-guide','renting-apartment-dubai','renting-apartment-riyadh','saudi-bank-account-types','saudi-customs-import-guide','saudi-driving-license','saudi-driving-license-transfer','saudi-e-visa-guide','saudi-family-visit-visa','saudi-foreign-property-ownership','saudi-gosi-guide','saudi-health-insurance','saudi-inheritance-law-guide','saudi-iqama-guide','saudi-job-transfer-guide','saudi-labor-law-basics','saudi-mobile-plans-guide','saudi-nafath-guide','saudi-power-of-attorney-guide','saudi-public-holidays-guide','saudi-sadad-payments','saudi-vat-registration-guide','tawakkalna-guide','uae-bank-account-types','uae-driving-license-guide','uae-gratuity-calculator-guide','uae-health-insurance-guide','uae-labor-law-basics','uae-residence-visa-types','uae-school-year-guide','sakani-housing-program-guide','saudi-public-prosecution-explained','saudi-retirement-pension-explained','uae-speeding-fines-guide','uae-fuel-prices-explained','amazon-prime-uae-guide','turkish-airlines-istanbul-stopover-guide','uae-debt-travel-ban-explained'] },
  { lang: 'ar', slug: 'islamic', title: 'الثقافة والمعرفة الإسلامية', description: 'شروحات عربية واضحة حول العبادات والتمويل الإسلامي والمواسم الدينية مع احترام السياق والمصادر الموثوقة.', files: ['five-pillars-of-islam','hajj-guide','hijri-calendar-explained','islamic-finance-guide','islamic-new-year-celebrations','laylat-al-qadr-explained','ramadan-health-guide','sadaqah-vs-zakat','two-holy-mosques-history','umrah-guide','what-is-zakat','friday-prayer-jummah-guide','how-prayer-times-calculated', 'what-is-itikaf'] },
  { lang: 'ar', slug: 'egypt', title: 'مصر: التاريخ والثقافة', description: 'اكتشف تاريخ مصر القديمة وفراعنتها ومعالمها وثقافتها الحية من خلال مقالات عربية واضحة وموثوقة.', files: ['pyramids-of-giza-facts','egypt-ancient-history','great-sphinx-facts','egyptian-pharaohs-guide','valley-of-the-kings-guide','egyptian-mummies-facts','rosetta-stone-facts','tutankhamun-facts','egyptian-hieroglyphs-guide','grand-egyptian-museum-guide','cairo-complete-guide','luxor-travel-guide','aswan-travel-guide','alexandria-travel-guide','sharm-el-sheikh-guide','hurghada-guide','dahab-guide','siwa-oasis-guide','nile-river-facts','red-sea-egypt-guide','white-desert-egypt','egypt-western-desert-guide','egyptian-cuisine-guide','koshari-egyptian-food-guide','coptic-heritage-egypt','islamic-cairo-guide','egyptian-music-culture','egyptian-traditional-crafts','egypt-water-supply-explained','gerd-ethiopia-dam-explained','zamalek-sc-explained','abdullah-el-said-profile'] },
  { lang: 'ar', slug: 'egypt-guides', title: 'أدلة عملية في مصر', description: 'أدلة عربية واضحة للمسافرين إلى مصر، تغطي التأشيرات والعملة والتنقل وتخطيط الرحلة.', files: ['egypt-e-visa-guide','egypt-tourist-visa-guide','best-time-visit-egypt','getting-around-egypt','egypt-sim-mobile-guide','egypt-money-currency-guide','egypt-tipping-baksheesh-guide','egypt-safety-guide','cairo-airport-guide','nile-cruise-guide','egypt-driving-guide','egypt-bank-account-guide','egypt-ration-card-subsidies','egypt-rent-law-explained','tansik-egypt-university-admissions'] },
  { lang: 'en', slug: 'around-the-world', title: 'Around the World', description: 'Global stories and cultural explainers from around the world, from everyday traditions to the customs that shape daily life.', files: ['why-some-countries-have-no-army', 'why-do-some-countries-not-observe-daylight-saving', 'why-countries-drive-different-sides', 'unusual-new-year-traditions', 'why-time-zones-exist', 'countries-multiple-capital-cities', 'why-metric-system-not-universal', 'how-international-borders-are-decided', 'why-multiple-time-zones-vs-single', 'how-the-un-actually-works', 'how-the-international-date-line-works', 'why-some-countries-have-more-than-one-official-language', 'why-some-cities-have-sister-cities'] },
  { lang: 'en', slug: 'self-care', title: 'Self Care', description: 'Practical self-care guidance for everyday wellbeing, mindfulness, and healthy routines.', files: ['what-is-emotional-regulation', 'what-is-self-care', 'daily-habits-mental-wellbeing', 'what-is-a-digital-detox', 'understanding-burnout-signs-recovery', 'what-is-journaling', 'stress-vs-anxiety-difference', 'what-is-mindfulness-meditation', 'understanding-imposter-syndrome', 'understanding-emotional-labor', 'what-is-cognitive-behavioral-therapy', 'understanding-perfectionism'] },
  { lang: 'en', slug: 'science', title: 'Science', description: 'Clear explainers on science, discovery, and how the natural world works.', files: ['how-does-anesthesia-work', 'how-do-noise-cancelling-headphones-work', 'how-vaccines-work', 'why-is-the-sky-blue', 'how-memory-works-in-the-brain', 'what-causes-the-seasons', 'how-gps-works', 'what-is-dna', 'how-black-holes-form', 'what-is-the-placebo-effect', 'how-does-photosynthesis-work', 'why-do-we-dream', 'why-do-we-get-goosebumps'] },
  { lang: 'en', slug: 'art', title: 'Art', description: 'Stories about art, design, and creative culture from the region and beyond.', files: ['what-is-minimalism-in-art', 'what-is-pointillism', 'what-is-islamic-geometric-art', 'how-to-understand-modern-art', 'role-of-calligraphy-in-islamic-art', 'how-museums-decide-art-value', 'what-is-impressionism', 'how-photography-became-fine-art', 'what-is-street-art', 'history-and-meaning-of-mona-lisa', 'how-art-restoration-works', 'what-is-cubism', 'what-is-surrealism'] },
  { lang: 'en', slug: 'stories', title: 'Stories', description: 'Human-interest stories and narrative features worth reading, from classic tales to timeless legends.', files: ['legend-of-el-cid', 'scheherazade-one-thousand-and-one-nights', 'antara-ibn-shaddad-legend', 'salah-ad-din-and-the-crusades', 'legend-of-sinbad-the-sailor', 'ibn-battuta-travels', 'king-arthur-knights-round-table', 'legend-of-robin-hood', 'marco-polo-journey-to-china', 'legend-of-hatim-al-tai', 'legend-of-gilgamesh', 'story-of-layla-and-majnun'] },
  { lang: 'en', slug: 'health', title: 'Health', description: 'Clear, carefully sourced explainers on health topics relevant to everyday life.', files: ['how-antibiotics-work', 'what-is-a-healthy-resting-heart-rate', 'how-much-sleep-do-you-need', 'understanding-blood-pressure-numbers', 'cold-vs-flu-differences', 'how-chronic-stress-affects-the-body', 'type-1-vs-type-2-diabetes', 'how-immune-system-works', 'what-is-the-gut-brain-connection', 'how-fever-actually-works', 'what-causes-seasonal-allergies', 'understanding-herd-immunity'] },
  { lang: 'en', slug: 'nutrition', title: 'Nutrition', description: 'Practical guidance on nutrition, diet, and healthy eating habits.', files: ['what-is-glycemic-index', 'are-organic-foods-healthier', 'what-is-intermittent-fasting', 'how-to-read-a-food-nutrition-label', 'are-dietary-supplements-necessary', 'what-is-the-mediterranean-diet', 'what-are-probiotics', 'natural-vs-added-sugar', 'whole-grains-vs-refined-grains', 'how-caffeine-affects-the-body', 'what-is-food-fortification', 'vitamins-vs-minerals-difference'] },
  { lang: 'en', slug: 'education', title: 'Education', description: 'Guides on education systems, learning paths, and how to learn more effectively.', files: ['how-spaced-repetition-works', 'what-is-the-pygmalion-effect', 'evidence-based-study-techniques', 'iq-vs-eq-difference', 'what-is-montessori-method', 'how-language-learning-works-in-the-brain', 'what-is-the-socratic-method', 'what-is-project-based-learning', 'how-standardized-testing-became-widespread', 'how-bilingual-education-affects-the-brain', 'what-is-the-forgetting-curve', 'what-is-blooms-taxonomy', 'how-reading-aloud-builds-literacy'] },
  { lang: 'en', slug: 'family', title: 'Family', description: 'Practical guidance for family life, parenting, and household decisions.', files: ['what-is-gentle-parenting', 'birth-order-personality-myths', 'signs-of-healthy-family-communication', 'talking-to-kids-about-money', 'understanding-sibling-rivalry', 'authoritative-vs-authoritarian-parenting', 'understanding-blended-families-step-parenting', 'understanding-attachment-styles', 'nuclear-vs-extended-family', 'how-family-rituals-support-child-development', 'understanding-generational-trauma', 'understanding-empty-nest-syndrome', 'what-is-co-parenting'] },
  { lang: 'en', slug: 'people-society', title: 'People and Society', description: 'Explainers on culture, community, and how people live and connect across generations.', files: ['what-is-the-dunbar-number', 'understanding-the-halo-effect', 'what-is-emotional-intelligence', 'gen-z-millennials-gen-x-differences', 'what-is-cultural-intelligence', 'what-is-social-capital', 'understanding-confirmation-bias', 'what-is-groupthink', 'understanding-the-bystander-effect', 'understanding-the-dunning-kruger-effect', 'what-is-the-availability-heuristic', 'what-is-social-loafing', 'understanding-the-peter-principle'] },
  { lang: 'en', slug: 'entertainment-games', title: 'Entertainment and Games', description: 'Coverage of entertainment, gaming, and leisure culture, from classic games to modern digital habits.', files: ['history-of-arcade-games', 'what-is-speedrunning', 'history-and-rules-of-chess', 'how-video-game-addiction-is-defined', 'how-streaming-changed-entertainment', 'history-and-psychology-of-escape-rooms', 'how-esports-became-legitimate-industry', 'history-of-board-games', 'how-hollywood-blockbusters-are-financed', 'history-of-animation-technology', 'how-video-game-loot-boxes-work', 'history-of-trading-card-games', 'history-of-karaoke'] },
  { lang: 'ar', slug: 'around-the-world', title: 'حول العالم', description: 'قصص وشروحات ثقافية من حول العالم، من التقاليد اليومية إلى العادات التي تشكل الحياة في مختلف الثقافات.', files: ['why-some-countries-have-no-army', 'why-do-some-countries-not-observe-daylight-saving', 'why-countries-drive-different-sides', 'unusual-new-year-traditions', 'why-time-zones-exist', 'countries-multiple-capital-cities', 'why-metric-system-not-universal', 'how-international-borders-are-decided', 'why-multiple-time-zones-vs-single', 'how-the-un-actually-works', 'how-the-international-date-line-works', 'why-some-countries-have-more-than-one-official-language', 'why-some-cities-have-sister-cities'] },
  { lang: 'ar', slug: 'self-care', title: 'العناية الذاتية', description: 'إرشادات عملية للعناية الذاتية والراحة النفسية والعادات الصحية اليومية.', files: ['what-is-emotional-regulation', 'what-is-self-care', 'daily-habits-mental-wellbeing', 'what-is-a-digital-detox', 'understanding-burnout-signs-recovery', 'what-is-journaling', 'stress-vs-anxiety-difference', 'what-is-mindfulness-meditation', 'understanding-imposter-syndrome', 'understanding-emotional-labor', 'what-is-cognitive-behavioral-therapy', 'understanding-perfectionism'] },
  { lang: 'ar', slug: 'science', title: 'العلوم', description: 'شروحات واضحة عن العلوم والاكتشافات وكيفية عمل العالم الطبيعي.', files: ['how-does-anesthesia-work', 'how-do-noise-cancelling-headphones-work', 'how-vaccines-work', 'why-is-the-sky-blue', 'how-memory-works-in-the-brain', 'what-causes-the-seasons', 'how-gps-works', 'what-is-dna', 'how-black-holes-form', 'what-is-the-placebo-effect', 'how-does-photosynthesis-work', 'why-do-we-dream', 'why-do-we-get-goosebumps'] },
  { lang: 'ar', slug: 'art', title: 'الفن', description: 'قصص عن الفن والتصميم والثقافة الإبداعية من المنطقة والعالم.', files: ['what-is-minimalism-in-art', 'what-is-pointillism', 'what-is-islamic-geometric-art', 'how-to-understand-modern-art', 'role-of-calligraphy-in-islamic-art', 'how-museums-decide-art-value', 'what-is-impressionism', 'how-photography-became-fine-art', 'what-is-street-art', 'history-and-meaning-of-mona-lisa', 'how-art-restoration-works', 'what-is-cubism', 'what-is-surrealism'] },
  { lang: 'ar', slug: 'stories', title: 'قصص', description: 'قصص إنسانية وتقارير سردية تستحق القراءة، من الحكايات الكلاسيكية إلى الأساطير الخالدة.', files: ['legend-of-el-cid', 'scheherazade-one-thousand-and-one-nights', 'antara-ibn-shaddad-legend', 'salah-ad-din-and-the-crusades', 'legend-of-sinbad-the-sailor', 'ibn-battuta-travels', 'king-arthur-knights-round-table', 'legend-of-robin-hood', 'marco-polo-journey-to-china', 'legend-of-hatim-al-tai', 'legend-of-gilgamesh', 'story-of-layla-and-majnun'] },
  { lang: 'ar', slug: 'health', title: 'الصحة', description: 'شروحات موثوقة وواضحة عن مواضيع صحية تهم الحياة اليومية.', files: ['how-antibiotics-work', 'what-is-a-healthy-resting-heart-rate', 'how-much-sleep-do-you-need', 'understanding-blood-pressure-numbers', 'cold-vs-flu-differences', 'how-chronic-stress-affects-the-body', 'type-1-vs-type-2-diabetes', 'how-immune-system-works', 'what-is-the-gut-brain-connection', 'how-fever-actually-works', 'what-causes-seasonal-allergies', 'understanding-herd-immunity'] },
  { lang: 'ar', slug: 'nutrition', title: 'التغذية', description: 'إرشادات عملية عن التغذية والنظام الغذائي وعادات الأكل الصحية.', files: ['what-is-glycemic-index', 'are-organic-foods-healthier', 'what-is-intermittent-fasting', 'how-to-read-a-food-nutrition-label', 'are-dietary-supplements-necessary', 'what-is-the-mediterranean-diet', 'what-are-probiotics', 'natural-vs-added-sugar', 'whole-grains-vs-refined-grains', 'how-caffeine-affects-the-body', 'what-is-food-fortification', 'vitamins-vs-minerals-difference'] },
  { lang: 'ar', slug: 'education', title: 'التعليم', description: 'أدلة عن الأنظمة التعليمية ومسارات التعلم وكيفية التعلم بفعالية أكبر.', files: ['how-spaced-repetition-works', 'what-is-the-pygmalion-effect', 'evidence-based-study-techniques', 'iq-vs-eq-difference', 'what-is-montessori-method', 'how-language-learning-works-in-the-brain', 'what-is-the-socratic-method', 'what-is-project-based-learning', 'how-standardized-testing-became-widespread', 'how-bilingual-education-affects-the-brain', 'what-is-the-forgetting-curve', 'what-is-blooms-taxonomy', 'how-reading-aloud-builds-literacy'] },
  { lang: 'ar', slug: 'family', title: 'الأسرة', description: 'إرشادات عملية لحياة الأسرة وتربية الأبناء وقرارات المنزل اليومية.', files: ['what-is-gentle-parenting', 'birth-order-personality-myths', 'signs-of-healthy-family-communication', 'talking-to-kids-about-money', 'understanding-sibling-rivalry', 'authoritative-vs-authoritarian-parenting', 'understanding-blended-families-step-parenting', 'understanding-attachment-styles', 'nuclear-vs-extended-family', 'how-family-rituals-support-child-development', 'understanding-generational-trauma', 'understanding-empty-nest-syndrome', 'what-is-co-parenting'] },
  { lang: 'ar', slug: 'people-society', title: 'الناس والمجتمع', description: 'شروحات عن الثقافة والمجتمع وكيفية عيش الناس وتواصلهم عبر الأجيال المختلفة.', files: ['what-is-the-dunbar-number', 'understanding-the-halo-effect', 'what-is-emotional-intelligence', 'gen-z-millennials-gen-x-differences', 'what-is-cultural-intelligence', 'what-is-social-capital', 'understanding-confirmation-bias', 'what-is-groupthink', 'understanding-the-bystander-effect', 'understanding-the-dunning-kruger-effect', 'what-is-the-availability-heuristic', 'what-is-social-loafing', 'understanding-the-peter-principle'] },
  { lang: 'ar', slug: 'entertainment-games', title: 'الترفيه والألعاب', description: 'تغطية للترفيه والألعاب وثقافة أوقات الفراغ، من الألعاب الكلاسيكية إلى العادات الرقمية الحديثة.', files: ['history-of-arcade-games', 'what-is-speedrunning', 'history-and-rules-of-chess', 'how-video-game-addiction-is-defined', 'how-streaming-changed-entertainment', 'history-and-psychology-of-escape-rooms', 'how-esports-became-legitimate-industry', 'history-of-board-games', 'how-hollywood-blockbusters-are-financed', 'history-of-animation-technology', 'how-video-game-loot-boxes-work', 'history-of-trading-card-games', 'history-of-karaoke'] },
];

const siteNav = {
  countries: [
    { slug: 'dubai', titleEn: 'UAE', titleAr: 'الإمارات' },
    { slug: 'saudi', titleEn: 'KSA', titleAr: 'السعودية' },
    { slug: 'egypt', titleEn: 'Egypt', titleAr: 'مصر' }
  ],
  categories: [
    { slug: 'practical-guide', titleEn: 'Practical Guide', titleAr: 'دليل عملي', kind: 'aggregator' },
    { slug: 'around-the-world', titleEn: 'Around the World', titleAr: 'حول العالم', kind: 'placeholder' },
    { slug: 'self-care', titleEn: 'Self Care', titleAr: 'العناية الذاتية', kind: 'placeholder' },
    { slug: 'business', titleEn: 'Business and Economy', titleAr: 'الأعمال والاقتصاد', kind: 'group' },
    { slug: 'technology', titleEn: 'Technology', titleAr: 'التقنية', kind: 'group' },
    { slug: 'science', titleEn: 'Science', titleAr: 'العلوم', kind: 'placeholder' },
    { slug: 'art', titleEn: 'Art', titleAr: 'الفن', kind: 'placeholder' },
    { slug: 'stories', titleEn: 'Stories', titleAr: 'قصص', kind: 'placeholder' },
    { slug: 'health', titleEn: 'Health', titleAr: 'الصحة', kind: 'placeholder' },
    { slug: 'nutrition', titleEn: 'Nutrition', titleAr: 'التغذية', kind: 'placeholder' },
    { slug: 'islamic', titleEn: 'Islamic Knowledge', titleAr: 'المعرفة الإسلامية', kind: 'group' },
    { slug: 'education', titleEn: 'Education', titleAr: 'التعليم', kind: 'placeholder' },
    { slug: 'family', titleEn: 'Family', titleAr: 'الأسرة', kind: 'placeholder' },
    { slug: 'people-society', titleEn: 'People and Society', titleAr: 'الناس والمجتمع', kind: 'placeholder' },
    { slug: 'world-cup-2026', titleEn: 'Sports', titleAr: 'الرياضة', kind: 'external-reuse' },
    { slug: 'entertainment-games', titleEn: 'Entertainment and Games', titleAr: 'الترفيه والألعاب', kind: 'placeholder' }
  ]
};
const categoryByArticle = new Map(categoryGroups.flatMap((group) =>
  group.files.map((slug) => [`${group.lang}/article/${slug}.html`, group])
));
const knownCategoryHrefs = new Set(categoryGroups.map((group) => `/${group.lang}/category/${group.slug}.html`));
const categoryFallback = new Map([
  ['en', { lang: 'en', slug: 'dubai', title: 'Dubai & UAE Places' }],
  ['ar', { lang: 'ar', slug: 'saudi', title: 'السعودية: التاريخ والثقافة' }]
]);
const pairedPages = new Map([
  ['en/', 'ar/'],
  ['ar/', 'en/'],
  ['en/about.html', 'ar/about.html'],
  ['ar/about.html', 'en/about.html'],
  ['en/contact.html', 'ar/contact.html'],
  ['ar/contact.html', 'en/contact.html'],
  ['en/privacy.html', 'ar/privacy.html'],
  ['ar/privacy.html', 'en/privacy.html'],
  ['en/terms.html', 'ar/terms.html'],
  ['ar/terms.html', 'en/terms.html'],
  ['en/work-with-us.html', 'ar/work-with-us.html'],
  ['ar/work-with-us.html', 'en/work-with-us.html'],
  ['en/newsletter-template.html', 'ar/newsletter-template.html'],
  ['ar/newsletter-template.html', 'en/newsletter-template.html'],
  ['en/newsletter.html', 'ar/newsletter.html'],
  ['ar/newsletter.html', 'en/newsletter.html']
]);
pairedPages.set('en/category/world-cup-2026.html', 'ar/category/world-cup-2026.html');
pairedPages.set('ar/category/world-cup-2026.html', 'en/category/world-cup-2026.html');
pairedPages.set('en/category/egypt.html', 'ar/category/egypt.html');
pairedPages.set('ar/category/egypt.html', 'en/category/egypt.html');
pairedPages.set('en/category/egypt-guides.html', 'ar/category/egypt-guides.html');
pairedPages.set('ar/category/egypt-guides.html', 'en/category/egypt-guides.html');
pairedPages.set('en/category/around-the-world.html', 'ar/category/around-the-world.html');
pairedPages.set('ar/category/around-the-world.html', 'en/category/around-the-world.html');
pairedPages.set('en/category/self-care.html', 'ar/category/self-care.html');
pairedPages.set('ar/category/self-care.html', 'en/category/self-care.html');
pairedPages.set('en/category/science.html', 'ar/category/science.html');
pairedPages.set('ar/category/science.html', 'en/category/science.html');
pairedPages.set('en/category/art.html', 'ar/category/art.html');
pairedPages.set('ar/category/art.html', 'en/category/art.html');
pairedPages.set('en/category/stories.html', 'ar/category/stories.html');
pairedPages.set('ar/category/stories.html', 'en/category/stories.html');
pairedPages.set('en/category/health.html', 'ar/category/health.html');
pairedPages.set('ar/category/health.html', 'en/category/health.html');
pairedPages.set('en/category/nutrition.html', 'ar/category/nutrition.html');
pairedPages.set('ar/category/nutrition.html', 'en/category/nutrition.html');
pairedPages.set('en/category/education.html', 'ar/category/education.html');
pairedPages.set('ar/category/education.html', 'en/category/education.html');
pairedPages.set('en/category/family.html', 'ar/category/family.html');
pairedPages.set('ar/category/family.html', 'en/category/family.html');
pairedPages.set('en/category/people-society.html', 'ar/category/people-society.html');
pairedPages.set('ar/category/people-society.html', 'en/category/people-society.html');
pairedPages.set('en/category/entertainment-games.html', 'ar/category/entertainment-games.html');
pairedPages.set('ar/category/entertainment-games.html', 'en/category/entertainment-games.html');
pairedPages.set('en/category/practical-guide.html', 'ar/category/practical-guide.html');
pairedPages.set('ar/category/practical-guide.html', 'en/category/practical-guide.html');

const defaultIgnoredDirectoryNames = new Set([
  '.git',
  'node_modules',
  'scripts',
  '.claude',
  '.worktrees',
  'reports',
  'research',
  'docs',
  'deploy',
  'design',
  'api',
]);

const extraIgnoredDirectoryNames = new Set(
  (process.env.PREPARE_IGNORE_DIRS || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
);

function shouldIgnoreDirectory(name) {
  return defaultIgnoredDirectoryNames.has(name)
    || extraIgnoredDirectoryNames.has(name)
    || name.startsWith('.hermes-')
    || name.startsWith('scratch')
    || name.startsWith('tmp-');
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && shouldIgnoreDirectory(entry.name)) continue;
    const path = join(dir, entry.name);
    entry.isDirectory() ? out.push(...await walk(path)) : out.push(path);
  }
  return out;
}

async function addSameSlugArticlePairs() {
  const enArticleFiles = new Set((await readdir(join(root, 'en/article'))).filter((name) => name.endsWith('.html')));
  const arArticleFiles = new Set((await readdir(join(root, 'ar/article'))).filter((name) => name.endsWith('.html')));
  for (const filename of enArticleFiles) {
    if (!arArticleFiles.has(filename)) continue;
    pairedPages.set(`en/article/${filename}`, `ar/article/${filename}`);
    pairedPages.set(`ar/article/${filename}`, `en/article/${filename}`);
  }
}

await addSameSlugArticlePairs();

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function decodeHtmlEntities(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#039;', "'").replaceAll('&#x27;', "'");
}

function absoluteUrl(relativePath) {
  if (relativePath === 'index.html') return 'https://doyouknow.app/';
  if (relativePath === 'en/index.html') return 'https://doyouknow.app/en/';
  if (relativePath === 'ar/index.html') return 'https://doyouknow.app/ar/';
  return `https://doyouknow.app/${relativePath}`;
}

function canonicalPathFromRelative(relativePath) {
  if (relativePath === 'en/index.html') return 'en/';
  if (relativePath === 'ar/index.html') return 'ar/';
  return relativePath;
}

function hreflangBlock(relativePath, lang, canonical) {
  const canonicalPath = canonicalPathFromRelative(relativePath);
  const alternates = [{ hreflang: lang, href: canonical }];
  const paired = pairedPages.get(canonicalPath);
  if (paired) {
    alternates.push({ hreflang: paired.startsWith('ar/') ? 'ar' : 'en', href: absoluteUrl(paired === 'en/' ? 'en/index.html' : paired === 'ar/' ? 'ar/index.html' : paired) });
  }
  alternates.push({ hreflang: 'x-default', href: lang === 'ar' ? 'https://doyouknow.app/ar/' : 'https://doyouknow.app/en/' });
  const deduped = new Map(alternates.map((alternate) => [`${alternate.hreflang}:${alternate.href}`, alternate]));
  return [...deduped.values()].map((alternate) => `<link rel="alternate" hreflang="${alternate.hreflang}" href="${alternate.href}" />`).join('\n');
}

function normalizeHreflang(html, relativePath) {
  const lang = /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1] || absoluteUrl(relativePath);
  const block = hreflangBlock(relativePath, lang, canonical);
  html = html.replace(/<link rel="alternate" hreflang="[^"]+" href="[^"]+" ?\/?>\s*/g, '');
  return html.replace(/(<link rel="canonical" href="[^"]+">)/, `$1\n${block}`);
}

function addRevealClasses(html, className) {
  let count = 0;
  return html.replace(new RegExp(`class="${className}"`, 'g'), () => {
    count += 1;
    const delay = ((count - 1) % 3) + 1;
    return `class="${className} reveal reveal-delay-${delay}"`;
  });
}

function stripSearchAction(html) {
  return html.replace(/<script type="application\/ld\+json">(?=[\s\S]*?"SearchAction")[\s\S]*?<\/script>\s*/g, '');
}

function articleImagePath(lang, slug) {
  return worldCupArticleSlugs.includes(slug)
    ? `/assets/images/world-cup-2026/${slug}.svg`
    : `/assets/images/articles/${lang}-${slug}.svg`;
}

function articleRasterImagePath(lang, slug) {
  return worldCupArticleSlugs.includes(slug)
    ? `/assets/images/world-cup-2026/${slug}.png`
    : `/assets/images/articles/${lang}-${slug}.png`;
}

function updateSocialImageTags(html, imageUrl) {
  html = html
    .replace(/<meta property="og:image" content="[^"]+">/, `<meta property="og:image" content="${imageUrl}">`)
    .replace(/<meta name="twitter:image" content="[^"]+">/, `<meta name="twitter:image" content="${imageUrl}">`);
  if (!html.includes('name="twitter:image"')) {
    html = html.replace(/<meta name="twitter:card" content="summary_large_image">/, `$&\n<meta name="twitter:image" content="${imageUrl}">`);
  }
  return html;
}

function updateArticlePageImage(html, relativeFile) {
  const match = relativeFile.match(/^(en|ar)\/article\/([a-z0-9-]+)\.html$/);
  if (!match) return html;
  const [, lang, slug] = match;
  const imagePath = articleImagePath(lang, slug);
  const isIndexable = !editorialReview.has(relativeFile);
  const socialImagePath = isIndexable ? articleRasterImagePath(lang, slug) : imagePath;
  const socialImageUrl = `https://doyouknow.app${socialImagePath}`;
  html = updateSocialImageTags(html, socialImageUrl);
  if (categoryByArticle.has(relativeFile)) {
    const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '').trim() || slug;
    const alt = lang === 'ar' ? `رسم توضيحي لمقال ${title}` : `Editorial illustration for ${title}`;
    html = html.replace(
      /<div class="featured-image"[\s\S]*?<\/div>/,
      `<img class="featured-image" src="${imagePath}" alt="${escapeHtml(alt)}" width="1200" height="675" loading="eager" fetchpriority="high">`
    );
  }
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (script, raw) => {
    try {
      const data = JSON.parse(raw);
      if (data['@type'] !== 'Article') return script;
      const isRaster = socialImageUrl.endsWith('.png');
      data.image = { '@type': 'ImageObject', url: socialImageUrl, width: 1200, height: isRaster ? 630 : 675 };
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    } catch {
      return script;
    }
  });
  return html;
}

function updateArticleCardImages(html) {
  let cardIndex = 0;
  return html.replace(/<a href="\/(en|ar)\/article\/([a-z0-9-]+)\.html" class="article-card">([\s\S]*?)<div class="card-content">/g, (match, lang, slug, beforeContent) => {
    if (!categoryByArticle.has(`${lang}/article/${slug}.html`)) return match;
    cardIndex += 1;
    const priority = cardIndex <= 3
      ? 'loading="eager" fetchpriority="high"'
      : 'loading="lazy"';
    const image = `<img class="card-image" src="${articleImagePath(lang, slug)}" alt="" width="800" height="450" ${priority}>`;
    const cleaned = beforeContent
      .replace(/<img class="card-image"[^>]*>/g, '')
      .replace(/<div class="card-image"[\s\S]*?<\/div>/g, '')
      .replace(/<span[^>]*>📷<\/span><\/div>/g, '');
    return `<a href="/${lang}/article/${slug}.html" class="article-card">${image}${cleaned}<div class="card-content">`;
  });
}

function optimizeImageAttributes(html) {
  let imgIndex = 0;
  return html.replace(/<img\b[^>]*>/gi, (match) => {
    imgIndex++;
    const isFirst = imgIndex === 1;

    const hasFetchpriority = /fetchpriority\s*=\s*["']/.test(match);
    const hasLoading = /loading\s*=\s*["']/.test(match);
    const hasWidth = /width\s*=\s*["']/.test(match);
    const hasHeight = /height\s*=\s*["']/.test(match);
    const hasDecoding = /decoding\s*=\s*["']/.test(match);

    const attrsToAdd = [];

    if (isFirst) {
      if (!hasFetchpriority) attrsToAdd.push(`fetchpriority="high"`);
      if (!hasLoading) attrsToAdd.push(`loading="eager"`);
      if (!hasWidth) attrsToAdd.push(`width="1200"`);
      if (!hasHeight) attrsToAdd.push(`height="675"`);
    } else {
      if (!hasLoading) attrsToAdd.push(`loading="lazy"`);
      if (!hasWidth) attrsToAdd.push(`width="800"`);
      if (!hasHeight) attrsToAdd.push(`height="450"`);
    }

    if (!hasDecoding) attrsToAdd.push(`decoding="async"`);

    if (attrsToAdd.length === 0) return match;

    const isSelfClosing = match.endsWith('/>');
    const closing = isSelfClosing ? '/>' : '>';
    return match.slice(0, -closing.length) + ' ' + attrsToAdd.join(' ') + closing;
  });
}

function normalizePerformanceAndAccessibility(html) {
  html = html
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/g, '')
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet">\s*/g, '')
    .replace(/<script src="\/assets\/js\/site\.js"><\/script>/g, '<script src="/assets/js/site.js" defer></script>')
    .replace(/<nav class="mobile-nav" role="dialog" aria-label="Mobile menu">/g, '<nav class="mobile-nav" aria-label="Mobile menu">')
    .replace(/<nav class="mobile-nav" role="dialog" aria-label="القائمة المتنقلة">/g, '<nav class="mobile-nav" aria-label="القائمة المتنقلة">')
    .replace(/<div class="tile-info"><h4>/g, '<div class="tile-info"><span class="tile-title">')
    .replace(/<\/h4><span>/g, '</span><span>')
    .replace(/<div class="footer-column"><h4>/g, '<div class="footer-column"><p class="footer-heading">')
    .replace(/<\/h4><ul class="footer-links">/g, '</p><ul class="footer-links">')
    .replace(/aria-label="Instagram">IG<\/a>/g, 'aria-label="IG Instagram">IG</a>')
    .replace(/aria-label="YouTube">YT<\/a>/g, 'aria-label="YT YouTube">YT</a>')
    .replace(/aria-label="TikTok">TT<\/a>/g, 'aria-label="TT TikTok">TT</a>');
  return html;
}

function injectResourceHints(html) {
  // Strip any existing managed resource hints to ensure idempotency
  html = html
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/g, '')
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*/g, '')
    .replace(/<link rel="dns-prefetch" href="https:\/\/www\.googletagmanager\.com">\s*/g, '')
    .replace(/<link rel="preload" href="\/assets\/css\/style\.css" as="style">\s*/g, '')
    .replace(/<link rel="preload" href="\/assets\/js\/site\.js" as="script">\s*/g, '');

  const isArticle = html.includes('class="article-body"');
  let hints = '<link rel="dns-prefetch" href="https://www.googletagmanager.com">\n';
  if (isArticle) {
    hints += '<link rel="preload" href="/assets/js/site.js" as="script">\n';
  }
  const cssLink = '<link rel="stylesheet" href="/assets/css/style.css">';
  if (html.includes(cssLink)) {
    return html.replace(cssLink, `${hints}${cssLink}`);
  }
  return html.replace('</head>', `${hints}</head>`);
}

// --- Critical CSS Extraction and Injection ---

function isCriticalSelector(selector) {
  const s = selector.trim();
  if (s === ':root') return true;
  if (s.startsWith('[data-theme="dark"]')) return true;
  if (s.startsWith('[lang="ar"]')) return true;
  if (s === '*' || s.startsWith('*::')) return true;
  if (s === 'html' || s === 'body' || s.startsWith('body.')) return true;
  if (/^h[1-6]\b/.test(s)) return true;
  if (s === 'p') return true;
  if (s === 'a' || s.startsWith('a:')) return true;
  if (s.startsWith('.skip-link')) return true;
  if (s.startsWith('.site-header')) return true;
  if (s.startsWith('.header-inner')) return true;
  if (s.startsWith('.logo')) return true;
  if (s.startsWith('.main-nav')) return true;
  if (s.startsWith('.nav-links')) return true;
  if (s.startsWith('.header-controls')) return true;
  if (s.startsWith('.lang-switch') || s.startsWith('.theme-toggle') || s.startsWith('.search-toggle')) return true;
  if (s.startsWith('.mobile-menu-btn')) return true;
  if (s.startsWith('.mobile-nav')) return true;
  if (s.startsWith('.nav-dropdown')) return true;
  if (s.startsWith('.nav-item-countries') || s.startsWith('.nav-item-categories')) return true;
  if (s.startsWith('.mobile-nav-heading')) return true;
  if (s.startsWith('.empty-category-state')) return true;
  if (s.startsWith('.hero-section')) return true;
  if (s.startsWith('.hero-inner')) return true;
  if (s.startsWith('.hero-title')) return true;
  if (s.startsWith('.hero-subtitle')) return true;
  if (s.startsWith('.hero-trending')) return true;
  if (s.startsWith('.trending-pill')) return true;
  if (s.startsWith('.newsletter-signup')) return true;
  if (s.startsWith('.btn')) return true;
  if (s.startsWith('.content-section')) return true;
  if (s.startsWith('.section-header')) return true;
  if (s.startsWith('.category-explorer')) return true;
  if (s.startsWith('.category-tile')) return true;
  if (s.startsWith('.category-badge')) return true;
  if (s.startsWith('.article-grid')) return true;
  if (s.startsWith('.article-card')) return true;
  if (s.startsWith('.newsletter-cta')) return true;
  return false;
}

function extractCssBlocks(css) {
  const blocks = [];
  let i = 0;
  while (i < css.length) {
    if (css.slice(i, i + 2) === '/*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    if (/\s/.test(css[i])) { i++; continue; }
    if (css[i] === '@') {
      const blockStart = i;
      const braceIdx = css.indexOf('{', i);
      const semiIdx = css.indexOf(';', i);
      if (braceIdx !== -1 && (semiIdx === -1 || braceIdx < semiIdx)) {
        let depth = 1;
        let j = braceIdx + 1;
        while (j < css.length && depth > 0) {
          if (css[j] === '{') depth++;
          else if (css[j] === '}') depth--;
          j++;
        }
        blocks.push({ type: 'at-rule', content: css.slice(blockStart, j) });
        i = j;
      } else {
        const end = semiIdx === -1 ? css.length : semiIdx + 1;
        blocks.push({ type: 'at-rule', content: css.slice(blockStart, end) });
        i = end;
      }
    } else {
      const braceIdx = css.indexOf('{', i);
      if (braceIdx === -1) break;
      const selector = css.slice(i, braceIdx);
      let depth = 1;
      let j = braceIdx + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      blocks.push({ type: 'rule', selector, content: css.slice(i, j) });
      i = j;
    }
  }
  return blocks;
}

function extractCriticalCSS(cssText) {
  const blocks = extractCssBlocks(cssText);
  const critical = [];
  for (const block of blocks) {
    if (block.type === 'rule') {
      const selectors = block.selector.split(',').map(s => s.trim());
      if (selectors.some(isCriticalSelector)) {
        critical.push(block.content);
      }
    } else if (block.type === 'at-rule' && block.content.includes('{')) {
      const prefix = block.content.slice(0, block.content.indexOf('{'));
      const inner = block.content.slice(block.content.indexOf('{') + 1, block.content.lastIndexOf('}'));
      const innerBlocks = extractCssBlocks(inner);
      const innerCritical = [];
      for (const ib of innerBlocks) {
        if (ib.type === 'rule') {
          const selectors = ib.selector.split(',').map(s => s.trim());
          if (selectors.some(isCriticalSelector)) {
            innerCritical.push(ib.content);
          }
        }
      }
      if (innerCritical.length > 0) {
        critical.push(prefix + '{' + innerCritical.join('') + '}');
      }
    }
  }
  return critical.join('');
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/;\s*}/g, '}')
    .replace(/{\s+/g, '{')
    .replace(/;\s+/g, ';')
    .replace(/,\s+/g, ',')
    .replace(/:\s+/g, ':')
    .replace(/\s+{/g, '{')
    .trim();
}

function injectCriticalCSS(html, criticalCSS) {
  const stylesheetLink = '<link rel="stylesheet" href="/assets/css/style.css">';
  const stylesheetLinkPattern = /<link rel="stylesheet" href="\/assets\/css\/style\.css">\s*/g;

  // Normalize previous critical-CSS injections back to a single stylesheet anchor.
  html = html
    .replace(/<style(?:\s+data-critical="true")?>[\s\S]*?<\/style>\s*/g, '')
    .replace(/<link rel="preload" href="\/assets\/css\/style\.css" as="style"[^>]*>\s*/g, '')
    .replace(/<\/?noscript>/g, '');

  let hasStylesheet = false;
  html = html.replace(stylesheetLinkPattern, () => {
    if (hasStylesheet) return '';
    hasStylesheet = true;
    return stylesheetLink;
  });
  const inlineStyle = `<style data-critical="true">${criticalCSS}</style>`;
  const preloadLink = `<link rel="preload" href="/assets/css/style.css" as="style" onload="this.onload=null;this.rel='stylesheet'">`;
  const noscriptFallback = `<noscript><link rel="stylesheet" href="/assets/css/style.css"></noscript>`;
  const replacement = `${inlineStyle}\n${preloadLink}\n${noscriptFallback}`;
  if (!hasStylesheet) return html.replace('</head>', `${replacement}</head>`);
  html = html.replace(stylesheetLink, replacement);
  return html;
}

function linkExistingCategory(html, relativeFile) {
  const lang = relativeFile.startsWith('ar/') || /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
  const category = categoryByArticle.get(relativeFile) || categoryFallback.get(lang);
  const categoryHref = `/${category.lang}/category/${category.slug}.html`;
  const categoryTitle = category.title;
  const categoryUrl = `https://doyouknow.app${categoryHref}`;
  html = html
    .replaceAll(`/${lang}/category/General.html`, categoryHref)
    .replaceAll(`https://doyouknow.app/${lang}/category/General.html`, categoryUrl)
    .replace(/"item":\s*"https:\/\/doyouknow\.app\/(?:en|ar)\/category\/General\.html"/g, `"item": "${categoryUrl}"`);
  html = html.replace(/(<span class="category-badge[^"]*"><a href=")[^"]+(">)([\s\S]*?)(<\/a><\/span>)/, `$1${categoryHref}$2${escapeHtml(categoryTitle)}$4`);
  html = html.replace(/(<nav class="breadcrumb" aria-label="breadcrumb"><ol><li><a href="\/(?:en|ar)\/">[\s\S]*?<\/a><\/li><li><a href=")[^"]+(">)([\s\S]*?)(<\/a><\/li>)/, `$1${categoryHref}$2${escapeHtml(categoryTitle)}$4`);
  return html;
}


function buildNavListItems(lang) {
  const rtl = lang === 'ar';
  const countries = siteNav.countries.map((c) => ({
    href: `/${lang}/category/${c.slug}.html`,
    label: rtl ? c.titleAr : c.titleEn
  }));
  const categories = siteNav.categories.map((c) => ({
    href: `/${lang}/category/${c.slug}.html`,
    label: rtl ? c.titleAr : c.titleEn
  }));
  return { countries, categories };
}

function renderFullHeader(lang) {
  const rtl = lang === 'ar';
  const home = `/${lang}/`;
  const nav = buildNavListItems(lang);
  const t = rtl ? {
    skip: 'انتقل إلى المحتوى',
    home: 'الرئيسية',
    countries: 'الدول',
    categories: 'الأقسام',
    about: 'عن الموقع',
    contact: 'اتصل بنا',
    mainNavAria: 'التنقل الرئيسي',
    search: 'بحث',
    switchLang: 'تغيير اللغة',
    switchLangLabel: 'English',
    toggleDark: 'تبديل الوضع الداكن',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    mobileNavAria: 'القائمة المتنقلة'
  } : {
    skip: 'Skip to content',
    home: 'Home',
    countries: 'Countries',
    categories: 'Categories',
    about: 'About',
    contact: 'Contact',
    mainNavAria: 'Main navigation',
    search: 'Search',
    switchLang: 'Switch language',
    switchLangLabel: 'العربية',
    toggleDark: 'Toggle dark mode',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mobileNavAria: 'Mobile menu'
  };

  const countriesLis = nav.countries.map((c) => `<li><a href="${c.href}">${escapeHtml(c.label)}</a></li>`).join('');
  const categoriesLis = nav.categories.map((c) => `<li><a href="${c.href}">${escapeHtml(c.label)}</a></li>`).join('');
  const countriesMenuId = `countries-menu-${lang}`;
  const categoriesMenuId = `categories-menu-${lang}`;

  const desktopNav = `<nav class="main-nav" role="navigation" aria-label="${t.mainNavAria}"><ul class="nav-links"><li><a href="${home}">${t.home}</a></li><li class="nav-item-countries"><button class="nav-dropdown-toggle" aria-expanded="false" aria-controls="${countriesMenuId}">${t.countries}</button><ul class="nav-dropdown" id="${countriesMenuId}">${countriesLis}</ul></li><li class="nav-item-categories"><button class="nav-dropdown-toggle" aria-expanded="false" aria-controls="${categoriesMenuId}">${t.categories}</button><ul class="nav-dropdown nav-dropdown-mega" id="${categoriesMenuId}">${categoriesLis}</ul></li><li><a href="/${lang}/about.html">${t.about}</a></li><li><a href="/${lang}/contact.html">${t.contact}</a></li></ul></nav>`;

  const header = `<header class="site-header" role="banner"><div class="header-inner"><a href="${home}" class="logo" aria-label="doyouknow.app home"><div class="logo-icon" aria-hidden="true"></div><span class="logo-text">doyouknow<span class="accent">.app</span></span></a>${desktopNav}<div class="header-controls"><button class="search-toggle" aria-label="${t.search}" title="${t.search}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></button><button class="lang-switch" aria-label="${t.switchLang}">${t.switchLangLabel}</button><button class="theme-toggle" aria-label="${t.toggleDark}">🌙</button></div><button class="mobile-menu-btn" aria-label="${t.openMenu}" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button></div></header>`;

  const mobileCountriesLis = nav.countries.map((c) => `<li><a href="${c.href}">${escapeHtml(c.label)}</a></li>`).join('');
  const mobileCategoriesLis = nav.categories.map((c) => `<li><a href="${c.href}">${escapeHtml(c.label)}</a></li>`).join('');

  const mobileNav = `<div class="mobile-nav-overlay" role="presentation" aria-hidden="true"></div><nav class="mobile-nav" aria-label="${t.mobileNavAria}"><button class="mobile-nav-close" aria-label="${t.closeMenu}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button><ul class="mobile-nav-links"><li><a href="${home}">${t.home}</a></li><li class="mobile-nav-heading">${t.countries}</li>${mobileCountriesLis}<li class="mobile-nav-heading">${t.categories}</li>${mobileCategoriesLis}<li><a href="/${lang}/about.html">${t.about}</a></li><li><a href="/${lang}/contact.html">${t.contact}</a></li></ul></nav>`;

  return `<a href="#main-content" class="skip-link">${t.skip}</a>\n${header}\n${mobileNav}`;
}

function renderFullFooter(lang) {
  const rtl = lang === 'ar';
  const home = `/${lang}/`;
  const t = rtl ? {
    tagline: 'هل تعلم؟ الآن أنت تعلم.',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    subscribe: 'اشترك',
    explore: 'استكشف',
    categoriesLabel: 'الأقسام',
    didYouKnow: 'هل تعلم',
    dubaiUae: 'دبي والإمارات',
    guides: 'دليل عملي',
    sitemap: 'خريطة الموقع',
    company: 'الشركة',
    aboutUs: 'من نحن',
    workWithUs: 'اعمل معنا',
    editorialPolicy: 'السياسة التحريرية',
    contact: 'اتصل بنا',
    privacy: 'الخصوصية',
    terms: 'الشروط',
    connect: 'تواصل',
    newsletter: 'النشرة البريدية'
  } : {
    tagline: 'Did you know? Now you do.',
    emailPlaceholder: 'Enter your email',
    subscribe: 'Subscribe',
    explore: 'Explore',
    categoriesLabel: 'Categories',
    didYouKnow: 'Did You Know',
    dubaiUae: 'Dubai &amp; UAE',
    guides: 'Guides',
    sitemap: 'Sitemap',
    company: 'Company',
    aboutUs: 'About Us',
    workWithUs: 'Work With Us',
    editorialPolicy: 'Editorial Policy',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    connect: 'Connect',
    newsletter: 'Newsletter'
  };

  return `<footer class="site-footer" role="contentinfo"><div class="footer-inner"><div class="footer-brand"><span class="logo-text">doyouknow.app</span><p class="tagline">${t.tagline}</p><form class="footer-newsletter newsletter-form" data-newsletter-location="footer_cta" aria-label="${t.newsletter}"><input type="email" name="email" placeholder="${t.emailPlaceholder}" aria-label="${t.emailPlaceholder}" autocomplete="email" required><button class="btn btn-primary" type="submit">${t.subscribe}</button><p class="newsletter-consent">${rtl ? 'بإرسالك البريد، توافق على تلقي النشرة. يمكنك إلغاء الاشتراك أو طلب تصدير/حذف بياناتك عبر hello@doyouknow.app.' : 'By subscribing, you consent to receive the newsletter. Unsubscribe or request export/deletion via hello@doyouknow.app.'}</p></form></div><div class="footer-column"><p class="footer-heading">${t.explore}</p><ul class="footer-links"><li><a href="/${lang}/#categories">${t.categoriesLabel}</a></li><li><a href="${home}">${t.didYouKnow}</a></li><li><a href="/${lang}/category/dubai.html">${t.dubaiUae}</a></li><li><a href="/${lang}/category/practical-guide.html">${t.guides}</a></li><li><a href="/sitemap.xml">${t.sitemap}</a></li></ul></div><div class="footer-column"><p class="footer-heading">${t.company}</p><ul class="footer-links"><li><a href="/${lang}/about.html">${t.aboutUs}</a></li><li><a href="/${lang}/work-with-us.html">${t.workWithUs}</a></li><li><a href="/${lang}/about.html">${t.editorialPolicy}</a></li><li><a href="/${lang}/contact.html">${t.contact}</a></li><li><a href="/${lang}/privacy.html">${t.privacy}</a></li><li><a href="/${lang}/terms.html">${t.terms}</a></li></ul></div><div class="footer-column"><p class="footer-heading">${t.connect}</p><ul class="footer-links"><li><a href="https://instagram.com/doyouknowapp">Instagram</a></li><li><a href="https://tiktok.com/@doyouknowapp">TikTok</a></li><li><a href="https://twitter.com/doyouknowapp">X / Twitter</a></li><li><a href="https://youtube.com/doyouknowapp">YouTube</a></li><li><a href="https://wa.me/">WhatsApp</a></li><li><a href="/${lang}/newsletter.html">${t.newsletter}</a></li></ul></div></div><div class="footer-bottom"><span class="copyright">© 2026 doyouknow.app</span><div class="social-links"><a href="https://instagram.com/doyouknowapp" target="_blank" rel="noopener" aria-label="IG Instagram">IG</a><a href="https://twitter.com/doyouknowapp" target="_blank" rel="noopener" aria-label="X / Twitter">X</a><a href="https://youtube.com/doyouknowapp" target="_blank" rel="noopener" aria-label="YT YouTube">YT</a><a href="https://tiktok.com/@doyouknowapp" target="_blank" rel="noopener" aria-label="TT TikTok">TT</a></div></div></footer>`;
}

function injectSharedHeader(html, relativeFile) {
  if (relativeFile === 'en/newsletter-template.html' || relativeFile === 'ar/newsletter-template.html') return html;
  const lang = /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
  html = html
    .replace(/<a href="#main-content" class="skip-link">[\s\S]*?<\/a>\s*/, '')
    .replace(/<header class="site-header"[\s\S]*?<\/header>\s*/, '')
    .replace(/<div class="mobile-nav-overlay"[\s\S]*?<\/nav>\s*/, '')
    .replace(/<footer class="site-footer"[\s\S]*?<\/footer>\s*/, '');
  const headerBundle = renderFullHeader(lang);
  const footerBundle = renderFullFooter(lang);
  if (/<body[^>]*>/.test(html)) {
    html = html.replace(/(<body[^>]*>)/, `$1${headerBundle}`);
  }
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${footerBundle}</body>`);
  } else {
    html += footerBundle;
  }
  return html;
}



const englishStopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as','is','was','are','this','that','it','you','your','our','we','us','me','my','his','her','their','them','they','he','she','i','am','be','been','have','has','had','do','does','did','will','would','could','should','may','might','can','shall','about','above','across','after','against','along','among','around','before','behind','below','beneath','beside','between','beyond','down','during','except','inside','into','near','off','onto','outside','over','since','through','throughout','till','toward','under','until','up','upon','within','without']);
const arabicStopWords = new Set(['في','من','إلى','عن','على','مع','هي','هو','أن','لا','كان','قد','كل','بعض','هذه','هذا','الذين','التي','التى','و','ما','لا','لم','لن','لها','له','كما','بعد','قبل','بين','تحت','فوق','حول','خلال','دون','سوى','غير','لكن','لذلك','إلا','حتى','حيث','إذا','اذا','عند','عندما','حين','لأن','لان','لأنه','بسبب','نظرا','رغم','على','ضد','بجانب','بعيد','قريب','أمام','خلف','يمين','يسار','شمال','جنوب','شرق','غرب','أول','ثان','ثالث','رابع','خمس','ست','سبع','ثمان','تسع','عشر','مئة','ألف','مليون','مليار']);

function extractArticleBodyHtml(html) {
  const startMatch = html.match(/<div class="article-body"[^>]*>/);
  if (!startMatch) return '';
  const start = startMatch.index + startMatch[0].length;
  let depth = 1;
  let i = start;
  while (i < html.length && depth > 0) {
    if (html.substring(i, 4) === '<div' && (html[i + 4] === ' ' || html[i + 4] === '>')) {
      depth++;
      i += 4;
    } else if (html.substring(i, 6) === '</div>') {
      depth--;
      if (depth === 0) break;
      i += 6;
    } else {
      i++;
    }
  }
  return html.slice(start, i);
}

function countWords(text, lang) {
  const stripped = text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
  if (!stripped) return 0;
  const tokens = stripped.split(/\s+/).filter(t => /[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(t));
  return tokens.length;
}

function extractFaqPairs(html, lang) {
  const faqs = [];
  // First try .faq-item / .faq-question / .faq-answer pattern
  const faqItemRegex = /<div class="faq-item"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="faq-item"|<div class="share-bar"|<\/div>\s*$)/g;
  let m;
  while ((m = faqItemRegex.exec(html)) !== null) {
    const item = m[1];
    const qMatch = item.match(/<[^>]*class="faq-question"[^>]*>([\s\S]*?)<\/[^>]*>/);
    const aMatch = item.match(/<[^>]*class="faq-answer"[^>]*>([\s\S]*?)<\/[^>]*>/);
    if (qMatch && aMatch) {
      faqs.push({ question: stripHtmlTags(qMatch[1]), answer: stripHtmlTags(aMatch[1]) });
    }
  }
  if (faqs.length > 0) return faqs;

  // Fallback: extract from FAQ section
  const faqH2Regex = /<h2[^>]*(?:id="faq(?:s)?"|id="[^"]*أسئلة[^"]*")[^>]*>([\s\S]*?)<\/h2>/i;
  let faqH2Match = html.match(faqH2Regex);
  if (!faqH2Match) {
    const faqSectionMatch = html.match(/<h2[^>]*>[\s\S]*?(?:FAQ|أسئلة شائعة|الأسئلة الشائعة)[\s\S]*?<\/h2>/i);
    if (!faqSectionMatch) return faqs;
    faqH2Match = faqSectionMatch;
  }

  const faqStartIndex = html.indexOf(faqH2Match[0]) + faqH2Match[0].length;
  const faqSection = html.slice(faqStartIndex);
  const nextH2 = faqSection.search(/<h2[^>]*>/i);
  const shareBar = faqSection.search(/<div class="share-bar">/);
  let endIndex = faqSection.length;
  if (nextH2 !== -1) endIndex = Math.min(endIndex, nextH2);
  if (shareBar !== -1) endIndex = Math.min(endIndex, shareBar);
  const faqContent = faqSection.slice(0, endIndex);

  if (lang === 'ar') {
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let p;
    let pendingQuestion = null;
    while ((p = pRegex.exec(faqContent)) !== null) {
      const text = p[1].trim();
      if (/<strong>/.test(text)) {
        if (pendingQuestion) {
          faqs.push({ question: pendingQuestion, answer: '' });
        }
        pendingQuestion = stripHtmlTags(text);
      } else if (pendingQuestion) {
        faqs.push({ question: pendingQuestion, answer: stripHtmlTags(text) });
        pendingQuestion = null;
      }
    }
    if (pendingQuestion) {
      faqs.push({ question: pendingQuestion, answer: '' });
    }
  } else {
    const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/g;
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
    const h3Positions = [];
    let h3;
    while ((h3 = h3Regex.exec(faqContent)) !== null) {
      h3Positions.push({ index: h3.index, text: h3[1] });
    }
    const pPositions = [];
    let p;
    while ((p = pRegex.exec(faqContent)) !== null) {
      pPositions.push({ index: p.index, text: p[1] });
    }
    for (let i = 0; i < h3Positions.length; i++) {
      const q = h3Positions[i];
      const nextH3 = h3Positions[i + 1];
      const answers = pPositions.filter(pp => pp.index > q.index && (!nextH3 || pp.index < nextH3.index));
      if (answers.length > 0) {
        faqs.push({ question: stripHtmlTags(q.text), answer: stripHtmlTags(answers[0].text) });
      } else {
        faqs.push({ question: stripHtmlTags(q.text), answer: '' });
      }
    }
  }

  return faqs;
}

function injectSchemas(html, relativeFile) {
  const isArticle = /^(en|ar)\/article\/[a-z0-9-]+\.html$/.test(relativeFile);
  if (!isArticle) return html;

  const lang = relativeFile.startsWith('ar/') ? 'ar' : 'en';

  const bodyHtml = extractArticleBodyHtml(html);
  const wordCount = countWords(bodyHtml, lang);
  const readingTime = Math.ceil(wordCount / (lang === 'ar' ? 150 : 200));
  const readingTimeText = lang === 'ar'
    ? `${readingTime} ${readingTime === 1 ? 'دقيقة' : 'دقائق'}`
    : `${readingTime} min read`;

  // Replace reading time
  html = html.replace(/<span class="read-time">[^<]*<\/span>/, `<span class="read-time">${readingTimeText}</span>`);

  const faqs = extractFaqPairs(html, lang);

  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(/\s*\|\s*doyouknow\.app$/, '') || '';
  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1] || '';
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1] || '';
  const featuredImage = html.match(/<img class="featured-image"[^>]*src="([^"]+)"/)?.[1] || '';
  const imageUrl = ogImage || (featuredImage ? (featuredImage.startsWith('http') ? featuredImage : `https://doyouknow.app${featuredImage}`) : '');
  const timeMatch = html.match(/<time datetime="([^"]+)">/);
  const datePublished = timeMatch?.[1] || '2026-06-26';
  const dateModified = datePublished;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1] || `https://doyouknow.app/${relativeFile}`;
  const category = categoryByArticle.get(relativeFile) || categoryFallback.get(lang);
  const articleSection = category?.title || (lang === 'ar' ? 'عام' : 'General');
  const authorUrl = `https://doyouknow.app/${lang}/about.html`;

  const keywords = getKeywords(html, description, lang).join(', ');

  const articleBody = stripHtmlTags(bodyHtml).slice(0, 300);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: {
      '@type': 'Organization',
      name: 'doyouknow.app Editorial Team',
      url: authorUrl,
      sameAs: [
        'https://instagram.com/doyouknowapp',
        'https://twitter.com/doyouknowapp'
      ]
    },
    publisher: { '@type': 'Organization', name: 'doyouknow.app', logo: { '@type': 'ImageObject', url: 'https://doyouknow.app/assets/images/logo.png' } },
    datePublished,
    dateModified,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection,
    keywords,
    wordCount,
    articleBody,
    inLanguage: lang
  };

  if (imageUrl) {
    const isRaster = imageUrl.endsWith('.png');
    articleSchema.image = { '@type': 'ImageObject', url: imageUrl, width: 1200, height: isRaster ? 630 : 675 };
  }

  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null;

  // Remove existing Article and FAQPage schemas while keeping others
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (match, content) => {
    try {
      const data = JSON.parse(content);
      if (data['@type'] === 'Article' || data['@type'] === 'FAQPage') return '';
      return match;
    } catch {
      return match;
    }
  });

  // Clean up any double newlines left by removed scripts
  html = html.replace(/\n{3,}/g, '\n\n');

  // Inject new schemas before </head>
  const articleScript = `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`;
  const faqScript = faqSchema ? `\n<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : '';

  html = html.replace('</head>', `${articleScript}${faqScript}\n</head>`);

  return html;
}
const criticalCSS = minifyCSS(extractCriticalCSS(await readFile(join(root, 'assets/css/style.css'), 'utf8')));
console.log('Critical CSS size:', criticalCSS.length, 'bytes');

const htmlFiles = (await walk(root)).filter((path) => path.endsWith('.html'));
for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  const relativeFile = file.slice(root.length);
  html = html
    .replaceAll('/doyouknow-app-site/', '/')
    .replace(/<meta name="keywords"[^>]*>\s*/g, '')
    .replaceAll('/en/category/UAE-Heritage/', '/en/category/General.html')
    .replaceAll('/en/category/KSA-Heritage/', '/en/category/General.html')
    .replaceAll('/en/category/Quick-Facts/', '/en/category/General.html')
    .replaceAll('/en/category/Travel/', '/en/category/General.html')
    .replaceAll('/en/category/Compare/', '/en/category/General.html')
    .replaceAll('/ar/category/UAE-Heritage/', '/ar/category/General.html')
    .replaceAll('/ar/category/KSA-Heritage/', '/ar/category/General.html')
    .replaceAll('/ar/category/Quick-Facts/', '/ar/category/General.html')
    .replaceAll('/ar/category/Travel/', '/ar/category/General.html')
    .replaceAll('/ar/category/Compare/', '/ar/category/General.html')
    .replace(/\/(en|ar)\/article\/([a-z0-9-]+)\//g, '/$1/article/$2.html')
    .replace(/\/(en|ar)\/category\/UAE-Heritage\//g, '/$1/category/General.html')
    .replace(/\/(en|ar)\/category\/KSA-Heritage\//g, '/$1/category/General.html')
    .replace(/\/(en|ar)\/category\/Quick-Facts\//g, '/$1/category/General.html')
    .replace(/\/(en|ar)\/category\/Travel\//g, '/$1/category/General.html')
    .replace(/\/(en|ar)\/category\/Compare\//g, '/$1/category/General.html')
    .replace(/\/(en|ar)\/newsletter\//g, '/$1/newsletter.html')
    .replace(/\/(en|ar)\/team\//g, '/$1/about.html')
    .replaceAll('10 Facts About Uae Formation', "10 Facts About the UAE's Formation in 1971")
    .replaceAll('Read this fascinating article on doyouknow.app...', 'Discover the decisions, leaders, and milestones that united the seven emirates.')
    .replaceAll('Join 10,000+ curious readers. No spam. Unsubscribe anytime.', 'Get a carefully curated bilingual newsletter. No spam; unsubscribe anytime.')
    .replaceAll('انضم إلى أكثر من 10,000 قارئ فضولي. لا رسائل مزعجة.', 'اشترك في نشرة معرفية مختارة بعناية. بلا رسائل مزعجة ويمكنك إلغاء الاشتراك في أي وقت.')
    .replace(/(<link rel="alternate" hreflang="[^"]+" href=")\//g, '$1https://doyouknow.app/')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  // Remove discovery cards for retired UAE history and politics content.
  for (const slug of removedArticleSlugs) {
    const href = `/en/article/${slug}.html`;
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html
      .replace(new RegExp(`<a href="${escapedHref}" class="article-card">[\\s\\S]*?<\\/a>`, 'g'), '')
      .replace(new RegExp(`<a href="${escapedHref}" class="related-card">[\\s\\S]*?<\\/a>`, 'g'), '');
  }
  html = html
    .replace(/<p>Curious about the UAE's history\?[\s\S]*?<\/p>/g, '')
    .replace(/<p>Want more UAE facts\? Read our [\s\S]*?<\/p>/g, '')
    .replace(/<p>Looking for more UAE facts\? Explore our [\s\S]*?<\/p>/g, '')
    .replace(/<p>The name changed to Burj Khalifa at the last minute\.[\s\S]*?<\/p>/g, '')
    .replaceAll('/en/article/10-facts-about-uae-formation.html', '/en/article/burj-khalifa-facts.html')
    .replaceAll("10 Facts About the UAE's Formation in 1971", "Burj Khalifa: 10 Surprising Facts You Didn't Know")
    .replaceAll('Discover the decisions, leaders, and milestones that united the seven emirates.', 'Discover the design, engineering, and records behind the world’s tallest building.');

  // Preserve useful navigation without shipping dead internal links from drafts.
  const replacements = new Map();
  for (const match of html.matchAll(/href="([^"#]+)"/g)) {
    const href = match[1];
    if (!href.startsWith('/')) continue;
    const clean = href.split('?')[0];
    const target = join(root, clean);
    try { await access(target.endsWith('/') ? join(target, 'index.html') : target); }
    catch {
      if (knownCategoryHrefs.has(clean)) continue;
      const language = clean.startsWith('/ar/') ? 'ar' : 'en';
      replacements.set(href, `/${language}/`);
    }
  }
  for (const [from, to] of replacements) html = html.replaceAll(`href="${from}"`, `href="${to}"`);
  const descriptions = new Map([
    ["Read about 10 Facts About the UAE's Formation in 1971 on doyouknow.app", "Discover 10 defining facts about the UAE's formation in 1971, from the union of the emirates to the leaders and milestones that shaped the nation."],
    ['Read about Deep Dive Dubai on doyouknow.app', "Explore Deep Dive Dubai, the record-breaking 60-metre diving pool, with key facts, visitor guidance, safety notes, and what makes it unique."],
    ['Read about Dubai Metro Guide on doyouknow.app', "Plan your journey with this practical Dubai Metro guide covering lines, stations, Nol cards, fares, operating basics, accessibility, and useful travel tips."],
    ['Read about History Pearl Diving Uae on doyouknow.app', "Explore the history of pearl diving in the UAE, the divers and dhow crews behind the trade, and how this demanding heritage shaped Emirati life."],
    ['Read about Uae Golden Visa Guide on doyouknow.app', "Understand the UAE Golden Visa routes, broad eligibility categories, application steps, and the official sources to check before you apply."],
    ['Read about Qobool Guide on doyouknow.app', 'دليل مبسط لاستخدام منصة قبول في السعودية، من إنشاء الحساب وترتيب الرغبات إلى متابعة الطلب والتحقق من أحدث التعليمات الرسمية.'],
    ['Read about What Is Neom on doyouknow.app', 'ما هو مشروع نيوم؟ تعرف على مناطق المشروع وأهدافه وعلاقته برؤية السعودية 2030، مع فصل الحقائق الرسمية عن الوعود المستقبلية.'],
    ['Read about Saudi No Rivers on doyouknow.app', 'هل تعلم أن السعودية لا تضم أنهاراً دائمة؟ اكتشف الأسباب الجغرافية ومصادر المياه والحلول التي تعتمد عليها المملكة لتلبية احتياجاتها.']
    ,['Privacy policy for doyouknow.app.', 'Learn how doyouknow.app handles technical logs, analytics, newsletter consent, personal information, and privacy questions.']
    ,['Terms of use for doyouknow.app.', 'Read the doyouknow.app terms covering informational content, editorial corrections, reader responsibilities, and intellectual property.']
    ,['سياسة الخصوصية لموقع doyouknow.app.', 'تعرف على كيفية تعامل موقع doyouknow.app مع السجلات التقنية والتحليلات وموافقات النشرة البريدية واستفسارات الخصوصية.']
    ,['شروط استخدام موقع doyouknow.app.', 'اقرأ شروط استخدام موقع doyouknow.app المتعلقة بالمحتوى المعلوماتي والتصحيحات التحريرية ومسؤوليات القارئ وحقوق النشر.']
  ]);
  for (const [from, to] of descriptions) html = html.replaceAll(from, to);
  const textReplacements = new Map([
    ['Uae Golden Visa Guide', 'UAE Golden Visa Guide']
  ]);
  if (relativeFile.startsWith('ar/')) {
    textReplacements.set('Qobool Guide', 'دليل قبول: التقديم ومتابعة القبول الجامعي');
    textReplacements.set('Saudi No Rivers', 'لماذا لا توجد أنهار دائمة في السعودية؟');
    textReplacements.set('What Is Neom', 'ما هو نيوم؟ دليل شامل عن مدينة المستقبل');
    textReplacements.set('Page Not Found', 'الصفحة غير موجودة');
    textReplacements.set('The page you are looking for does not exist.', 'الصفحة التي تبحث عنها غير موجودة. يمكنك العودة إلى الصفحة الرئيسية أو استخدام البحث للوصول إلى المحتوى.');
  }
  for (const [from, to] of textReplacements) html = html.replaceAll(from, to);
  const cardExcerptReplacements = new Map([
    ['Deep Dive Dubai', 'Explore Deep Dive Dubai, the record-breaking 60-metre diving pool, with key facts, visitor guidance, safety notes, and what makes it unique.'],
    ['Dubai Metro Guide', 'Plan your journey with this practical Dubai Metro guide covering lines, stations, Nol cards, fares, operating basics, accessibility, and useful travel tips.'],
    ['UAE Golden Visa Guide', 'Understand the UAE Golden Visa routes, broad eligibility categories, application steps, and the official sources to check before you apply.'],
    ['دليل قبول: التقديم ومتابعة القبول الجامعي', 'دليل مبسط لاستخدام منصة قبول في السعودية، من إنشاء الحساب وترتيب الرغبات إلى متابعة الطلب والتحقق من أحدث التعليمات الرسمية.'],
    ['لماذا لا توجد أنهار دائمة في السعودية؟', 'هل تعلم أن السعودية لا تضم أنهاراً دائمة؟ اكتشف الأسباب الجغرافية ومصادر المياه والحلول التي تعتمد عليها المملكة لتلبية احتياجاتها.'],
    ['ما هو نيوم؟ دليل شامل عن مدينة المستقبل', 'ما هو مشروع نيوم؟ تعرف على مناطق المشروع وأهدافه وعلاقته برؤية السعودية 2030، مع فصل الحقائق الرسمية عن الوعود المستقبلية.']
  ]);
  for (const [title, excerpt] of cardExcerptReplacements) {
    html = html
      .replaceAll(`<h2 class="card-title">${title}</h2><p class="card-excerpt">...</p>`, `<h2 class="card-title">${title}</h2><p class="card-excerpt">${excerpt}</p>`)
      .replaceAll(`<h3 class="card-title">${title}</h3><p class="card-excerpt">...</p>`, `<h3 class="card-title">${title}</h3><p class="card-excerpt">${excerpt}</p>`);
  }
  const titleReplacements = new Map([
    ['<title>الصيام في رمضان: دليل صحي معتمد من طبيب — نصائح علمية للجميع | doyouknow.app</title>', '<title>الصيام الصحي في رمضان: دليل عملي | doyouknow.app</title>'],
    ['<title>Best Beaches in Dubai: 12 Top Picks for Every Type of Traveler | doyouknow.app</title>', '<title>12 Best Beaches in Dubai for Every Traveler | doyouknow.app</title>'],
    ['<title>Best Restaurants in Dubai: 15 Top Picks for Every Taste and Budget | doyouknow.app</title>', '<title>15 Best Restaurants in Dubai for Every Budget | doyouknow.app</title>'],
    ['<title>Hidden Gems in the UAE: 10 Off-the-Beaten-Path Destinations for Locals and Repeat Visitors | doyouknow.app</title>', '<title>10 Hidden Gems in the UAE Worth Exploring | doyouknow.app</title>'],
    ['<title>What Is Google Gemini? How It Works (A Beginner&#x27;s Guide) | doyouknow.app</title>', '<title>What Is Google Gemini? A Beginner’s Guide | doyouknow.app</title>'],
    ['<title>Did You Know? Surprising Facts About UAE, KSA &amp; the World | doyouknow.app</title>', '<title>UAE &amp; Saudi Facts and Guides | doyouknow.app</title>'],
    ['<title>doyouknow.app</title>', '<title>Choose Your Language | doyouknow.app</title>']
  ]);
  for (const [from, to] of titleReplacements) html = html.replaceAll(from, to);
  const shouldNoindex = editorialReview.has(relativeFile)
    || relativeFile.endsWith('404.html')
    || relativeFile === 'index.html'
    || relativeFile.endsWith('/category/General.html');
  html = html.replace(
    /name="robots" content="(?:index|noindex), ?follow"/,
    `name="robots" content="${shouldNoindex ? 'noindex' : 'index'}, follow"`
  );
  html = html
    .replaceAll('/en/category/General.html">UAE</a>', '/en/category/dubai.html">Dubai &amp; UAE</a>')
    .replaceAll('/en/category/General.html">KSA</a>', '/ar/category/saudi.html">KSA</a>')
    .replaceAll('/ar/category/General.html">الإمارات</a>', '/en/category/dubai.html">الإمارات</a>')
    .replaceAll('/ar/category/General.html">السعودية</a>', '/ar/category/saudi.html">السعودية</a>');
  html = html
    .replaceAll('href="/en/category/General.html">Dubai &amp; UAE</a>', 'href="/en/category/dubai.html">Dubai &amp; UAE</a>')
    .replaceAll('href="/ar/category/General.html">KSA</a>', 'href="/ar/category/saudi.html">KSA</a>')
    .replaceAll('href="/en/category/General.html">Did You Know</a>', 'href="/en/">Did You Know</a>')
    .replaceAll('href="/en/category/General.html">Best Of</a>', 'href="/en/category/dubai.html">Best Of</a>')
    .replaceAll('href="/en/category/General.html">Compare</a>', 'href="/en/category/guides.html">Compare</a>')
    .replaceAll('href="/en/category/General.html" class="view-all"', 'href="/en/category/dubai.html" class="view-all"')
    .replaceAll('href="/ar/category/General.html" class="view-all"', 'href="/ar/category/saudi.html" class="view-all"')
    .replaceAll('href="/en/category/General.html">الإمارات</a>', 'href="/en/category/dubai.html">الإمارات</a>')
    .replaceAll('href="/ar/category/General.html">هل تعلم</a>', 'href="/ar/">هل تعلم</a>')
    .replaceAll('href="/ar/category/General.html">الأفضل</a>', 'href="/ar/category/saudi.html">الأفضل</a>')
    .replaceAll('href="/ar/category/General.html">قارن</a>', 'href="/ar/category/guides.html">قارن</a>');
  if (relativeFile === 'en/index.html' || relativeFile === 'ar/index.html') {
    const tileLang = relativeFile.startsWith('ar/') ? 'ar' : 'en';
    const homepageTileSlugs = ['practical-guide', 'technology', 'business', 'islamic', 'world-cup-2026'];
    const homepageTileIcons = { 'practical-guide': '✓', technology: '✦', business: '💼', islamic: '◆', 'world-cup-2026': '⚽' };
    const tileLabels = new Map(siteNav.categories.map((c) => [c.slug, tileLang === 'ar' ? c.titleAr : c.titleEn]));
    const tilesHtml = homepageTileSlugs.map((slug) => `<a href="/${tileLang}/category/${slug}.html" class="category-tile"><div class="tile-icon">${homepageTileIcons[slug]}</div><div class="tile-info"><span class="tile-title">${escapeHtml(tileLabels.get(slug))}</span></div></a>`).join('');
    html = html.replace(/<div class="category-explorer">[\s\S]*?<\/div>\s*(?=<div class="section-header">)/, `<div class="category-explorer">${tilesHtml}</div>\n`);
  }
  html = html.replaceAll('"url": "/assets/images/logo.png"', '"url": "https://doyouknow.app/assets/images/logo.png"');
  if (!html.includes('rel="icon"')) {
    html = html.replace('</head>', '<link rel="icon" href="/assets/images/logo.svg" type="image/svg+xml">\n</head>');
  }
  if (!html.includes('property="og:title"')) {
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || 'doyouknow.app';
    const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1] || '';
    const language = html.includes('lang="ar"') ? 'ar' : 'en';
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1] || `https://doyouknow.app/${language}/`;
    const social = `<meta property="og:title" content="${title}">\n<meta property="og:description" content="${description}">\n<meta property="og:type" content="website">\n<meta property="og:url" content="${canonical}">\n<meta property="og:image" content="https://doyouknow.app/assets/images/og-${language}.png">\n<meta name="twitter:card" content="summary_large_image">`;
    html = html.replace('</head>', `${social}\n</head>`);
  }
  if (!html.includes('G-6VQZY87LJB')) {
    html = html.replace('</head>', `${googleTag}\n</head>`);
  }
  if (!html.includes('application/rss+xml')) {
    const pageLang = /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
    const feedLinks = `<link rel="alternate" type="application/rss+xml" title="RSS" href="/${pageLang}/rss.xml">\n<link rel="alternate" type="application/json" title="JSON Feed" href="/${pageLang}/feed.json">`;
    html = html.replace('</head>', `${feedLinks}\n</head>`);
  }
  html = stripSearchAction(html);
  html = updateArticlePageImage(html, relativeFile);
  html = updateArticleCardImages(html);
  html = optimizeImageAttributes(html);
  html = normalizePerformanceAndAccessibility(html);
  html = linkExistingCategory(html, relativeFile);
  html = injectSharedHeader(html, relativeFile);
  // --- PWA manifest, apple-touch-icon, and theme-color ---
  const pageLang = /<html[^>]*\blang="ar"/.test(html) ? 'ar' : 'en';
  const manifestHref = pageLang === 'ar' ? '/manifest-ar.json' : '/manifest.json';
  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `<link rel="manifest" href="${manifestHref}">\n</head>`);
  }
  if (!html.includes('rel="apple-touch-icon"')) {
    html = html.replace('</head>', '<link rel="apple-touch-icon" href="/assets/images/icon-192.png">\n</head>');
  }
  if (html.includes('name="theme-color"')) {
    html = html.replace(/<meta name="theme-color" content="[^"]+">/, '<meta name="theme-color" content="#F59E0B">');
  } else {
    html = html.replace('</head>', '<meta name="theme-color" content="#F59E0B">\n</head>');
  }

  html = normalizePerformanceAndAccessibility(html);
  html = injectResourceHints(html);
  html = injectCriticalCSS(html, criticalCSS);
  html = normalizeHreflang(html, relativeFile);
  html = addRevealClasses(html, 'article-card');
  html = addRevealClasses(html, 'category-tile');
  let h1Seen = 0;
  html = html.replace(/<\/?h1(?=[\s>])[^>]*>/g, (tag) => {
    if (tag.startsWith('<h1')) h1Seen += 1;
    if (h1Seen <= 1) return tag;
    return tag.replace(tag.startsWith('</') ? '</h1' : '<h1', tag.startsWith('</') ? '</h2' : '<h2');
  });
  html = injectSchemas(html, relativeFile);
  await writeFile(file, html);
}

for (const group of categoryGroups) {
  const articles = [];
  for (const slug of group.files) {
    const articlePath = join(root, group.lang, 'article', `${slug}.html`);
    const article = await readFile(articlePath, 'utf8');
    articles.push({
      slug,
      title: decodeHtmlEntities(article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, '') || slug),
      description: decodeHtmlEntities(article.match(/<meta name="description" content="([^"]*)">/)?.[1] || ''),
      noindex: editorialReview.has(`${group.lang}/article/${slug}.html`)
    });
  }
  const rtl = group.lang === 'ar';
  const canonical = `https://doyouknow.app/${group.lang}/category/${group.slug}.html`;
  const home = `/${group.lang}/`;
  const cards = articles.length > 0
    ? `<div class="article-grid">${articles.map((article, index) => {
        const delay = (index % 3) + 1;
        const priority = index < 3
          ? 'loading="eager" fetchpriority="high"'
          : 'loading="lazy"';
        const image = `<img class="card-image" src="${articleImagePath(group.lang, article.slug)}" alt="" width="800" height="450" ${priority}>`;
        return `<a href="/${group.lang}/article/${article.slug}.html" class="article-card reveal reveal-delay-${delay}">${image}<div class="card-content"><span class="category-badge">${escapeHtml(group.title)}</span><h2 class="card-title">${escapeHtml(article.title)}</h2><p class="card-excerpt">${escapeHtml(article.description)}</p></div></a>`;
      }).join('')}</div>`
    : `<div class="empty-category-state"><p>${rtl ? 'قريباً: المزيد من المقالات في هذا القسم.' : 'More articles for this category are coming soon.'}</p><a href="${home}" class="btn btn-secondary">${rtl ? 'استكشف كل المقالات' : 'Explore all articles'}</a></div>`;
  const visionCrossLink = group.slug === 'saudi'
    ? `<p class="hero-subtitle" style="margin-inline:0"><a href="/${group.lang}/category/vision-2030.html">${rtl ? 'استكشف أيضاً رؤية السعودية 2030 والمشاريع الكبرى ←' : 'Also explore Saudi Vision 2030 & Megaprojects →'}</a></p>`
    : '';
  const itemList = articles.filter((a) => !a.noindex).map((article, index) => ({ '@type': 'ListItem', position: index + 1, url: `https://doyouknow.app/${group.lang}/article/${article.slug}.html`, name: article.title }));
  const alternateBlock = hreflangBlock(`${group.lang}/category/${group.slug}.html`, group.lang, canonical);
  const manifestLink = rtl ? '<link rel="manifest" href="/manifest-ar.json">' : '<link rel="manifest" href="/manifest.json">';
  const page = `<!doctype html><html lang="${group.lang}"${rtl ? ' dir="rtl"' : ''} data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(group.description)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${canonical}">${alternateBlock}<link rel="icon" href="/assets/images/logo.svg" type="image/svg+xml"><meta name="theme-color" content="#F59E0B">${manifestLink}<link rel="apple-touch-icon" href="/assets/images/icon-192.png"><meta property="og:title" content="${escapeHtml(group.title)} | doyouknow.app"><meta property="og:description" content="${escapeHtml(group.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://doyouknow.app/assets/images/og-${group.lang}.png"><meta name="twitter:card" content="summary_large_image"><title>${escapeHtml(group.title)} | doyouknow.app</title><link rel="stylesheet" href="/assets/css/style.css"><script type="application/ld+json">${JSON.stringify({ '@context':'https://schema.org', '@type':'CollectionPage', name:group.title, description:group.description, url:canonical, inLanguage:group.lang, mainEntity:{ '@type':'ItemList', itemListElement:itemList } })}</script>${googleTag}<link rel="alternate" type="application/rss+xml" title="RSS" href="/${group.lang}/rss.xml"><link rel="alternate" type="application/json" title="JSON Feed" href="/${group.lang}/feed.json"></head><body>${renderFullHeader(group.lang)}<main id="main-content"><section class="content-section"><p class="category-badge">doyouknow.app</p><h1>${escapeHtml(group.title)}</h1><p class="hero-subtitle" style="margin-inline:0">${escapeHtml(group.description)}</p>${visionCrossLink}${cards}</section></main>${renderFullFooter(group.lang)}<script src="/assets/js/site.js" defer></script></body></html>`;
  await writeFile(join(root, group.lang, 'category', `${group.slug}.html`), injectCriticalCSS(optimizeImageAttributes(page), criticalCSS));
}

async function renderGuidesAggregatorPage(lang) {
  const rtl = lang === 'ar';
  const canonical = `https://doyouknow.app/${lang}/category/practical-guide.html`;
  const title = rtl ? 'دليل عملي' : 'Practical Guide';
  const description = rtl
    ? 'تصفح الأدلة العملية للإمارات والسعودية ومصر في مكان واحد، وتغطي التأشيرات والعملة والتنقل وخطوات الإقامة.'
    : 'Browse practical guides for the UAE, Saudi Arabia, and Egypt in one place, covering visas, money, transport, and everyday planning.';
  const tiles = rtl
    ? [
        { href: '/ar/category/guides.html', label: 'أدلة الإمارات والسعودية', icon: '✓' },
        { href: '/ar/category/egypt-guides.html', label: 'أدلة مصر', icon: '✓' }
      ]
    : [
        { href: '/en/category/guides.html', label: 'UAE Guides', icon: '✓' },
        { href: '/en/category/saudi-guides.html', label: 'Saudi Guides', icon: '✓' },
        { href: '/en/category/egypt-guides.html', label: 'Egypt Guides', icon: '✓' }
      ];
  const tilesHtml = tiles.map((tile) => `<a href="${tile.href}" class="category-tile"><div class="tile-icon">${tile.icon}</div><div class="tile-info"><span class="tile-title">${escapeHtml(tile.label)}</span></div></a>`).join('');
  const alternateBlock = hreflangBlock(`${lang}/category/practical-guide.html`, lang, canonical);
  const manifestLink = rtl ? '<link rel="manifest" href="/manifest-ar.json">' : '<link rel="manifest" href="/manifest.json">';
  const page = `<!doctype html><html lang="${lang}"${rtl ? ' dir="rtl"' : ''} data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${canonical}">${alternateBlock}<link rel="icon" href="/assets/images/logo.svg" type="image/svg+xml"><meta name="theme-color" content="#F59E0B">${manifestLink}<link rel="apple-touch-icon" href="/assets/images/icon-192.png"><meta property="og:title" content="${escapeHtml(title)} | doyouknow.app"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://doyouknow.app/assets/images/og-${lang}.png"><meta name="twitter:card" content="summary_large_image"><title>${escapeHtml(title)} | doyouknow.app</title><link rel="stylesheet" href="/assets/css/style.css"><script type="application/ld+json">${JSON.stringify({ '@context':'https://schema.org', '@type':'CollectionPage', name:title, description, url:canonical, inLanguage:lang })}</script>${googleTag}<link rel="alternate" type="application/rss+xml" title="RSS" href="/${lang}/rss.xml"><link rel="alternate" type="application/json" title="JSON Feed" href="/${lang}/feed.json"></head><body>${renderFullHeader(lang)}<main id="main-content"><section class="content-section"><p class="category-badge">doyouknow.app</p><h1>${escapeHtml(title)}</h1><p class="hero-subtitle" style="margin-inline:0">${escapeHtml(description)}</p><div class="category-explorer">${tilesHtml}</div></section></main>${renderFullFooter(lang)}<script src="/assets/js/site.js" defer></script></body></html>`;
  await writeFile(join(root, lang, 'category', 'practical-guide.html'), injectCriticalCSS(optimizeImageAttributes(page), criticalCSS));
}

await renderGuidesAggregatorPage('en');
await renderGuidesAggregatorPage('ar');


const sitemapFiles = (await walk(root)).filter((path) => path.endsWith('.html'));
const sitemapUrls = new Map();
const sitemapImages = new Map();
for (const file of sitemapFiles) {
  const relativeFile = file.slice(root.length);
  const html = await readFile(file, 'utf8');
  if (relativeFile.endsWith('404.html') || html.includes('name="robots" content="noindex')) continue;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (!canonical || canonical.includes('/category/General.html')) continue;
  const dateModified = html.match(/"dateModified":\s*"([^"]+)"/)?.[1]
    || html.match(/datetime="([^"]+)"/)?.[1]
    || '2026-06-26';
  const priority = canonical.endsWith('/en/') || canonical.endsWith('/ar/') ? '1.0'
    : canonical.includes('/article/') ? '0.8'
      : canonical.includes('/category/') ? '0.7'
        : '0.5';
  const changefreq = canonical.includes('/article/') || canonical.includes('/category/') ? 'weekly'
    : canonical.endsWith('/en/') || canonical.endsWith('/ar/') ? 'daily'
      : 'monthly';
  sitemapUrls.set(canonical, { dateModified, changefreq, priority });

  // Extract image for articles
  if (relativeFile.match(/^(en|ar)\/article\/[a-z0-9-]+\.html$/)) {
    const ogImage = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
    const featuredImage = html.match(/<img class="featured-image"[^>]*src="([^"]+)"/)?.[1];
    const imageUrl = ogImage || (featuredImage ? (featuredImage.startsWith('http') ? featuredImage : `https://doyouknow.app${featuredImage}`) : '');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || '';
    if (imageUrl) {
      sitemapImages.set(canonical, { imageUrl, title: escapeHtml(title) });
    }
  }
}
const sitemapEntries = [...sitemapUrls.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([loc, meta]) => {
    const imageBlock = sitemapImages.has(loc)
      ? `\n<image:image><image:loc>${sitemapImages.get(loc).imageUrl}</image:loc><image:title>${sitemapImages.get(loc).title}</image:title></image:image>`
      : '';
    return `<url><loc>${loc}</loc><lastmod>${meta.dateModified}</lastmod><changefreq>${meta.changefreq}</changefreq><priority>${meta.priority}</priority>${imageBlock}</url>`;
  })
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemapEntries}\n</urlset>\n`;
await writeFile(join(root, 'sitemap.xml'), sitemap);
console.log('Prepared production paths and metadata.');

// --- Search Index Generation ---

function stripHtmlTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
}

function extractWords(text, lang) {
  const stopWords = lang === 'ar' ? arabicStopWords : englishStopWords;
  const words = new Set();
  for (const raw of text.split(/\s+/)) {
    const clean = raw.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (clean && clean.length > 2 && !stopWords.has(clean)) {
      words.add(clean);
    }
  }
  return words;
}

function getKeywords(html, description, lang) {
  const keywords = new Set();
  // H2 and H3 text
  for (const match of html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)) {
    for (const word of extractWords(stripHtmlTags(match[1]), lang)) {
      keywords.add(word);
    }
  }
  // Description words
  for (const word of extractWords(description, lang)) {
    keywords.add(word);
  }
  return [...keywords].sort();
}

function extractFirstParagraphFromArticleBody(html) {
  const startMatch = html.match(/<div class="article-body"[^>]*>/);
  if (!startMatch) return '';
  const start = startMatch.index + startMatch[0].length;
  let depth = 1;
  let i = start;
  while (i < html.length && depth > 0) {
    if (html.substring(i, 5) === '<div' && (html[i + 5] === ' ' || html[i + 5] === '>')) {
      depth++;
      i += 5;
    } else if (html.substring(i, 6) === '</div>') {
      depth--;
      if (depth === 0) break;
      i += 6;
    } else {
      i++;
    }
  }
  const bodyContent = html.slice(start, i);
  const pMatch = bodyContent.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  return pMatch ? stripHtmlTags(pMatch[1]).trim() : '';
}

const searchFiles = htmlFiles.filter((file) => {
  const rel = file.slice(root.length);
  return /^(en|ar)\/article\/[^/]+\.html$/.test(rel) || /^(en|ar)\/[^/]+\.html$/.test(rel);
});

const articles = [];
for (const file of searchFiles) {
  const rel = file.slice(root.length);
  if (rel.endsWith('404.html')) continue;

  const html = await readFile(file, 'utf8');
  if (html.includes('name="robots" content="noindex')) continue;

  const title = decodeHtmlEntities((html.match(/<title>([^<]+)<\/title>/)?.[1] || '').trim());
  const description = decodeHtmlEntities(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '');

  const lang = html.match(/<html[^>]*\blang="([^"]+)"/)?.[1] || (rel.startsWith('ar/') ? 'ar' : 'en');

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const datePublished = html.match(/<time datetime="([^"]+)">/)?.[1] || '2026-06-26';
  const url = canonical || absoluteUrl(rel);

  const slug = rel.split('/').pop().replace('.html', '');
  const type = rel.includes('/article/') ? 'article' : 'page';

  let excerpt = extractFirstParagraphFromArticleBody(html);
  if (!excerpt) {
    // Fallback: first meaningful <p> in the whole document
    const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (pMatch) {
      excerpt = stripHtmlTags(pMatch[1]).trim();
    }
  }
  if (excerpt.length > 200) {
    excerpt = excerpt.slice(0, 200) + '...';
  }

  let category = '';
  let categorySlug = '';

  // Try category badge in article header
  const badgeMatch = html.match(/<span class="category-badge[^"]*"><a href="\/(?:en|ar)\/category\/([^"]+)\.html">([\s\S]*?)<\/a><\/span>/);
  if (badgeMatch) {
    categorySlug = badgeMatch[1];
    category = stripHtmlTags(badgeMatch[2]).trim();
  }

  // Fallback to breadcrumb category link
  if (!categorySlug) {
    const breadcrumbMatch = html.match(/<nav class="breadcrumb"[\s\S]*?<li><a href="\/(?:en|ar)\/category\/([^"]+)\.html">([\s\S]*?)<\/a><\/li>/);
    if (breadcrumbMatch) {
      categorySlug = breadcrumbMatch[1];
      category = stripHtmlTags(breadcrumbMatch[2]).trim();
    }
  }

  // Fallback for pages
  if (!categorySlug) {
    category = lang === 'ar' ? 'عام' : 'General';
    categorySlug = 'general';
  }

  const keywords = getKeywords(html, description, lang);

  articles.push({
    title,
    description,
    excerpt,
    category,
    categorySlug,
    language: lang,
    url,
    slug,
    keywords,
    type,
    datePublished
  });
}

function latestPublishedDate(items) {
  return items
    .map((item) => item.datePublished)
    .filter(Boolean)
    .sort()
    .at(-1) || '2026-06-26';
}

function toIsoDateTime(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '2026-06-26T00:00:00.000Z';
  return d.toISOString();
}

const index = {
  version: 1,
  generated: toIsoDateTime(latestPublishedDate(articles)),
  count: articles.length,
  articles
};

const searchIndexByLanguage = (lang) => {
  const languageArticles = articles.filter((article) => article.language === lang);
  return {
    version: index.version,
    generated: toIsoDateTime(latestPublishedDate(languageArticles)),
    count: languageArticles.length,
    articles: languageArticles
  };
};

await writeFile(join(root, 'assets/js/search-index.en.json'), JSON.stringify(searchIndexByLanguage('en'), null, 2));
await writeFile(join(root, 'assets/js/search-index.ar.json'), JSON.stringify(searchIndexByLanguage('ar'), null, 2));
try {
  await unlink(join(root, 'assets/js/search-index.json'));
} catch {}
console.log('Generated split search indexes with', articles.length, 'articles');

// --- Feed Generation ---

function toRfc2822(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

function generateRss(items, lang, title, description, link) {
  const now = toRfc2822(latestPublishedDate(items));
  const channelItems = items.map(item => `  <item>
    <title>${escapeHtml(item.title.replace(/\s*\|\s*doyouknow\.app$/, ''))}</title>
    <link>${item.url}</link>
    <guid isPermaLink="true">${item.url}</guid>
    <pubDate>${toRfc2822(item.datePublished)}</pubDate>
    <description>${escapeHtml(item.description)}</description>
    <category>${escapeHtml(item.category)}</category>
  </item>`).join('\n');
  const channel = `<channel>
  <title>${escapeHtml(title)}</title>
  <link>${link}</link>
  <description>${escapeHtml(description)}</description>
  <language>${lang}</language>
  <lastBuildDate>${now}</lastBuildDate>
${channelItems}
</channel>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
${channel}
</rss>
`;
}

function generateJsonFeed(items, lang, title, homePageUrl, feedUrl) {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1',
    title,
    home_page_url: homePageUrl,
    feed_url: feedUrl,
    language: lang,
    items: items.map(item => ({
      id: item.url,
      url: item.url,
      title: item.title.replace(/\s*\|\s*doyouknow\.app$/, ''),
      content_text: item.description,
      date_published: item.datePublished,
      tags: [item.category]
    }))
  }, null, 2);
}

const articleItems = articles.filter(a => a.type === 'article');
const enArticleItems = articleItems.filter(a => a.language === 'en').sort((a, b) => b.datePublished.localeCompare(a.datePublished)).slice(0, 20);
const arArticleItems = articleItems.filter(a => a.language === 'ar').sort((a, b) => b.datePublished.localeCompare(a.datePublished)).slice(0, 20);

await writeFile(join(root, 'en', 'rss.xml'), generateRss(enArticleItems, 'en', 'doyouknow.app - English', 'Surprising facts about UAE, Saudi Arabia, and the world.', 'https://doyouknow.app/en/'));
await writeFile(join(root, 'ar', 'rss.xml'), generateRss(arArticleItems, 'ar', 'doyouknow.app - العربية', 'Surprising facts about UAE, Saudi Arabia, and the world.', 'https://doyouknow.app/ar/'));
await writeFile(join(root, 'en', 'feed.json'), generateJsonFeed(enArticleItems, 'en', 'doyouknow.app - English', 'https://doyouknow.app/en/', 'https://doyouknow.app/en/feed.json'));
await writeFile(join(root, 'ar', 'feed.json'), generateJsonFeed(arArticleItems, 'ar', 'doyouknow.app - العربية', 'https://doyouknow.app/ar/', 'https://doyouknow.app/ar/feed.json'));

console.log('Generated RSS and JSON feeds.');

async function updateServiceWorkerCacheName() {
  const mutableAssetFiles = [
    join(root, 'assets/css/style.css'),
    join(root, 'assets/js/site.js'),
    join(root, 'assets/js/search-index.en.json'),
    join(root, 'assets/js/search-index.ar.json')
  ];
  const hash = createHash('sha256');
  for (const file of mutableAssetFiles) {
    hash.update(await readFile(file));
  }
  const cacheName = `dyk-${hash.digest('hex').slice(0, 12)}`;
  const swPath = join(root, 'sw.js');
  const sw = await readFile(swPath, 'utf8');
  const next = sw.replace(/const CACHE_NAME = 'dyk-[^']+';/, `const CACHE_NAME = '${cacheName}';`);
  if (next !== sw) {
    await writeFile(swPath, next);
  }
  console.log('Updated service worker cache name:', cacheName);
}

await updateServiceWorkerCacheName();
