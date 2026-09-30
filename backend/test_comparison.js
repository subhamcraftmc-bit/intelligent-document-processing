import { comparisonService } from './src/services/comparisonService.js';

console.log('====================================================');
console.log('RUNNING PHASE 48 CONTROLLED COMPARISON TEST SUITE');
console.log('====================================================\n');

async function runTestSuite() {
  // 1. PHASE 48 CONTROLLED TEST SCENARIO
  // Doc A: Store_Receipt_Original_v1.pdf (Amount = 1250, Tax = 100, Discount = SUMMER10)
  // Doc B: Store_Receipt_Updated_v2.pdf (Amount = 1450, Tax = 120, Loyalty = 145 pts)
  const docA = {
    id: 'doc-original-test',
    file_name: 'Store_Receipt_Original_v1.pdf',
    document_class: 'Receipt',
    created_at: '2026-08-12T10:30:00Z',
    fields: [
      { field_key: 'merchant_name', field_value: 'ABC Store', confidence: 0.98 },
      { field_key: 'date', field_value: '12/08/26', confidence: 0.95 },
      { field_key: 'total_amount', field_value: '₹1,250', confidence: 0.99 },
      { field_key: 'tax_amount', field_value: '₹100', confidence: 0.94 },
      { field_key: 'payment_method', field_value: 'Cash', confidence: 0.92 },
      { field_key: 'discount_code', field_value: 'SUMMER10', confidence: 0.90 }
    ],
    extraction: {
      line_items: [
        { description: 'A2 Organic Milk 1L', quantity: 1, unit_price: 60, total_price: 60 },
        { description: 'Whole Wheat Sourdough', quantity: 1, unit_price: 140, total_price: 140 }
      ]
    }
  };

  const docB = {
    id: 'doc-updated-test',
    file_name: 'Store_Receipt_Updated_v2.pdf',
    document_class: 'Receipt',
    created_at: '2026-08-12T14:45:00Z',
    fields: [
      { field_key: 'merchant_name', field_value: 'ABC Store', confidence: 0.98 },
      { field_key: 'date', field_value: '12/08/26', confidence: 0.95 },
      { field_key: 'total_amount', field_value: '₹1,450', confidence: 0.99 },
      { field_key: 'tax_amount', field_value: '₹120', confidence: 0.94 },
      { field_key: 'payment_method', field_value: 'UPI', confidence: 0.96 },
      { field_key: 'loyalty_points_earned', field_value: '145 pts', confidence: 0.91 }
    ],
    extraction: {
      line_items: [
        { description: 'A2 Organic Milk 1L', quantity: 1, unit_price: 70, total_price: 70 },
        { description: 'Whole Wheat Sourdough', quantity: 1, unit_price: 140, total_price: 140 },
        { description: 'Spring Water 500ml', quantity: 2, unit_price: 20, total_price: 40 }
      ]
    }
  };

  const diffResult = await comparisonService.compareDocuments(docA, docB, { useAiSummary: false });

  console.log('Diff Metrics:');
  console.log('Total Changes:', diffResult.metrics.totalChanges);
  console.log('Changed Fields:', diffResult.metrics.changed);
  console.log('Added Fields:', diffResult.metrics.added);
  console.log('Removed Fields:', diffResult.metrics.removed);
  console.log('Unchanged Fields:', diffResult.metrics.unchanged);
  console.log('Match Score:', diffResult.metrics.matchScore + '%');
  console.log('\nGenerated Deterministic Summary:\n' + diffResult.summary + '\n');

  let passed = true;

  // Assertions for Test 1
  const amountDiff = diffResult.fieldDiffs.find(f => f.canonicalKey === 'total_amount');
  if (!amountDiff || amountDiff.status !== 'CHANGED' || !amountDiff.delta.includes('200')) {
    console.error('FAIL: Expected total_amount to be CHANGED with +200 delta. Got:', amountDiff);
    passed = false;
  } else {
    console.log('PASS: total_amount correctly identified as CHANGED with +200 (+16.0%) delta');
  }

  const taxDiff = diffResult.fieldDiffs.find(f => f.canonicalKey === 'tax_amount');
  if (!taxDiff || taxDiff.status !== 'CHANGED' || !taxDiff.delta.includes('20')) {
    console.error('FAIL: Expected tax_amount to be CHANGED with +20 delta. Got:', taxDiff);
    passed = false;
  } else {
    console.log('PASS: tax_amount correctly identified as CHANGED with +20 (+20.0%) delta');
  }

  const discountDiff = diffResult.fieldDiffs.find(f => f.canonicalKey === 'discount_code');
  if (!discountDiff || discountDiff.status !== 'REMOVED') {
    console.error('FAIL: Expected discount_code to be REMOVED. Got:', discountDiff);
    passed = false;
  } else {
    console.log('PASS: discount_code correctly identified as REMOVED');
  }

  const loyaltyDiff = diffResult.fieldDiffs.find(f => f.canonicalKey === 'loyalty_points_earned');
  if (!loyaltyDiff || loyaltyDiff.status !== 'ADDED') {
    console.error('FAIL: Expected loyalty_points_earned to be ADDED. Got:', loyaltyDiff);
    passed = false;
  } else {
    console.log('PASS: loyalty_points_earned correctly identified as ADDED');
  }

  const milkLineItem = diffResult.lineItemDiffs.find(i => (i.descriptionB || i.descriptionA || '').includes('Milk'));
  if (!milkLineItem || milkLineItem.status !== 'CHANGED') {
    console.error('FAIL: Expected Milk item to be CHANGED. Got:', milkLineItem);
    passed = false;
  } else {
    console.log('PASS: Milk line item correctly identified as CHANGED (₹60 -> ₹70)');
  }

  const waterLineItem = diffResult.lineItemDiffs.find(i => (i.descriptionB || i.descriptionA || '').includes('Water'));
  if (!waterLineItem || waterLineItem.status !== 'ADDED') {
    console.error('FAIL: Expected Water item to be ADDED. Got:', waterLineItem);
    passed = false;
  } else {
    console.log('PASS: Spring Water line item correctly identified as ADDED');
  }

  // 2. TEST SAME DOCUMENT SCENARIO (ALL UNCHANGED)
  console.log('\n--- Test 2: Identical Document Comparison ---');
  const identicalDiff = await comparisonService.compareDocuments(docA, docA, { useAiSummary: false });
  if (
    identicalDiff.metrics.changed === 0 &&
    identicalDiff.metrics.added === 0 &&
    identicalDiff.metrics.removed === 0 &&
    identicalDiff.metrics.matchScore === 100
  ) {
    console.log('PASS: Identical documents yield 100% match score and 0 differences');
  } else {
    console.error('FAIL: Identical documents did not yield 100% match score:', identicalDiff.metrics);
    passed = false;
  }

  // 3. TEST CSV EXPORT GENERATION
  console.log('\n--- Test 3: CSV Export Generation ---');
  const csv = comparisonService.generateComparisonCsv(diffResult);
  if (csv.includes('Category,Entity / Item,Status,Original Value (Doc A),Updated Value (Doc B),Delta / Difference') && csv.includes('Total Amount')) {
    console.log('PASS: CSV export headers and rows generated cleanly');
  } else {
    console.error('FAIL: CSV export generation missing expected headers. Result:\n', csv.slice(0, 200));
    passed = false;
  }

  console.log('\n====================================================');
  if (passed) {
    console.log('ALL PHASE 48 COMPARISON ENGINE TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('SOME TESTS FAILED');
    process.exit(1);
  }
  console.log('====================================================');
}

runTestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
