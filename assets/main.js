const FORMAT_ENDPOINT = "https://script.google.com/macros/s/AKfycbzmfLSze5YjwtByRxifCWdUAI0jm6APxwVLfP_4OiwVHjhJ682wdknw1aHOEsdQLL8/exec";
let client = ZAFClient.init();

async function runValidation() {
  document.getElementById("status").textContent = "Checking vendor reference...";

  const fieldVendorId = "custom_field_360024198072";
  const fieldRefNumber = "custom_field_360026921692";

  const data = await client.get([
    'ticket.id',
    'ticket.assignee.user.id',
    `ticket.customField:custom_field_360024198072`,
    `ticket.customField:custom_field_360026921692`
  ]);

  const ticketId = data['ticket.id'];
  const assigneeId = data['ticket.assignee.user.id'];
  const vendorId = data[fieldVendorId]?.trim();
  const refNumber = data[fieldRefNumber]?.trim();

  if (!vendorId || !refNumber) {
    document.getElementById("status").textContent = "Vendor ID or Reference missing.";
    return;
  }

  try {
    const formatRes = await fetch(FORMAT_ENDPOINT);
    const formatMap = await formatRes.json();
    const expectedRegex = formatMap[vendorId];

    if (!expectedRegex) {
      document.getElementById("status").textContent = "No format rule defined for this vendor.";
      return;
    }

    const regex = new RegExp(expectedRegex);
    if (regex.test(refNumber)) {
      document.getElementById("status").innerHTML = `<span class="success">✅ Format valid</span>`;
    } else {
      document.getElementById("status").innerHTML = `<span class="warning">⚠️ Format invalid</span>`;
      await fetch(FORMAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          vendor_id: vendorId,
          ref_number: refNumber,
          expected_format: expectedRegex,
          assignee_id: assigneeId,
          issue: "Format mismatch"
        })
      });
    }
  } catch (err) {
    document.getElementById("status").textContent = "Validation error.";
    console.error(err);
  }
}

runValidation();
