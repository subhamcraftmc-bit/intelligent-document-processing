// test_compare_endpoint.js

async function testCompareEndpoint() {
  console.log('--- Testing /api/documents/compare HTTP Endpoint ---');

  // Step 1: Login as demo analyst to get JWT
  const loginRes = await globalThis.fetch('http://localhost:5000/api/auth/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  console.log('Obtained Demo Analyst JWT:', token ? 'YES' : 'NO');

  // Step 2: Fetch documents list to get IDs
  const docsRes = await globalThis.fetch('http://localhost:5000/api/documents', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const docsData = await docsRes.json();
  const docs = docsData.data?.documents || docsData.documents || [];
  console.log(`Available documents: ${docs.length}`);

  if (docs.length < 2) {
    console.error('Need at least 2 documents to test comparison endpoint');
    process.exit(1);
  }

  const docA = docs[0];
  const docB = docs[1];
  console.log(`Comparing Doc A (${docA.file_name}) vs Doc B (${docB.file_name})`);

  // Step 3: POST /api/documents/compare
  const compareRes = await globalThis.fetch('http://localhost:5000/api/documents/compare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      docA_id: docA.id,
      docB_id: docB.id,
      use_ai_summary: false
    })
  });

  if (!compareRes.ok) {
    console.error(`POST /compare failed with status: ${compareRes.status}`);
    const errText = await compareRes.text();
    console.error('Error:', errText);
    process.exit(1);
  }

  const compareData = await compareRes.json();
  const comp = compareData.data?.comparison || compareData.data || compareData;
  console.log('✅ POST /api/documents/compare succeeded!');
  console.log('Total Changes:', comp.metrics?.totalChanges);
  console.log('Match Score:', comp.metrics?.matchScore + '%');
  console.log('Summary:', comp.summary);

  // Step 4: GET /api/documents/compare/export?format=csv
  const exportRes = await globalThis.fetch(`http://localhost:5000/api/documents/compare/export?docA_id=${docA.id}&docB_id=${docB.id}&format=csv`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!exportRes.ok) {
    console.error(`GET /compare/export failed with status: ${exportRes.status}`);
    process.exit(1);
  }

  const csvText = await exportRes.text();
  console.log('✅ GET /api/documents/compare/export (CSV) succeeded! First line:', csvText.split('\n')[0]);

  // Step 5: GET /api/documents/compare/export?format=json
  const exportJsonRes = await globalThis.fetch(`http://localhost:5000/api/documents/compare/export?docA_id=${docA.id}&docB_id=${docB.id}&format=json`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!exportJsonRes.ok) {
    console.error(`GET /compare/export (JSON) failed with status: ${exportJsonRes.status}`);
    process.exit(1);
  }

  console.log('✅ GET /api/documents/compare/export (JSON) succeeded!');
  console.log('\n--- ALL HTTP ENDPOINT TESTS FOR COMPARISON PASSED! ---');
}

testCompareEndpoint().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
