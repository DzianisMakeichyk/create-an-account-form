import { TweenMax } from 'gsap';
import { countries } from './countries.json';

import './styles/style.scss';

const lineEq = (y2: number, y1: number, x2: number, x1: number, currentVal: number) => {
  const m = (y2 - y1) / (x2 - x1), b = y1 - m * x1;
  return m * currentVal + b;
};

const validateEmail = (email: string) => {
  const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(String(email).toLowerCase());
}

const form = document.querySelector('.form');
const submitButton = form.querySelector('.form__button');
const requiredElems = Array.from(form.querySelectorAll('input[rqrd]'));

const distanceThreshold = { min: 0, max: 75 };
const opacityInterval = { from: 0, to: 1 };

const distancePoints = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));

const getMousePos = (e: MouseEvent) => {
  let posx: number = 0, posy: number = 0;

  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  }
  else if (e.clientX || e.clientY) {
    posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  return { x: posx, y: posy }
};
  
class Nearby {
  DOM: { el: Element; };
  options: { onProgress: ( distance: any ) => void };
  mousemoveFn: (ev: any) => number;
  constructor(el: Element, options: { onProgress: (distance: any) => void }) {
    this.DOM = { el };
    this.options = options;
    this.init();
  }
  init() { 
    this.mousemoveFn = (ev: MouseEvent) => requestAnimationFrame(() => {
      const mousepos = getMousePos(ev);
      const docScrolls = {
        left: document.body.scrollLeft + document.documentElement.scrollLeft,
        top: document.body.scrollTop + document.documentElement.scrollTop
      };
      const elRect = this.DOM.el.getBoundingClientRect();
      const elCoords = {
        x1: elRect.left + docScrolls.left,
        x2: elRect.width + elRect.left + docScrolls.left,
        y1: elRect.top + docScrolls.top,
        y2: elRect.height + elRect.top + docScrolls.top
      };
      const closestPoint = { x: mousepos.x, y: mousepos.y };
      
      if (mousepos.x < elCoords.x1) {
        closestPoint.x = elCoords.x1;
      }
      else if (mousepos.x > elCoords.x2) {
        closestPoint.x = elCoords.x2;
      }
      if (mousepos.y < elCoords.y1) {
        closestPoint.y = elCoords.y1;
      }
      else if (mousepos.y > elCoords.y2) {
        closestPoint.y = elCoords.y2;
      }
      if (this.options.onProgress) {
        this.options.onProgress(distancePoints(mousepos.x, mousepos.y, closestPoint.x, closestPoint.y))
      }
    });

    window.addEventListener('mousemove', this.mousemoveFn);
  }
}

new Nearby(submitButton, {
  onProgress: (distance: any) => {
    const o = lineEq(opacityInterval.from, opacityInterval.to, distanceThreshold.max, distanceThreshold.min, distance);

    requiredElems.forEach(({ value, type, nextElementSibling }: HTMLInputElement) => {
      if (!value || type === 'email' && !validateEmail(value)) {
        const inputErrorEl = nextElementSibling;

        TweenMax.to(inputErrorEl, .3, {
          opacity: Math.max(o,opacityInterval.from)
        });
      }
    });
  }
});

let country: string;
const countryInput: HTMLInputElement = document.querySelector('input[name="country"]');
const phoneInput: HTMLInputElement = document.querySelector('input[name="phone"]');

// FIX: any
function handleCountry(ev: any = '') {
  const countryObj = countries.filter((cntr => cntr.name === ev.target.value))

  if (countryObj.length) {
    const { code, phoneNumberCode, phoneNumberLength } = countryObj[0];
    country = code;

    phoneInput.setAttribute('data-code', `${phoneNumberCode}`);
    phoneInput.setAttribute('data-count', `${phoneNumberLength}`);
  } else {
    country = '';
  }

  handleDisabled(!country);
}

function handleDisabled(state: boolean) {
  const listOfInputs = ['postnumber'];

  listOfInputs.map(el => {
    const input: HTMLInputElement = document.querySelector(`input[name="${el}"]`);

    input.disabled = state
  });
}

// Bring
const postNumberInput: HTMLInputElement = document.querySelector('input[name="postnumber"]');
const cityInput: HTMLInputElement = document.querySelector('input[name="city"]');
const clientURL = window.location.protocol + '//' + window.location.host + '/';

function bringPostalCode() {
  let bringZipValue = parseInt(postNumberInput.value);

  fetch('https://api.bring.com/shippingguide/api/postalCode.json?clientUrl=' + clientURL + '&pnr=' + bringZipValue + '&country=' + country)
    .then(bringCheckStatus)
    .then(bringGetJSON)
    .then(data => {
      if (data.valid === true) {
        cityInput.value = data.result;
      }
      else {
        cityInput.value = '';
      }
    })
    .catch(err => {
      console.log('ERROR', err);
    });
}

function bringCheckStatus(response: {
  status: number;
  statusText: string;
  json: () => any;
}) {
	if (response.status === 200) {
		return Promise.resolve(response);
	}
	else {
		return Promise.reject(
			new Error(response.statusText)
		);
	}
}

function bringGetJSON(response: { json: () => any; }) {
	return response.json();
}

if (postNumberInput && cityInput) {
  postNumberInput.addEventListener('keyup', () => bringPostalCode());
  postNumberInput.removeEventListener('keyup', () => bringPostalCode());
}

if (countryInput) {
  countryInput.addEventListener('input', (ev) => handleCountry(ev));
  countryInput.removeEventListener('input', () => handleCountry());
}
