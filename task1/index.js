const customers = require("./data/customers.json");
const orders = require("./data/orders.json");
const products = require("./data/products.json");

function getOrderbyID(id) {
  return orders.find((order) => order.id == id);
}

function getordersbyCustomers(cId) {
  return orders.filter((order) => order.customerId == cId);
}

function calculateSubtotal(order) {
  let subtotal = 0,
    i = 0;
  while (order.items[i] != null) {
    let proquant = order.items[i].quantity;
    let productID = order.items[i].productId;
    let pro = products.find((product) => product.id == productID);
    let amount = pro.price;
    subtotal += proquant * amount;
    i++;
  }
  return subtotal;
}

function calculateDiscount(order) {
  let subtotal = calculateSubtotal(order);
  let discount = 0;
  if (subtotal < 2000) {
    return (discount = 0);
  } else if (subtotal >= 2000 && subtotal <= 4999) {
    return (discount = subtotal * 0.05);
  } else if (subtotal >= 5000) {
    return (discount = subtotal * 0.1);
  }
}

function calculateTax(order) {
  let discount = calculateDiscount(order);
  let subtotal = calculateSubtotal(order);
  return (subtotal - discount) * 0.18;
}

function calculateTotal(order) {
  let subtotal = calculateSubtotal(order);
  let discount = calculateDiscount(order);
  let tax = calculateTax(order);
  return subtotal - discount + tax;
}

function generateOrderSummary(id) {
  let order = getOrderbyID(id);
  let subtotal = calculateSubtotal(order);
  let discount = calculateDiscount(order);
  let tax = calculateTax(order);
  let total = calculateTotal(order);

  return {
    orderId: id,
    subtotal: subtotal,
    discount: discount,
    tax: tax,
    total: total,
  };
}

function getAllOrderTotals() {
  return orders.map((order) => calculateTotal(order));
}

function calculateTotalRevenue() {
  const totals = getAllOrderTotals();
  return totals.reduce((sum, curr) => sum + curr, 0);
}
function calculateAverageOrderValue() {
  const totals = calculateTotalRevenue();
  return totals / orders.length;
}
function getHighestValueOrder() {
  return orders.reduce((highestOrder, currentOrder) => {
    return calculateTotal(currentOrder) > calculateTotal(highestOrder)
      ? currentOrder
      : highestOrder;
  });
}
function hasHighValueOrder(threshold) {
  return orders.some((currentOrder) => {
    return calculateTotal(currentOrder) > threshold;
  });
}

function isOrderValid(order) {
  const customerExists = customers.some((c) => c.id == order.customerId);
  const itemsValid = order.items.every((o) => {
    return products.some((p) => p.id == o.productId) && o.quantity > 0;
  });
  return customerExists && itemsValid;
}

function areAllOrdersValid(orders) {
  return orders.every((order) => isOrderValid(order));
}

// console.log(calculateTotalRevenue());
// console.log(calculateAverageOrderValue());
// console.log(getHighestValueOrder());
// console.log(hasHighValueOrder(5000));
// console.log(areAllOrdersValid(orders));

function getCustomer(id, callback) {
  setTimeout(() => {
    let customer = customers.find((cust) => cust.id == id);
    if (customer) callback(null, customer);
    else callback("invalid id", null);
  }, 2000);
}

function getProducts(order, callback) {
  setTimeout(() => {
    let allproducts = order.items.map((item) => {
      return products.find((p) => p.id == item.productId);
    });
    let problem = allproducts.some((p) => p == undefined);
    if (problem) callback("missing products", null);
    else callback(null, allproducts);
  }, 2000);
}

function checkStock(order, callback) {
  setTimeout(() => {
    const stockOk = order.items.every((item) => {
      const prod = products.find((p) => p.id == item.productId);
      return prod && prod.stock >= item.quantity;
    });
    if (stockOk) {
      callback(null, "all stocks available");
    } else {
      callback("insufficient stock", null);
    }
  }, 2000);
}

function processPayment(order, callback) {
  setTimeout(() => {
    const success = Math.random() >= 0.5;
    if (success) callback(null, "payment successful");
    else callback("payment failed", null);
  }, 2000);
}

function createOrder(order, customer, products, stock, payment, callback) {
  setTimeout(() => {
    const confirmation = {
      orderID: order.id,
      customerID: customer.id,
      customerName: customer.name,
      itemsPurchased: products,
      stockStatus: stock,
      payableAmount: calculateTotal(order),
      paymentStatus: payment,
    };
    callback(null, confirmation);
  }, 5000);
}

function theCallbackFlow(id) {
  const order = getOrderbyID(id);
  getCustomer(order.customerId, (err, customer) => {
    if (err) {
      console.log("failed to get customer", err);
      return;
    }
    getProducts(order, (err, products) => {
      if (err) {
        console.log("failed to get products", err);
        return;
      }
      checkStock(order, (err, stock) => {
        if (err) {
          console.log("failed to check stock", err);
          return;
        }
        processPayment(order, (err, payment) => {
          if (err) {
            console.log("failed to process payment", err);
            return;
          }
          createOrder(
            order,
            customer,
            products,
            stock,
            payment,
            (err, confirmation) => {
              if (err) {
                console.log("failed to create order", err);
                return;
              }
              console.log("order created successfully", confirmation);
            },
          );
        });
      });
    });
  });
}

theCallbackFlow(1001);

function getCustomerPromise(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const customer = customers.find((c) => c.id == id);
      if (customer) resolve(customer);
      else reject(new CustomerNotFoundError(id));
    }, 2000);
  });
}

function getProductsPromise(order) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const allproducts = order.items.map((items) =>
        products.find((p) => p.id == items.productId),
      );
      const problem = allproducts.some((p) => p == undefined);
      if (problem) {
        const missingProductId = order.items.find(
          (item) => !products.some((p) => p.id == item.productId),
        ).productId;
        reject(new ProductNotFoundError(missingProductId));
      } else resolve(allproducts);
    }, 2000);
  });
}

function checkStockPromise(order) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const stockOk = order.items.every((item) => {
        const prod = products.find((p) => p.id == item.productId);
        return prod && prod.stock >= item.quantity;
      });
      if (stockOk) {
        resolve("all stocks available");
      } else {
        reject(new InsufficientStockError(order));
      }
    }, 2000);
  });
}

function processPaymentPromise(order) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const success = Math.random() >= 0.5;
      if (success) resolve("payment successful");
      else reject(new PaymentFailedError(order));
    }, 2000);
  });
}

function createOrderPromise(order, customer, products, stock, payment) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const confirmation = {
        orderID: order.id,
        customerID: customer.id,
        customerName: customer.name,
        itemsPurchased: products,
        stockStatus: stock,
        payableAmount: calculateTotal(order),
        paymentStatus: payment,
      };
      resolve(confirmation);
    }, 2000);
  });
}

function thePromiseFlow(id) {
  const order = getOrderbyID(id);
  getCustomerPromise(order.customerId)
    .then((cust) => {
      console.log("customer:", cust);
      return getProductsPromise(order).then((prod) => {
        return { cust, prod };
      });
    })
    .then(({ cust, prod }) => {
      console.log("products:", prod);
      return checkStockPromise(order).then((stock) => {
        return { cust, prod, stock };
      });
    })
    .then(({ cust, prod, stock }) => {
      console.log("stock:", stock);
      return processPaymentPromise(order).then((payment) => {
        return { cust, prod, stock, payment };
      });
    })
    .then(({ cust, prod, stock, payment }) => {
      console.log("payment:", payment);
      return createOrderPromise(order, cust, prod, stock, payment);
    })
    .then((confirmation) => {
      console.log("order created successfully:", confirmation);
    })
    .catch((err) => {
      console.error("failed to create order:", err);
    });
}

thePromiseFlow(1001);

class CustomerNotFoundError extends Error {
  constructor(id) {
    super(`customer id ${id} is invalid`);
    this.name = "CustomerNotFoundError";
  }
}

class ProductNotFoundError extends Error {
  constructor(productId) {
    super(`product id ${productId} is invalid`);
    this.name = "ProductNotFoundError";
  }
}

class InsufficientStockError extends Error {
  constructor(order) {
    super(`order ${order.id} has some insufficient stocks`);
    this.name = "InsufficientStockError";
  }
}

class InvalidOrderError extends Error {
  constructor(order) {
    super(`order ${order.id} is invalid`);
    this.name = "InvalidOrderError";
  }
}

class PaymentFailedError extends Error {
  constructor(order) {
    super(`payment for order ${order.id} failed`);
    this.name = "PaymentFailedError";
  }
}

async function theAsyncAwaitFlow(id) {
  const order = getOrderbyID(id);
  try {
    if (!isOrderValid(order, customers, products))
      throw new InvalidOrderError(order);
    const cust = await getCustomerPromise(order.customerId);
    console.log("customer:", cust);
    const prod = await getProductsPromise(order);
    console.log("products:", prod);
    const stocks = await checkStockPromise(order);
    console.log("stock:", stocks);
    const payments = await processPaymentPromise(order);
    console.log("payment:", payments);
    const confirmation = await createOrderPromise(
      order,
      cust,
      prod,
      stocks,
      payments,
    );
    console.log("order created successfully:", confirmation);
  } catch (err) {
    console.error("failed to create order:", err);
    throw err;
  }
}

theAsyncAwaitFlow(1001).catch(() => {});
