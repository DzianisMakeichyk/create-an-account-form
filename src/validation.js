import vest, { test } from 'vest';
import enforce from 'vest/enforceExtended';
import classNames from 'vest/classNames';
import { countries } from './countries.json';

const form = document.querySelector('.form');
const allInputs = Array.from(form.querySelectorAll('input'));
const phoneInput = document.querySelector('input[name="phone"]');
const cities = countries.map(cntr => cntr.name);

const validate = vest.create('form', ({
  firstname,
  lastname,
  email,
  country,
  phone,
}) => {
  // First Name
  test('firstname', "Can't be empty", () => {
    enforce(firstname.value).isNotEmpty();
  });
  test('firstname', 'Must be at least three chars long', () => {
    enforce(firstname.value)
      .longerThan(2);
  });

  // Second Name
  test('lastname', "Can't be empty", () => {
    enforce(lastname.value).isNotEmpty();
  });
  test('lastname', 'Must be at least three chars long', () => {
    enforce(lastname.value)
      .longerThan(2);
  });

  // Email
  test('email', 'Must be a valid email address.', () => {
    enforce(email.value).isEmail();
  });

  // Phone
  const phoneNumberCode = phoneInput.getAttribute('data-code');
  const phoneNumberLength = phoneInput.getAttribute('data-count');

  test('phone', "Can't be empty", () => {
    enforce(phone.value).isNotEmpty();
  });
  test('phone', `Shoud be numeric`, () => {
    enforce(phone.value).isNumeric();
  });
  if (phoneNumberLength && phoneNumberLength) {
    test('phone', `${country.value.toLowerCase()} code number shoud be start from ${phoneNumberCode}`, () => {
      enforce(phone.value.substring(0, 2)).inside(phoneNumberCode);
    });
    test('phone', `${country.value.toLowerCase()} numbers shoud have length of ${phoneNumberLength} numbers`, () => {
      enforce(phone.value).lengthEquals(phoneNumberLength.toNumber() + phoneNumberCode.toString().length);
    });
  }

  // Country
  test('country', "Can't be empty", () => {
    enforce(country.value).isNotEmpty();
  });
  test('country', "Should be string", () => {
    enforce(country.value).isString();
  });
  test('country', `Allowed only: ${cities}`, () => {
    enforce(country.value.toLowerCase()).inside(cities);
  });
  // Postnumber
  test('postnumber', `Shoud be numeric`, () => {
    enforce(postnumber.value).isNumeric();
  });
  // Address
  test('address', "Can't be empty", () => {
    enforce(address.value).isNotEmpty();
  });
  test('address', "Should be string", () => {
    enforce(address.value).isString();
  });
})

const handleChange = ({ target }) => {
  const { name, value, checked } = target;

  validate({ [name]: { value, checked } }, name)
    .done(handleResult);
}

const handleSubmit = () => {
  const allData = allInputs.reduce((allData, current) => (
    Object.assign(allData, {
      [current.name]: current
    })
  ), {});
  validate(allData)
    .done(handleResult);
}

const handleResult = (result) => {
  const cn = classNames(result, {
    valid: 'valid',
    invalid: 'invalid',
    warning: 'warning'
  });
  const classNamesList = ['valid', 'invalid', 'warning'];

  allInputs.forEach(({ name }) => {
    // Find the parent element
    const parent = form.querySelector(`.${name}-wrapper`);

    const messages = [...result.getErrors(name), ...result.getWarnings(name)];

    // Remove duplicate classes 
    classNamesList.map(item => {
      if (parent.classList.contains(item)) {
        parent.classList.remove(item)
      }
    })

    // update the DOM    
    parent.className += ` ${cn(name)}`;
    parent.setAttribute('data-msg', messages[0]||'');
  });
}

form.addEventListener('keyup', handleChange);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  handleSubmit();
});
form.removeEventListener('keyup', handleChange);
form.removeEventListener('submit', handleSubmit);
