

const contactForm = document.getElementById('contact-form');
const successBox = document.getElementById('form-success');
const messageCount = document.getElementById('message-count');

const fields = {
  name: document.getElementById('name'),
  email: document.getElementById('email'),
  phone: document.getElementById('phone'),
  message: document.getElementById('message')
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS_ONLY = /^\d+$/;
const MESSAGE_LIMIT = Number(fields.message.getAttribute('maxlength'));

// Each rule returns an error message, or an empty string when the value is fine
const rules = {
  name: function (value) {
    if (value === '') return 'Please enter your name.';
    return '';
  },
  email: function (value) {
    if (value === '') return 'Please enter your email address.';
    if (!EMAIL_PATTERN.test(value)) return 'Please enter a valid email, like name@example.com.';
    return '';
  },
  phone: function (value) {
    if (value === '') return 'Please enter your phone number.';
    if (!DIGITS_ONLY.test(value)) return 'Phone number can only contain digits (0–9).';
    return '';
  },
  message: function (value) {
    if (value === '') return 'Please write a message.';
    return '';
  }
};

function showError(input, message) {
  const errorElement = document.getElementById(input.id + '-error');
  errorElement.textContent = message;
  input.closest('.field').classList.toggle('has-error', message !== '');
}

// Checks one field, shows or clears its error, and returns true if it is valid
function validateField(name) {
  const input = fields[name];
  const message = rules[name](input.value.trim());
  showError(input, message);
  return message === '';
}

function updateMessageCount() {
  messageCount.textContent = fields.message.value.length + ' / ' + MESSAGE_LIMIT;
}

/* ---------- Event handling ---------- */
contactForm.addEventListener('submit', function (event) {
  event.preventDefault();
  successBox.hidden = true;

  // Check every field so all problems show at once
  const fieldNames = Object.keys(fields);
  const invalidNames = fieldNames.filter(function (name) {
    return !validateField(name);
  });

  if (invalidNames.length > 0) {
    fields[invalidNames[0]].focus();
    return;
  }

  // Everything is valid: say thanks and clear the form
  const firstName = fields.name.value.trim().split(/\s+/)[0];
  successBox.textContent = 'Thanks, ' + firstName + '! Your message has been received.';
  successBox.hidden = false;
  successBox.focus();

  contactForm.reset();
  fieldNames.forEach(function (name) {
    delete fields[name].dataset.touched;
  });
  updateMessageCount();
});

// Check a field when the user leaves it, then keep checking as they type
Object.keys(fields).forEach(function (name) {
  const input = fields[name];

  input.addEventListener('blur', function () {
    if (input.value.trim() !== '') input.dataset.touched = 'true';
    if (input.dataset.touched) validateField(name);
  });

  input.addEventListener('input', function () {
    if (input.dataset.touched || input.closest('.field').classList.contains('has-error')) {
      validateField(name);
    }
  });
});

fields.message.addEventListener('input', updateMessageCount);
updateMessageCount();
