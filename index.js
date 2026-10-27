let myOrder = [];
let Eligibility = null;   
let userAge = null;       
let nextCartId = 1;

const userNameInput = document.getElementById('user-name');
const userAgeInput = document.getElementById('user-age');
const statusCoupleRadio = document.getElementById('status-couple');
const statusSingleRadio = document.getElementById('status-single');

const btnCheckEligibility = document.getElementById('btn-check-eligibility');
const eligibilityStatusMsg = document.getElementById('eligibility-status-msg');
const snackWarningMsg = document.getElementById('snack-warning-msg');

const addButtons = document.querySelectorAll('.btn-add');

const cartTicketsList = document.getElementById('cart-tickets-list');
const cartSnacksList = document.getElementById('cart-snacks-list');   

const subtotalAmount = document.getElementById('subtotal-amount');
const coupleDiscountRow = document.getElementById('couple-discount-row');
const coupleDiscountAmount = document.getElementById('couple-discount-amount');
const bulkDiscountRow = document.getElementById('bulk-discount-row');
const bulkDiscountAmount = document.getElementById('bulk-discount-amount');
const finalTotalAmount = document.getElementById('final-total-amount');
const btnCheckout = document.getElementById('btn-checkout');

window.addEventListener('load', () => {
  userNameInput.value = '';
  userAgeInput.value = '';
  statusCoupleRadio.checked = false;
  statusSingleRadio.checked = false;
  renderCart();
});


function checkEligibility() {
  const username = userNameInput.value.trim();
  const age = parseInt(userAgeInput.value, 10);

  if (!username || isNaN(age) || age < 1) {
    eligibilityStatusMsg.textContent = "Please enter your name and a valid age.";
    eligibilityStatusMsg.className = "status-msg error";
    Eligibility = null;
    userAge = null;
    renderCart();
    return;
  }

  if (!statusSingleRadio.checked && !statusCoupleRadio.checked) {
    eligibilityStatusMsg.textContent = "Please select Single or Couple.";
    eligibilityStatusMsg.className = "status-msg error";
    Eligibility = null;
    userAge = null;
    renderCart();
    return;
  }

  userAge = age;

  if (age < 15) {
    Eligibility = "kids";
    eligibilityStatusMsg.textContent = `Hello ${username}, you qualify for a kids ticket.`;
  } else {
    Eligibility = "adults";
    eligibilityStatusMsg.textContent =`Hello ${username}, you qualify for an adults ticket.`;
  }
  eligibilityStatusMsg.className = "status-msg success";

  snackWarningMsg.classList.add('hidden');

  const before = myOrder.length;
  myOrder = myOrder.filter((item) => {
    if (item.type === 'ticket') {
      return item.id.includes(Eligibility === 'kids' ? 'kid' : 'adult');
    }
    if (item.type === 'alcohol') {
      return userAge >= 18;
    }
    return true;
  });

  if (myOrder.length < before) {
    snackWarningMsg.textContent = "Some items were removed because they don't match your eligibility.";
    snackWarningMsg.classList.remove('hidden');
  }

  renderCart();
}

btnCheckEligibility.addEventListener('click', checkEligibility);


[userNameInput, userAgeInput].forEach((el) => {
  el.addEventListener('input', () => {
    Eligibility = null;
    userAge = null;
    eligibilityStatusMsg.classList.add('hidden');
    renderCart();
  });
});


addButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const itemId = button.dataset.id;
    const itemName = button.dataset.name;
    const itemPrice = parseFloat(button.dataset.price);
    const itemType = button.dataset.type;

    
    if (Eligibility === null || userAge === null) {
      if (itemType === 'ticket') {
        eligibilityStatusMsg.textContent = "Please check your eligibility first!";
        eligibilityStatusMsg.className = "status-msg error";
      } else {
        snackWarningMsg.textContent = "Please check your eligibility first (Section 1).";
        snackWarningMsg.classList.remove('hidden');
      }
      return;
    }
    if (itemType === 'ticket') {
      if (Eligibility === 'kids' && itemId.includes('adult')) {
        eligibilityStatusMsg.textContent = "Sorry, you qualify for kids tickets only.";
        eligibilityStatusMsg.className = "status-msg error";
        return;
      }
      if (Eligibility === 'adults' && itemId.includes('kid')) {
        eligibilityStatusMsg.textContent = "Adults must purchase adult category tickets.";
        eligibilityStatusMsg.className = "status-msg error";
        return;
      }
    }

    
    if (itemType === 'alcohol' && userAge < 18) {
      snackWarningMsg.textContent = "Sorry, you don't qualify for alcoholic drinks (18+ only).";
      snackWarningMsg.classList.remove('hidden');
      return;
    }

    snackWarningMsg.classList.add('hidden');

    
    const orderItem = {
      cartId: nextCartId++,
      id: itemId,
      name: itemName,
      price: itemPrice,
      type: itemType
    };

    myOrder.push(orderItem);
    renderCart();
  });
});

function deleteCartItem(cartId) {
  myOrder = myOrder.filter((item) => item.cartId !== cartId);
  renderCart();
}


[cartTicketsList, cartSnacksList].forEach((list) => {
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-delete');
    if (btn) {
      deleteCartItem(Number(btn.dataset.cartId));
    }
  });
});

statusCoupleRadio.addEventListener('change', renderCart);
statusSingleRadio.addEventListener('change', renderCart);

function renderCart() {
  cartTicketsList.innerHTML = '';
  cartSnacksList.innerHTML = '';

  const ticketItems = myOrder.filter((item) => item.type === 'ticket');
  const snackItems = myOrder.filter((item) => item.type !== 'ticket');

  if (ticketItems.length === 0) {
    cartTicketsList.innerHTML = '<li class="empty-msg">No tickets selected yet.</li>';
  } else {
    ticketItems.forEach((item) => {
      cartTicketsList.appendChild(createCartRow(item));
    });
  }

  if (snackItems.length === 0) {
    cartSnacksList.innerHTML = '<li class="empty-msg">No snacks added yet.</li>';
  } else {
    snackItems.forEach((item) => {
      cartSnacksList.appendChild(createCartRow(item));
    });
  }

  calculateBill();
}

function createCartRow(item) {
  const li = document.createElement('li');

  const label = document.createElement('span');
  label.textContent = `${item.name} - $${item.price.toFixed(2)}`;

  const del = document.createElement('button');
  del.className = 'btn btn-delete';
  del.textContent = 'Delete';
  del.dataset.cartId = item.cartId;

  li.appendChild(label);
  li.appendChild(del);
  return li;
}

function calculateBill() {
  const subtotal = myOrder.reduce((sum, item) => sum + item.price, 0);

  let coupleDiscount = 0;
  let bulkDiscount = 0;

  if (statusCoupleRadio.checked && subtotal > 0) {
    coupleDiscount = subtotal * 0.10;
    coupleDiscountRow.classList.remove('hidden');
    coupleDiscountAmount.textContent = `-$${coupleDiscount.toFixed(2)}`;
  } else {
    coupleDiscountRow.classList.add('hidden');
  }

  const priceAfterCouple = subtotal - coupleDiscount;
  if (priceAfterCouple > 30) {
    bulkDiscount = 5.00;
    bulkDiscountRow.classList.remove('hidden');
    bulkDiscountAmount.textContent = `-$${bulkDiscount.toFixed(2)}`;
  } else {
    bulkDiscountRow.classList.add('hidden');
  }

  const finalTotal = Math.max(0, subtotal - coupleDiscount - bulkDiscount);

  subtotalAmount.textContent = `$${subtotal.toFixed(2)}`;
  finalTotalAmount.textContent = `$${finalTotal.toFixed(2)}`;

  const hasTicket = myOrder.some((item) => item.type === 'ticket');
  btnCheckout.disabled = !(Eligibility !== null && hasTicket);
}


btnCheckout.addEventListener('click', () => {
  alert(`Thank you! Your total is ${finalTotalAmount.textContent}. Enjoy the movie!`);
  myOrder = [];
  renderCart();
});