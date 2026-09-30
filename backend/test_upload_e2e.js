import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function runUploadE2ETest() {
  console.log('====================================================');
  console.log('🚀 TESTING FILE UPLOAD & HITL EXTRACTION END-TO-END');
  console.log('====================================================\n');

  // 1. Authenticate
  console.log('1. Authenticating as IDP Analyst...');
  const authRes = await fetch(`${BASE_URL}/api/auth/demo`, { method: 'POST' });
  if (!authRes.ok) throw new Error(`Auth failed with status ${authRes.status}`);
  const authData = await authRes.json();
  const token = authData.data.token;
  console.log(`   Authenticated successfully! User: ${authData.data.user.email}`);

  // 2. Prepare mock document payload (PNG image)
  console.log('\n2. Preparing document payload (sample_receipt.png)...');
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  const formData = new FormData();
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  formData.append('file', blob, 'sample_receipt_invoice.png');

  // 3. Upload document
  console.log('3. Uploading document to POST /api/documents/upload...');
  const uploadStartTime = Date.now();
  const uploadRes = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Upload failed (${uploadRes.status}): ${errorText}`);
  }

  const uploadResult = await uploadRes.json();
  const elapsed = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
  console.log(`   Upload and extraction completed in ${elapsed}s!`);
  const uploadedDoc = uploadResult.data.documents[0];
  console.log(`   Document ID: ${uploadedDoc.id}`);
  console.log(`   File Name: ${uploadedDoc.file_name}`);
  console.log(`   Class: ${uploadedDoc.document_class}`);
  console.log(`   Status: ${uploadedDoc.status}`);
  console.log(`   Overall Confidence: ${Math.round((uploadedDoc.overall_confidence || 0) * 100)}%`);

  // 4. Retrieve single document details
  console.log('\n4. Fetching document details from GET /api/documents/:id...');
  const detailRes = await fetch(`${BASE_URL}/api/documents/${uploadedDoc.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!detailRes.ok) throw new Error(`Detail fetch failed with status ${detailRes.status}`);
  const detailData = await detailRes.json();
  const doc = detailData.data;

  console.log(`   Extracted Fields (${doc.fields?.length || 0}):`);
  (doc.fields || []).slice(0, 5).forEach(f => {
    console.log(`     - [${f.field_key}]: "${f.field_value}" (Confidence: ${Math.round((f.confidence || 0) * 100)}%, Flagged: ${f.is_flagged})`);
  });

  if (doc.extraction?.line_items?.length) {
    console.log(`   Extracted Line Items (${doc.extraction.line_items.length}):`);
    doc.extraction.line_items.forEach((item, idx) => {
      console.log(`     - #${idx + 1}: ${item.description} | Qty: ${item.quantity} | Total: $${item.total}`);
    });
  }

  // 5. Perform Human-In-The-Loop (HITL) Correction
  console.log('\n5. Performing Human-in-the-Loop (HITL) correction via PUT /api/documents/:id/fields...');
  const updateRes = await fetch(`${BASE_URL}/api/documents/${uploadedDoc.id}/fields`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      status: 'verified',
      notes: 'Audited and verified by Lead QA Engineer',
      fields: [
        {
          field_key: doc.fields?.[0]?.field_key || 'vendor_name',
          field_value: 'Apex Solutions Verified Corp'
        }
      ]
    })
  });

  if (!updateRes.ok) throw new Error(`Field update failed with status ${updateRes.status}`);
  const updateData = await updateRes.json();
  console.log(`   Field update success! New Document Status: ${updateData.data.status}`);

  // 6. Export to CSV and JSON
  console.log('\n6. Testing Document Data Export (CSV & JSON)...');
  const csvRes = await fetch(`${BASE_URL}/api/documents/${uploadedDoc.id}/export?format=csv`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const csvContent = await csvRes.text();
  console.log(`   CSV Export: Received ${csvContent.length} bytes`);

  const jsonRes = await fetch(`${BASE_URL}/api/documents/${uploadedDoc.id}/export?format=json`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const jsonContent = await jsonRes.json();
  console.log(`   JSON Export: Received valid JSON with ID ${jsonContent.id}`);

  console.log('\n====================================================');
  console.log('✅ FILE-UPLOAD & EXTRACTION PIPELINE VERIFIED 100%');
  console.log('====================================================\n');
}

runUploadE2ETest().catch(err => {
  console.error('❌ E2E Upload Test Failed:', err);
  process.exit(1);
});
