import "dotenv/config";
import prisma from "../db/client.js";
import { hashPassword } from "../db/password.js";
import OrderService from "../modules/order/order.service.js";
import InvoiceService from "../modules/invoice/invoice.service.js";
import { seedRestaurantSubscriber } from "./restaurantSubscriber.seeder.js";

const DEMO = "[demo]";

const CATEGORIES = [
  { name: "Appetizers", description: "Start your meal with our delicious appetizers" },
  { name: "Main Courses", description: "Hearty and satisfying main dishes" },
  { name: "Desserts", description: "Sweet treats to end your meal" },
  { name: "Beverages", description: "Refreshing drinks and beverages" },
  { name: "Salads", description: "Fresh and healthy salad options" },
];

const MENU = [
  { name: "Caesar Salad", description: "Fresh romaine lettuce with Caesar dressing and croutons", price: 45, category: "Appetizers" },
  { name: "Garlic Bread", description: "Toasted bread with garlic butter and herbs", price: 25, category: "Appetizers" },
  { name: "Chicken Wings", description: "Crispy chicken wings with your choice of sauce", price: 65, category: "Appetizers" },
  { name: "Grilled Chicken", description: "Tender grilled chicken breast with vegetables", price: 120, category: "Main Courses" },
  { name: "Beef Steak", description: "Premium beef steak cooked to perfection", price: 250, category: "Main Courses" },
  { name: "Pasta Carbonara", description: "Creamy pasta with bacon and parmesan", price: 95, category: "Main Courses" },
  { name: "Margherita Pizza", description: "Classic pizza with tomato, mozzarella, and basil", price: 85, category: "Main Courses" },
  { name: "Chocolate Cake", description: "Rich chocolate cake with chocolate frosting", price: 50, category: "Desserts" },
  { name: "Tiramisu", description: "Classic Italian dessert with coffee and mascarpone", price: 60, category: "Desserts" },
  { name: "Ice Cream", description: "Three scoops of your favorite flavors", price: 35, category: "Desserts" },
  { name: "Fresh Orange Juice", description: "Freshly squeezed orange juice", price: 30, category: "Beverages" },
  { name: "Cappuccino", description: "Italian coffee with steamed milk", price: 25, category: "Beverages" },
  { name: "Soft Drink", description: "Choice of cola, sprite, or fanta", price: 15, category: "Beverages" },
  { name: "Greek Salad", description: "Fresh vegetables with feta cheese and olives", price: 55, category: "Salads" },
  { name: "Garden Salad", description: "Mixed greens with fresh vegetables", price: 40, category: "Salads" },
];

const SUPPLIERS = [
  { name: "Fresh Produce Co.", contactPerson: "Ahmed Hassan", phone: "+20 100 111 1111", email: "contact@freshproduce.com", address: "456 Market Street, Cairo" },
  { name: "Premium Meats Ltd.", contactPerson: "Mohamed Ali", phone: "+20 100 222 2222", email: "sales@premiummeats.com", address: "789 Industrial Zone, Cairo" },
  { name: "Dairy Delights", contactPerson: "Sara Ibrahim", phone: "+20 100 333 3333", email: "info@dairydelights.com", address: "321 Dairy Road, Giza" },
];

const INVENTORY = [
  { name: "Chicken Breast", sku: "GF-001", unit: "kg", stock: 50, minStockAlert: 10, costPrice: 80, supplier: "Fresh Produce Co." },
  { name: "Beef", sku: "GF-002", unit: "kg", stock: 30, minStockAlert: 5, costPrice: 200, supplier: "Premium Meats Ltd." },
  { name: "Pasta", sku: "GF-003", unit: "kg", stock: 40, minStockAlert: 10, costPrice: 25, supplier: "Dairy Delights" },
  { name: "Tomatoes", sku: "GF-004", unit: "kg", stock: 25, minStockAlert: 5, costPrice: 15, supplier: "Fresh Produce Co." },
  { name: "Lettuce", sku: "GF-005", unit: "kg", stock: 20, minStockAlert: 5, costPrice: 20, supplier: "Premium Meats Ltd." },
  { name: "Mozzarella Cheese", sku: "GF-006", unit: "kg", stock: 15, minStockAlert: 3, costPrice: 120, supplier: "Dairy Delights" },
  { name: "Olive Oil", sku: "GF-007", unit: "liter", stock: 10, minStockAlert: 2, costPrice: 150, supplier: "Fresh Produce Co." },
  { name: "Coffee Beans", sku: "GF-008", unit: "kg", stock: 8, minStockAlert: 2, costPrice: 300, supplier: "Premium Meats Ltd." },
  { name: "Orange", sku: "GF-009", unit: "kg", stock: 30, minStockAlert: 10, costPrice: 20, supplier: "Dairy Delights" },
  { name: "Chocolate", sku: "GF-010", unit: "kg", stock: 12, minStockAlert: 3, costPrice: 180, supplier: "Fresh Produce Co." },
];

const RECIPES = {
  "Caesar Salad": [{ item: "Lettuce", qty: 0.15 }, { item: "Olive Oil", qty: 0.02 }],
  "Garlic Bread": [{ item: "Olive Oil", qty: 0.02 }],
  "Chicken Wings": [{ item: "Chicken Breast", qty: 0.25 }],
  "Grilled Chicken": [{ item: "Chicken Breast", qty: 0.3 }, { item: "Olive Oil", qty: 0.02 }],
  "Beef Steak": [{ item: "Beef", qty: 0.3 }],
  "Pasta Carbonara": [{ item: "Pasta", qty: 0.2 }, { item: "Mozzarella Cheese", qty: 0.05 }],
  "Margherita Pizza": [{ item: "Tomatoes", qty: 0.1 }, { item: "Mozzarella Cheese", qty: 0.15 }, { item: "Olive Oil", qty: 0.02 }],
  "Chocolate Cake": [{ item: "Chocolate", qty: 0.08 }],
  "Tiramisu": [{ item: "Chocolate", qty: 0.03 }, { item: "Coffee Beans", qty: 0.02 }],
  "Ice Cream": [{ item: "Chocolate", qty: 0.04 }],
  "Fresh Orange Juice": [{ item: "Orange", qty: 0.3 }],
  Cappuccino: [{ item: "Coffee Beans", qty: 0.02 }],
  "Greek Salad": [{ item: "Lettuce", qty: 0.12 }, { item: "Tomatoes", qty: 0.08 }, { item: "Olive Oil", qty: 0.02 }],
  "Garden Salad": [{ item: "Lettuce", qty: 0.15 }, { item: "Tomatoes", qty: 0.05 }, { item: "Olive Oil", qty: 0.01 }],
};

const TABLES = [
  { number: "1", seats: 2 },
  { number: "2", seats: 4 },
  { number: "3", seats: 4 },
  { number: "4", seats: 6 },
  { number: "5", seats: 2 },
  { number: "6", seats: 4 },
  { number: "7", seats: 8 },
  { number: "8", seats: 6 },
];

const STAFF = [
  { name: "John Manager", email: "manager@goldenfork.com", password: "Manager@123", phone: "+20 100 000 0002", role: "Manager", department: "Management" },
  { name: "Sarah Cashier", email: "cashier@goldenfork.com", password: "Cashier@123", phone: "+20 100 000 0003", role: "Cashier", department: "Service" },
  { name: "Mike Chef", email: "chef@goldenfork.com", password: "Chef@123", phone: "+20 100 000 0004", role: "Chef", department: "Kitchen" },
  { name: "Emma Waiter", email: "waiter@goldenfork.com", password: "Waiter@123", phone: "+20 100 000 0005", role: "Waiter", department: "Service" },
];

const CUSTOMERS = [
  { name: "Layla Hassan", phone: "+201001110001", email: "layla@example.com", address: "14 Nile Corniche, Cairo" },
  { name: "Omar Farid", phone: "+201001110002", email: "omar@example.com", address: "22 Dokki Street, Giza" },
  { name: "Nour Adel", phone: "+201001110003", email: "nour@example.com", address: "8 Zamalek Street, Cairo" },
  { name: "Hassan Ali", phone: "+201001110004", email: "hassan@example.com", address: "5 Heliopolis Square, Cairo" },
];

function daysFromNow(days, hour = 12) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function ensureCatalog(restaurantId, staffId) {
  const categories = new Map();
  for (const category of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { name_restaurantId: { name: category.name, restaurantId } },
      update: {},
      create: { ...category, restaurantId },
    });
    categories.set(row.name, row.id);
  }

  const suppliers = new Map();
  for (const supplier of SUPPLIERS) {
    const existing = await prisma.supplier.findFirst({
      where: { restaurantId, phone: supplier.phone },
    });
    const row = existing || await prisma.supplier.create({
      data: {
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        address: { street: supplier.address },
        restaurantId,
      },
    });
    suppliers.set(supplier.name, row);
  }

  const inventory = new Map();
  for (const item of INVENTORY) {
    const supplier = suppliers.get(item.supplier);
    let row = await prisma.inventoryItem.findFirst({
      where: { restaurantId, name: item.name },
    });
    if (!row) {
      row = await prisma.inventoryItem.create({
        data: {
          name: item.name,
          sku: item.sku,
          unit: item.unit,
          stock: item.stock,
          minStockAlert: item.minStockAlert,
          costPrice: item.costPrice,
          supplierId: supplier.id,
          restaurantId,
        },
      });
      await prisma.stockMovement.create({
        data: {
          inventoryItemId: row.id,
          qty: item.stock,
          type: "opening",
          createdById: staffId,
        },
      });
    }
    inventory.set(row.name, row);
  }

  for (const [supplierName, supplier] of suppliers) {
    if (supplier.products?.length) continue;
    const products = INVENTORY.filter((item) => item.supplier === supplierName).map((item) => item.name);
    await prisma.supplier.update({ where: { id: supplier.id }, data: { products } });
  }

  const menu = new Map();
  for (const item of MENU) {
    let row = await prisma.menuItem.findFirst({
      where: { restaurantId, name: item.name },
    });
    if (!row) {
      row = await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          categoryId: categories.get(item.category),
          restaurantId,
        },
      });
    }
    menu.set(row.name, row);

    const recipeCount = await prisma.menuRecipeItem.count({ where: { menuItemId: row.id } });
    const recipe = RECIPES[item.name] || [];
    if (!recipeCount && recipe.length) {
      await prisma.menuRecipeItem.createMany({
        data: recipe.map((line) => ({
          menuItemId: row.id,
          inventoryItemId: inventory.get(line.item).id,
          qty: line.qty,
        })),
      });
    }
  }

  for (const table of TABLES) {
    await prisma.table.upsert({
      where: { number_restaurantId: { number: table.number, restaurantId } },
      update: {},
      create: { ...table, restaurantId, status: "available" },
    });
  }

  console.log(`Catalog ready: ${categories.size} categories, ${menu.size} menu items, ${inventory.size} inventory items.`);
  return menu;
}

async function ensureStaff(restaurantId) {
  for (const member of STAFF) {
    const existing = await prisma.staff.findUnique({ where: { email: member.email } });
    if (existing) continue;
    const [role, department] = await Promise.all([
      prisma.role.findFirst({ where: { restaurantId, name: member.role } }),
      prisma.department.findFirst({ where: { restaurantId, name: member.department } }),
    ]);
    await prisma.staff.create({
      data: {
        name: member.name,
        email: member.email,
        passwordHash: await hashPassword(member.password),
        phone: member.phone,
        roleId: role?.id || null,
        departmentId: department?.id || null,
        restaurantId,
        isActive: true,
      },
    });
    console.log(`Staff ready: ${member.email}`);
  }
}

async function ensureCustomers(restaurantId) {
  const customers = new Map();
  for (const customer of CUSTOMERS) {
    const row = await prisma.customer.upsert({
      where: { phone_restaurantId: { phone: customer.phone, restaurantId } },
      update: {},
      create: { ...customer, restaurantId },
    });
    customers.set(customer.phone, row);
  }
  return customers;
}

async function ensureReservations(restaurantId, customers) {
  const existing = await prisma.reservation.findFirst({
    where: { restaurantId, notes: { startsWith: DEMO } },
  });
  if (existing) {
    console.log("Demo reservations already exist.");
    return;
  }

  const table5 = await prisma.table.findFirst({ where: { restaurantId, number: "5" } });
  const table6 = await prisma.table.findFirst({ where: { restaurantId, number: "6" } });
  await prisma.reservation.createMany({
    data: [
      {
        reservedAt: daysFromNow(1, 19),
        numberOfGuests: 2,
        durationMinutes: 90,
        status: "confirmed",
        notes: `${DEMO} Layla dinner`,
        tableId: table5?.id || null,
        customerId: customers.get("+201001110001").id,
        restaurantId,
      },
      {
        reservedAt: daysFromNow(2, 20),
        numberOfGuests: 4,
        durationMinutes: 120,
        status: "pending",
        notes: `${DEMO} Omar family`,
        tableId: table6?.id || null,
        customerId: customers.get("+201001110002").id,
        restaurantId,
      },
    ],
  });
  console.log("Demo reservations created.");
}

async function ensureOrders(restaurantId, staffId, customers) {
  const existing = await prisma.order.findFirst({
    where: { restaurantId, notes: { startsWith: DEMO } },
  });
  if (existing) {
    console.log("Demo orders already exist.");
    return;
  }

  const tables = new Map(
    (await prisma.table.findMany({ where: { restaurantId } })).map((table) => [table.number, table.id]),
  );
  const menu = new Map(
    (await prisma.menuItem.findMany({ where: { restaurantId } })).map((item) => [item.name, item.id]),
  );

  const samples = [
    { key: "pending", type: "dineIn", table: "1", status: "pending", items: [["Caesar Salad", 1], ["Garlic Bread", 1]], daysAgo: 0 },
    { key: "kitchen", type: "dineIn", table: "2", status: "in_kitchen", items: [["Grilled Chicken", 1], ["Garden Salad", 1]], daysAgo: 0 },
    { key: "served", type: "takeaway", customer: "+201001110002", status: "served", items: [["Pasta Carbonara", 1], ["Soft Drink", 2]], daysAgo: 1 },
    { key: "delivery", type: "delivery", customer: "+201001110001", status: "out_for_delivery", items: [["Beef Steak", 1], ["Fresh Orange Juice", 1]], daysAgo: 0 },
    { key: "delivered", type: "delivery", customer: "+201001110003", status: "delivered", items: [["Margherita Pizza", 1], ["Cappuccino", 1]], daysAgo: 2 },
    { key: "paid", type: "dineIn", table: "3", customer: "+201001110004", status: "paid", paymentStatus: "paid", paymentMethod: "cash", items: [["Grilled Chicken", 1], ["Cappuccino", 1]], daysAgo: 3, invoice: true },
    { key: "cancelled", type: "dineIn", table: "4", status: "cancelled", items: [["Chicken Wings", 2]], daysAgo: 4 },
  ];

  for (const sample of samples) {
    const order = await OrderService.createOrder(
      {
        restaurant: restaurantId,
        type: sample.type,
        table: sample.table ? tables.get(sample.table) : null,
        customer: sample.customer ? customers.get(sample.customer).id : null,
        status: sample.status,
        paymentStatus: sample.paymentStatus,
        paymentMethod: sample.paymentMethod,
        notes: `${DEMO} ${sample.key}`,
        items: sample.items.map(([name, qty]) => ({ menuItem: menu.get(name), qty })),
      },
      staffId,
    );
    const createdAt = daysFromNow(-sample.daysAgo, 13);
    await prisma.order.update({ where: { id: order.id }, data: { createdAt } });
    if (sample.invoice) {
      const invoice = await InvoiceService.generateFromOrder(order.id, restaurantId, staffId);
      await prisma.invoice.update({ where: { id: invoice.id }, data: { createdAt } });
    }
    console.log(`Order created: ${sample.key}`);
  }
}

export async function seedDemoData() {
  await seedRestaurantSubscriber();

  const restaurant = await prisma.restaurant.findFirst({
    where: { OR: [{ email: "info@goldenfork.com" }, { name: "The Golden Fork" }] },
  });
  if (!restaurant) throw new Error("Restaurant subscriber was not created.");

  const admin = await prisma.staff.findFirst({
    where: { restaurantId: restaurant.id, email: process.env.SUBSCRIBER_EMAIL || "admin@goldenfork.com" },
  });
  if (!admin) throw new Error("Restaurant admin was not created.");

  await ensureCatalog(restaurant.id, admin.id);
  await ensureStaff(restaurant.id);
  const customers = await ensureCustomers(restaurant.id);
  await ensureReservations(restaurant.id, customers);
  await ensureOrders(restaurant.id, admin.id, customers);
  console.log("Demo menu, inventory, and orders are ready.");
}

if (process.argv[1]?.endsWith("demoData.seeder.js")) {
  seedDemoData()
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error("Demo seed failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
