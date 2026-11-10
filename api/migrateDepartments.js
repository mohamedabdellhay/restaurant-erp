console.error(
  "migrateDepartments.js targeted MongoDB and is not used with PostgreSQL. Default departments are created when a restaurant is registered.",
);
process.exit(1);
