const form = document.getElementById('patientForm');
const rows = document.getElementById('patientRows');
const message = document.getElementById('message');

async function loadPatients() {
  const res = await fetch('/api/patients');
  const patients = await res.json();
  rows.innerHTML = '';

  for (const p of patients) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.cancer_type}</td>
      <td>${p.stage}</td>
      <td>${p.last_checkup}</td>
      <td>${p.treatment_plan}</td>
    `;
    rows.appendChild(tr);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());

  const res = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    form.reset();
    message.textContent = 'Hasta başarıyla kaydedildi.';
    message.className = 'success';
    await loadPatients();
  } else {
    const data = await res.json();
    message.textContent = data.error || 'Kayıt başarısız.';
    message.className = 'error';
  }
});

loadPatients();
