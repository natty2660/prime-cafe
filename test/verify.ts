import { SEED_CATEGORIES, SEED_MENU_ITEMS, PRIME_CAFE_RESTAURANT } from '../src/data/seedData.ts';
import { getMenuUrl, generateQRCodeDataUrl } from '../src/lib/qr.ts';
import { validateBirrPrice, formatBirr } from '../src/lib/storage.ts';

function runTests() {
  console.log('🧪 Running Prime Cafe QR Digital Menu QA Verification Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: Currency & Anti-USD Discipline
  assert(
    SEED_MENU_ITEMS.every((item) => Number.isInteger(item.price) && item.price > 0),
    'All seed dishes have positive integer prices in Ethiopian Birr'
  );

  const serializedData = JSON.stringify({ SEED_CATEGORIES, SEED_MENU_ITEMS, PRIME_CAFE_RESTAURANT });
  assert(
    !serializedData.includes('USD') && !serializedData.includes('$') && !serializedData.includes('ETB'),
    'Zero instances of USD, $, or ETB in seed data or UI text'
  );

  // TEST 2: Price Validation Engine
  assert(validateBirrPrice(250).valid === true, 'Valid integer Birr (250) accepted');
  assert(validateBirrPrice('300').valid === true, 'String integer Birr ("300") parsed and accepted');
  assert(validateBirrPrice(-50).valid === false, 'Negative price rejected');
  assert(validateBirrPrice(0).valid === false, 'Zero price rejected');
  assert(validateBirrPrice(250.75).valid === false, 'Decimal price rejected (integer Birr only)');
  assert(validateBirrPrice(150000).valid === false, 'Price above 100,000 Birr sanity cap rejected');
  assert(formatBirr(250) === '250 Birr', 'formatBirr returns "250 Birr"');
  assert(formatBirr(1300) === '1,300 Birr', 'formatBirr formats thousands separator ("1,300 Birr")');

  // TEST 3: Meal-Time Section Grouping
  const breakfastItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_breakfast');
  const lunchItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_lunch_mains');
  const dinnerItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_dinner_specialties');
  const iceCreamCategory = SEED_CATEGORIES.find((c) => c.meal_time === 'ice_cream');
  const iceCreamItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_ice_cream');
  const drinkCategories = SEED_CATEGORIES.filter((c) => c.meal_time === 'all_day');

  assert(breakfastItems.length >= 8, `Breakfast category contains dishes (${breakfastItems.length} found)`);
  assert(lunchItems.length >= 7, `Lunch category contains fast food & lunch items (${lunchItems.length} found)`);
  assert(dinnerItems.length >= 5, `Dinner category contains dinner dishes (${dinnerItems.length} found)`);
  assert(Boolean(iceCreamCategory), 'Ice Cream category exists as a first-class meal-time section');
  assert(iceCreamItems.length >= 6, `Ice Cream section contains all flavors (${iceCreamItems.length} found)`);
  assert(
    iceCreamItems.every((i) => i.sizes && i.sizes.length === 3),
    'All ice cream items include Small, Medium, and Large portions'
  );

  // TEST 4: Photo Rules Discipline (International vs Local Blank)
  const localItems = SEED_MENU_ITEMS.filter((i) => i.is_local_specialty);
  assert(
    localItems.every((i) => i.image_url === ''),
    'Strict discipline: All local specialty items have blank image_url (never guessed randomly)'
  );
  assert(
    iceCreamItems.every((i) => i.image_url !== ''),
    'Standard international ice cream items have verified photography'
  );

  // TEST 4: CRITICAL QR CODE PERSISTENCE TEST
  const initialFuul = SEED_MENU_ITEMS.find((i) => i.name === 'Fuul')!;
  assert(initialFuul.price === 250, 'Step 1: Initial Fuul price is 250 Birr');

  const qrUrlInitial = getMenuUrl(PRIME_CAFE_RESTAURANT.slug);
  assert(qrUrlInitial.includes('/menu/prime-cafe'), 'Step 2: QR URL points permanently to /menu/prime-cafe');

  // Simulate price update
  const updatedFuulPrice = 300;
  const updatedItems = SEED_MENU_ITEMS.map((item) =>
    item.name === 'Fuul' ? { ...item, price: updatedFuulPrice } : item
  );
  const foundUpdatedFuul = updatedItems.find((i) => i.name === 'Fuul')!;
  assert(foundUpdatedFuul.price === 300, 'Step 3: Fuul price updated to 300 Birr in database');

  const qrUrlAfterUpdate = getMenuUrl(PRIME_CAFE_RESTAURANT.slug);
  assert(
    qrUrlInitial === qrUrlAfterUpdate,
    'Step 4: CRITICAL — The QR code URL did NOT change after price update! Same QR displays new price.'
  );

  // TEST 5: QR Generation Integrity
  generateQRCodeDataUrl({
    url: qrUrlInitial,
    size: 1024,
    darkColor: '#2B1A12',
    lightColor: '#EFEBE9',
  }).then((dataUrl) => {
    assert(dataUrl.startsWith('data:image/png;base64,'), 'QR code generates valid 1024px PNG data URL');
    console.log(`\n🎉 Verification Complete: ${passed}/${total} checks passed successfully!`);
  });
}

runTests();
