import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let authToken = 'demo-token';

async function test(name, fn) {
  try {
    process.stdout.write(`Testing ${name}... `);
    await fn();
    console.log('✅ PASS');
    return true;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('=== RUNNING BACKEND INTEGRATION TEST SUITE ===\n');
  let passed = 0;
  let total = 0;

  // 1. Health
  total++;
  if (await test('GET /api/health', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || data.data.status !== 'online') throw new Error('Invalid payload');
  })) passed++;

  // 2. Root
  total++;
  if (await test('GET /', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Invalid payload');
  })) passed++;

  // 3. Extract Info
  total++;
  if (await test('GET /api/extract', async () => {
    const res = await fetch(`${BASE_URL}/api/extract`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || data.data.status !== 'ready') throw new Error('Invalid payload');
  })) passed++;

  // 4. Auth Validation: Invalid Email Registration
  total++;
  if (await test('POST /api/auth/register (Invalid payload rejection)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '123' })
    });
    if (res.status !== 400 && res.status !== 422) throw new Error(`Expected 400 or 422, got ${res.status}`);
    const data = await res.json();
    if (data.success !== false) throw new Error('Expected success=false');
  })) passed++;

  // 5. Auth Demo Login
  total++;
  if (await test('POST /api/auth/demo', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/demo`, { method: 'POST' });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.data.token) throw new Error('Missing token');
    authToken = data.data.token;
  })) passed++;

  // 6. Auth Login with Demo Credentials
  total++;
  if (await test('POST /api/auth/login (Demo analyst bypass)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@idp.com', password: 'demopassword' })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.data.token) throw new Error('Missing token');
  })) passed++;

  // 7. Protected Route Without Auth Token (Should be 401)
  total++;
  if (await test('GET /api/documents (Unauthorized check)', async () => {
    const res = await fetch(`${BASE_URL}/api/documents`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    const data = await res.json();
    if (data.success !== false) throw new Error('Expected success=false');
  })) passed++;

  // 8. Protected Route With Auth Token
  let sampleDocId = null;
  total++;
  if (await test('GET /api/documents (Authorized list)', async () => {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data.documents)) throw new Error('Missing documents array');
    if (data.data.documents.length > 0) {
      sampleDocId = data.data.documents[0].id;
    }
  })) passed++;

  // 9. Document by ID
  total++;
  if (await test(`GET /api/documents/:id (${sampleDocId})`, async () => {
    if (!sampleDocId) throw new Error('No sample document ID available');
    const res = await fetch(`${BASE_URL}/api/documents/${sampleDocId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.data.id || data.data.id !== sampleDocId) throw new Error('ID mismatch');
  })) passed++;

  // 10. Update Document Fields (Human-in-the-Loop review)
  total++;
  if (await test(`PUT /api/documents/:id/fields (${sampleDocId})`, async () => {
    if (!sampleDocId) throw new Error('No sample document ID available');
    const res = await fetch(`${BASE_URL}/api/documents/${sampleDocId}/fields`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        status: 'verified',
        notes: 'QA automated verification completed',
        fields: [{ field_key: 'vendor_name', field_value: 'Apex Cloud Solutions LLC Verified' }]
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.data.status !== 'verified') throw new Error('Status not updated to verified');
  })) passed++;

  // 11. Export Document CSV
  total++;
  if (await test(`GET /api/documents/:id/export?format=csv`, async () => {
    if (!sampleDocId) throw new Error('No sample document ID available');
    const res = await fetch(`${BASE_URL}/api/documents/${sampleDocId}/export?format=csv`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes('Field Key') && !text.includes('field_key')) throw new Error('Invalid CSV structure');
  })) passed++;

  // 12. Export Document JSON
  total++;
  if (await test(`GET /api/documents/:id/export?format=json`, async () => {
    if (!sampleDocId) throw new Error('No sample document ID available');
    const res = await fetch(`${BASE_URL}/api/documents/${sampleDocId}/export?format=json`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    if (!json.id) throw new Error('Invalid JSON export structure');
  })) passed++;

  // 13. Analytics
  total++;
  if (await test('GET /api/analytics', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (typeof data.data.overview?.total_documents !== 'number') throw new Error('Invalid analytics response');
  })) passed++;

  // 14. Direct Extraction with simulated base64 text
  total++;
  if (await test('POST /api/extract (Base64 extraction pipeline)', async () => {
    const sampleText = 'Invoice from Apex Cloud. Total: $4,632.50. Date: 2026-09-30.';
    const sampleBase64 = Buffer.from(sampleText).toString('base64');
    const res = await fetch(`${BASE_URL}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64: sampleBase64,
        file_name: 'test_invoice.txt',
        mime_type: 'text/plain'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.data.fields || !Array.isArray(data.data.fields)) throw new Error('Extraction did not return fields');
  })) passed++;

  // 15. Invalid Route 404
  total++;
  if (await test('GET /api/nonexistent_route_404', async () => {
    const res = await fetch(`${BASE_URL}/api/nonexistent_route_404`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    const data = await res.json();
    if (data.success !== false) throw new Error('Expected success=false');
  })) passed++;

  // 16. Multipart Document Upload
  total++;
  if (await test('POST /api/documents/upload (Multipart upload & extract)', async () => {
    // 1x1 transparent PNG buffer
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    const formData = new FormData();
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('file', blob, 'sample_receipt_invoice.png');

    const res = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      body: formData
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload returned status ${res.status}: ${errText}`);
    }
    const data = await res.json();
    if (!data.data.documents || data.data.documents.length === 0) {
      throw new Error('Upload succeeded but no document record returned');
    }
  })) passed++;

  // 17. Intelligent Document Comparison (Phase 14-34)
  total++;
  let comparisonDocA = null;
  let comparisonDocB = null;
  if (await test('POST /api/documents/compare (Structured Document Comparison)', async () => {
    const listRes = await fetch(`${BASE_URL}/api/documents`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const listData = await listRes.json();
    const docs = listData.data.documents || [];
    if (docs.length < 2) throw new Error('At least 2 documents required for comparison');

    comparisonDocA = docs[0].id;
    comparisonDocB = docs[1].id;

    const res = await fetch(`${BASE_URL}/api/documents/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        docA_id: comparisonDocA,
        docB_id: comparisonDocB,
        use_ai_summary: false
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Comparison returned status ${res.status}: ${err}`);
    }
    const data = await res.json();
    if (!data.success || !data.data.comparison) throw new Error('Invalid comparison payload');
    if (!data.data.comparison.metrics || !data.data.comparison.fieldDiffs) throw new Error('Missing metrics or fieldDiffs in comparison result');
  })) passed++;

  // 18. Comparison CSV Export
  total++;
  if (await test('GET /api/documents/compare/export?format=csv', async () => {
    if (!comparisonDocA || !comparisonDocB) throw new Error('Missing sample doc IDs');
    const res = await fetch(`${BASE_URL}/api/documents/compare/export?docA_id=${comparisonDocA}&docB_id=${comparisonDocB}&format=csv`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Export returned status ${res.status}`);
    const text = await res.text();
    if (!text.includes('Category,Entity / Item,Status')) throw new Error('Missing CSV headers');
  })) passed++;

  // 19. Comparison JSON Export
  total++;
  if (await test('GET /api/documents/compare/export?format=json', async () => {
    if (!comparisonDocA || !comparisonDocB) throw new Error('Missing sample doc IDs');
    const res = await fetch(`${BASE_URL}/api/documents/compare/export?docA_id=${comparisonDocA}&docB_id=${comparisonDocB}&format=json`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Export returned status ${res.status}`);
    const json = await res.json();
    if (!json.metrics || !json.fieldDiffs) throw new Error('Invalid JSON export payload');
  })) passed++;

  console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED ===`);
  process.exit(passed === total ? 0 : 1);
}

run();
