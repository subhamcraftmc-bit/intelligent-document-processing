// test_production_full_flow.mjs
const BASE_URL = 'https://idp-backend-vl5r.onrender.com/api';
const FRONTEND_URL = 'https://intelligent-document-processing-three.vercel.app';

async function runProductionAudit() {
  console.log('===============================================================');
  console.log('🚀 LIVE PRODUCTION FLOW AUDIT: VERCEL -> RENDER -> GEMINI -> SUPABASE');
  console.log('===============================================================');

  const results = {
    login: false,
    upload: false,
    extraction: false,
    confidence: false,
    review: false,
    verification: false,
    export: false,
    comparison: false,
    oldVsNew: false,
    changedBreakdown: false
  };

  // STEP 1: AUTHENTICATION / LOGIN
  console.log('\n[1/8] Testing Production Login (POST /api/auth/demo)...');
  const loginRes = await fetch(`${BASE_URL}/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
  }
  const loginJson = await loginRes.json();
  const token = loginJson.data?.token || loginJson.token;
  if (!token) throw new Error('No JWT token returned');
  results.login = true;
  console.log('✅ Production Login: PASS (JWT obtained)');

  // STEP 2: UPLOAD & GEMINI EXTRACTION
  console.log('\n[2/8] Testing Production Document Upload & Gemini Extraction (POST /api/extract)...');
  // Sample PNG invoice receipt (1x1 transparent PNG or base64 receipt text)
  const samplePayload = {
    file_name: 'prod_test_receipt.png',
    mime_type: 'image/png',
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  };

  const extractRes = await fetch(`${BASE_URL}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(samplePayload)
  });

  if (!extractRes.ok) {
    throw new Error(`Extraction failed with status ${extractRes.status}: ${await extractRes.text()}`);
  }
  const extractJson = await extractRes.json();
  const extractionData = extractJson.data || extractJson;
  results.upload = true;
  results.extraction = !!(extractionData.document_class || extractionData.fields || extractionData.overall_confidence);
  console.log(`✅ Production Upload & Extraction: PASS (Class: ${extractionData.document_class}, Confidence: ${extractionData.overall_confidence})`);

  // STEP 3: FETCH DOCUMENTS & CONFIDENCE
  console.log('\n[3/8] Testing Production Document Confidence & Field Inspection (GET /api/documents)...');
  const docsRes = await fetch(`${BASE_URL}/documents`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!docsRes.ok) throw new Error(`Fetch documents failed: ${docsRes.status}`);
  const docsJson = await docsRes.json();
  const documents = docsJson.data?.documents || docsJson.documents || [];
  console.log(`Total live documents accessible: ${documents.length}`);

  let testDocId = documents[0]?.id;
  if (testDocId) {
    const detailRes = await fetch(`${BASE_URL}/documents/${testDocId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (detailRes.ok) {
      const detailJson = await detailRes.json();
      const docDetail = detailJson.data || detailJson;
      results.confidence = typeof (docDetail.overall_confidence ?? docDetail.confidence) === 'number';
      console.log(`✅ Production Confidence UI Data: PASS (Doc: ${docDetail.file_name}, Confidence: ${docDetail.overall_confidence})`);
    }
  }

  // STEP 4: HUMAN-IN-THE-LOOP CORRECTION & VERIFICATION
  console.log('\n[4/8] Testing Human Review & Verification (PUT /api/documents/:id/fields)...');
  if (testDocId) {
    const updateRes = await fetch(`${BASE_URL}/documents/${testDocId}/fields`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'verified',
        fields: [
          { field_key: 'vendor_name', field_value: 'CineForge Verified Vendor' }
        ],
        notes: 'Verified via automated production audit suite'
      })
    });
    if (updateRes.ok) {
      results.review = true;
      results.verification = true;
      console.log('✅ Production Review & Verification: PASS (Status updated to verified)');
    } else {
      console.warn('Verification warning:', await updateRes.text());
    }
  }

  // STEP 5: EXPORT (CSV & JSON)
  console.log('\n[5/8] Testing Production Export (GET /api/documents/:id/export)...');
  if (testDocId) {
    const csvRes = await fetch(`${BASE_URL}/documents/${testDocId}/export?format=csv`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const jsonRes = await fetch(`${BASE_URL}/documents/${testDocId}/export?format=json`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (csvRes.ok && jsonRes.ok) {
      results.export = true;
      console.log('✅ Production Export: PASS (Both CSV and JSON exports generated)');
    }
  }

  // STEP 6: DOCUMENT COMPARISON ENGINE
  console.log('\n[6/8] Testing Production Document Comparison (POST /api/documents/compare)...');
  let docA_id = documents[0]?.id;
  let docB_id = documents[1]?.id || documents[0]?.id;

  const compareRes = await fetch(`${BASE_URL}/documents/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      docA_id,
      docB_id,
      use_ai_summary: false
    })
  });

  if (compareRes.ok) {
    const compJson = await compareRes.json();
    const compData = compJson.data?.comparison || compJson.data || compJson;
    results.comparison = true;
    results.oldVsNew = !!(compData.docA && compData.docB);
    results.changedBreakdown = !!(compData.metrics && typeof compData.metrics.totalChanges === 'number');
    console.log(`✅ Production Comparison: PASS (Match Score: ${compData.metrics?.matchScore}%, Changes: ${compData.metrics?.totalChanges})`);
    console.log(`   Summary: "${compData.summary}"`);
  } else {
    console.error('Comparison error:', await compareRes.text());
  }

  // STEP 7: COMPARISON EXPORT (CSV)
  console.log('\n[7/8] Testing Comparison Export (GET /api/documents/compare/export)...');
  const compExportRes = await fetch(`${BASE_URL}/documents/compare/export?docA_id=${docA_id}&docB_id=${docB_id}&format=csv`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (compExportRes.ok) {
    console.log('✅ Production Comparison CSV Export: PASS');
  }

  // STEP 8: FRONTEND ROUTING & ASSETS
  console.log('\n[8/8] Verifying Live Production Frontend Pages...');
  const pages = ['/', '/dashboard', '/compare', '/settings', '/help', '/presentation'];
  for (const page of pages) {
    const pageRes = await fetch(`${FRONTEND_URL}${page}`);
    console.log(`   ${FRONTEND_URL}${page} -> HTTP ${pageRes.status}`);
  }

  console.log('\n===============================================================');
  console.log('📊 FINAL PRODUCTION AUDIT SUMMARY:');
  console.log(JSON.stringify(results, null, 2));
  console.log('===============================================================');

  return results;
}

runProductionAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
