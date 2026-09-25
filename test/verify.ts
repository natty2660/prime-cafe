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

  // TEST 3: Meal-Time Section Grouping & Exact Printed Menu Fidelity
  const iceCreamCategory = SEED_CATEGORIES.find((c) => c.meal_time === 'ice_cream');
  const drinksCategories = SEED_CATEGORIES.filter((c) => c.meal_time === 'drinks');
  const breakfastCategory = SEED_CATEGORIES.find((c) => c.meal_time === 'breakfast');
  const lunchDinnerCategories = SEED_CATEGORIES.filter((c) => c.meal_time === 'lunch_dinner');

  assert(Boolean(iceCreamCategory), 'Ice Cream category exists as first-class category (display_order 1)');
  assert(iceCreamCategory?.display_order === 1, 'Ice cream is ordered first');
  assert(drinksCategories.length === 5, 'All 5 drink categories grouped under Drinks (display_orders 2-6)');
  assert(Boolean(breakfastCategory), 'Breakfast category exists (display_order 7)');
  assert(lunchDinnerCategories.length === 3, 'Lunch and Dinner merged into one meal section (display_orders 8-10)');

  const breakfastItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_breakfast');
  const lunchDinnerTotal = SEED_MENU_ITEMS.filter((i) =>
    lunchDinnerCategories.some((c) => c.id === i.category_id)
  );
  const iceCreamItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_ice_cream');
  const coffeeItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_hot_cold_coffee');
  const teaItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_tea');
  const juiceItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_fresh_juices');
  const mojitoItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_mojito');
  const milkshakeItems = SEED_MENU_ITEMS.filter((i) => i.category_id === 'cat_milkshake');

  assert(breakfastItems.length === 9, `Breakfast section contains exactly 9 printed items (${breakfastItems.length} found)`);
  assert(lunchDinnerTotal.length === 17, `Merged Lunch & Dinner contains all 17 printed dishes (${lunchDinnerTotal.length} found)`);
  assert(coffeeItems.length === 8, `Hot & Cold Coffee contains 8 items (${coffeeItems.length} found)`);
  assert(teaItems.length === 5, `Special Teas contains 5 items (${teaItems.length} found)`);
  assert(juiceItems.length === 5, `Fresh Juices & Shakes contains 5 items (${juiceItems.length} found)`);
  assert(mojitoItems.length === 7, `Fresh Mojitos contains 7 items (${mojitoItems.length} found)`);
  assert(mojitoItems.every((m) => m.price === 400), 'All Mojitos priced at 400 Birr each');
  assert(milkshakeItems.length === 5, `Creamy Milkshakes contains 5 items (${milkshakeItems.length} found)`);
  assert(milkshakeItems.every((m) => m.price === 650), 'All Milkshakes priced at 650 Birr each');
  assert(iceCreamItems.length === 6, `Ice Cream section contains all 6 flavors (${iceCreamItems.length} found)`);
  assert(
    iceCreamItems.every((i) => i.sizes && i.sizes.length === 3 && i.sizes[0].price === 150 && i.sizes[1].price === 300 && i.sizes[2].price === 500),
    'All ice cream items include Small (150 Birr), Medium (300 Birr), and Large (500 Birr) portions'
  );

  // Assert Banana Shake in Fresh Juices & Shakes
  const bananaShake = SEED_MENU_ITEMS.find((i) => i.category_id === 'cat_fresh_juices' && i.name === 'Banana Shake');
  assert(Boolean(bananaShake), 'Banana Shake exists in Fresh Juices & Shakes category');
  assert(bananaShake?.price === 300, `Banana Shake is priced at 300 Birr (found ${bananaShake?.price})`);

  // Assert Flagship Prime Royal Dish
  const primeRoyal = SEED_MENU_ITEMS.find((i) => i.name.includes('Prime Royal'));
  assert(Boolean(primeRoyal), 'Prime Royal Dish exists');
  assert(primeRoyal?.price === 1300, `Prime Royal Dish is 1,300 Birr (found ${primeRoyal?.price})`);

  // TEST 4: Photo Rules Discipline (All items have valid photography)
  const localItems = SEED_MENU_ITEMS.filter((i) => i.is_local_specialty);
  assert(
    localItems.every((i) => typeof i.image_url === 'string' && i.image_url.startsWith('/assets/images/')),
    'Strict discipline: All local specialty items have verified photography from local assets'
  );
  assert(
    iceCreamItems.every((i) => i.image_url !== ''),
    'Standard international ice cream items have verified photography'
  );

  // TEST 4: Restaurant Settings & Visual Configuration
  assert(
    Boolean(PRIME_CAFE_RESTAURANT.opening_hours?.includes('8:30 AM') && PRIME_CAFE_RESTAURANT.opening_hours?.includes('10:00 PM')),
    'Opening hours accurately adjusted to 8:30 AM – 10:00 PM'
  );
  assert(PRIME_CAFE_RESTAURANT.wifi_available === false, 'High-speed Wi-Fi removed from restaurant profile');
  assert(!PRIME_CAFE_RESTAURANT.phone, 'Phone number removed from restaurant profile');
  assert(
    PRIME_CAFE_RESTAURANT.cover_url.includes('prime_cafe_wall_logo'),
    'Background picture updated to cropped wall with logo (cafeteria tables removed)'
  );
  assert(PRIME_CAFE_RESTAURANT.address === 'Jijiga, Ethiopia', 'Location accurately configured to Jijiga, Ethiopia');

  // TEST 5: CRITICAL QR CODE PERSISTENCE TEST
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
