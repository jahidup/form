const form = document.getElementById('contactForm');
const messageDiv = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value.trim();
  const mobile = document.getElementById('mobile').value.trim();
  
  // Simple client-side validation
  if (!name || !mobile) {
    showMessage('Please fill in all fields', 'error');
    return;
  }
  
  if (!/^\d{10}$/.test(mobile)) {
    showMessage('Please enter a valid 10-digit mobile number', 'error');
    return;
  }
  
  // Disable button while submitting
  const submitBtn = form.querySelector('button');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';
  
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mobile })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showMessage('✅ Contact saved successfully!', 'success');
      form.reset();
    } else {
      showMessage(data.message || 'Something went wrong', 'error');
    }
  } catch (error) {
    showMessage('Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});

function showMessage(msg, type) {
  messageDiv.textContent = msg;
  messageDiv.className = `message ${type}`;
  setTimeout(() => {
    messageDiv.style.display = 'none';
    messageDiv.className = 'message';
  }, 3000);
}
