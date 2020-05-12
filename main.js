const LOCAL_BACKUP = "products.json";
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const FEED_URL = "https://strategy.rawnet.com/application/files/5215/8021/3438/products.json";

let basket = [];
let productsData = [];

const TAX_AMOUNT = 0.2;

let attempts = 0;
let maxAttempts = 3;

const productCardTemplate = data => `
  <li class="product-card">
    <div class="card">
      <div class="product-image">
        <img src="${data.imageSrc}" alt="${data.imageAlt}" />
      </div>
      <span class="product-name">${data.productName}</span>
      <span class="product-price">£${data.productPrice}</span>
      <button type="button" data-product-sku="${data.productSku}" class="product-cta button">Add to cart</button>
      <button type="button" data-product-sku="${data.productSku}" class="product-view button">Quick view</button>
    </div>
  </li>
`;

const basketItemTemplate = data => `
  <li class="basket-list-item">
    <span class="item-name">${data.productName}</span>
    <span class="item-price">${data.productPrice}</span>
    <span class="item-size">${data.productSize}</span>
  </li>
`;

const variantButtonTemplate = data => `
  <button
    type="button"
    class="button variant-cta"
    data-product-sku="${data.productSku}"
    data-variant-sku="${data.variantSku}"
  >
    ${data.variant}
  </button>
`;

const sortingOptions = {
  'PRICE_DECREASING': 'price-decreasing',
  'PRICE_INCREASING': 'price-increasing',
  'TITLE_DECREASING': 'title-decreasing',
  'TITLE_INCREASING': 'title-increasing'
};

let elements = {};
const fetchElements = function () {
  elements = {
    feedContainer: document.querySelector('.products-list'),
    buttonContainer: document.querySelector('.modal-button-container'),
    basketCounters: document.querySelectorAll('[data-basket-content]'),
    basketContainer: document.querySelector('.basket-list'),
    totalContainer: document.querySelector('.basket-total-price'),
    basketIndicator: document.querySelector('.basket-indicator'),
    taxContainer: document.querySelector('.basket-total-tax'),
    modal: document.querySelector('.modal'),
    sortSelect: document.querySelector('#sort-select')
  };
};

const getProductData = (product, variant = product.variants[0]) => ({
  imageSrc: product.images[0].src,
  imageAlt: product.title,
  productName: product.title,
  productSku: product.id,
  productPrice: parseFloat(variant.price),
  productSize: variant.option1,
  taxable: variant.taxable
});

const addClickListeners = function (selector, callback) {
  const elements = document.querySelectorAll(selector);
  [...elements].forEach(cta => {
    cta.addEventListener('click', callback);
  });
};

const updateUI = () => {
  // Update basket counters
  [...elements.basketCounters].forEach(c => {
    c.setAttribute('data-basket-content', basket.length);
  });

  // Update basket
  elements.basketContainer.innerHTML = "";
  basket.forEach(p => {
    elements.basketContainer.insertAdjacentHTML('beforeend', basketItemTemplate(p));
  });

  // Update basket totals
  const addPrice = (acc, product) => acc + product.productPrice;
  const totalPrice = basket.reduce(addPrice, 0);
  const price = `£${totalPrice.toLocaleString()}`
  elements.totalContainer.innerHTML = price;
  elements.basketIndicator.innerHTML = price;

  // Update taxes
  const addTax = (acc, product) => product.taxable ? acc + product.productPrice * TAX_AMOUNT : acc;
  const totalTax = basket.reduce(addTax, 0);
  elements.taxContainer.innerHTML = `Inc. £${totalTax.toFixed(2).toLocaleString()} in taxes`;
};

const addToBasket = function (product, variant) {
  basket.push(getProductData(product, variant));
};

const setModal = function (state) {
  if (state) {
    elements.modal.classList.add('opened');
  } else {
    elements.modal.classList.remove('opened');
  }
};

const handleSortChange = function (event) {
  const { value } = event.target;
  let sortedProducts = productsData;

  const sortPrice = (a, b) =>
    parseFloat(a.variants[0].price) - parseFloat(b.variants[0].price);

  const sortTitle = (a, b) => {
    const aTitle = a.title.toUpperCase();
    const bTitle = b.title.toUpperCase();

    if (aTitle > bTitle) {
      return -1;
    }
    if (aTitle < bTitle) {
      return 1;
    }
    return 0;
  };

  switch (value) {
    case sortingOptions['PRICE_INCREASING']:
      sortedProducts.sort((a, b) => sortPrice(a, b));
      break;
    case sortingOptions['PRICE_DECREASING']:
      sortedProducts.sort((a, b) => sortPrice(b, a));
      break
    case sortingOptions['TITLE_DECREASING']:
      sortedProducts.sort((a, b) => sortTitle(a, b));
      break
    case sortingOptions['TITLE_INCREASING']:
      sortedProducts.sort((a, b) => sortTitle(b, a));
      break;
    default:
      sortedProducts = productsData;
  }

  renderFeed(sortedProducts);
  addClickListeners('.product-cta', handleProductClick);
};

const renderVariantButtons = function (product) {
  elements.buttonContainer.innerHTML = "";
  product.variants.forEach(v => {
    elements.buttonContainer.insertAdjacentHTML('beforeend', variantButtonTemplate({
      productSku: product.id,
      variantSku: v.id,
      variant: v.title
    }));
  });
};

const handleVariantClick = function (event) {
  const { variantSku, productSku } = event.target.dataset;
  const product = productsData.find(p => p.id.toString() === productSku);
  const variant = product.variants.find(v => v.id.toString() === variantSku);

  addToBasket(product, variant);
  setModal(false);
  updateUI();
};

const handleProductClick = function (event) {
  const { productSku } = event.target.dataset;
  const product = productsData.find(p => p.id.toString() === productSku);

  renderVariantButtons(product);
  addClickListeners('.variant-cta', handleVariantClick);
  addClickListeners('.modal', () => setModal(false));
  setModal(true);
};

const renderFeed = function (products) {
  elements.feedContainer.innerHTML = "";
  products.forEach(product => {
    const templateData = getProductData(product);
    elements.feedContainer.insertAdjacentHTML('beforeend', productCardTemplate(templateData));
  });
};

const loadFeed = function (url) {
  return fetch(url)
    .then(response => response.json())
    .then(data => {
      productsData = data.products;
      return data.products;
    })
    .catch(() => {
      ++attempts <= maxAttempts && loadFeed(LOCAL_BACKUP);
    });
};

const initalise = function () {
  // Fetch DOM elements
  fetchElements();

  // Load product feed
  loadFeed(`${CORS_PROXY}${FEED_URL}`).then(products => {

    // Populate product feed
    renderFeed(products);
    addClickListeners('.product-cta', handleProductClick);

    // Watch product sort selector
    elements.sortSelect.addEventListener('change', handleSortChange);
  });
};

window.onload = initalise;
