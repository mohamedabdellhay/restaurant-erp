## 3. UI & UX Architecture

### 🎯 Core UX Principles (Restaurant & ERP Context)
* **Role-Adaptive Density:**
  * **High-Speed Touch Mode (POS, KDS, Floor Plan):** Large touch targets (minimum `48px × 48px`), high-contrast status colors, zero-scroll primary actions, and single-tap order modifiers to support fast-paced service during peak hours.
  * **High-Density Data Mode (Inventory, PO/RE, P&L, Recipes):** Compact data tables (`36px–40px` row height), sticky headers, keyboard navigation (`Tab` / `Enter` for rapid line-item entry), and inline batch editing.
* **Color-Coded Operational States:** Consistent visual language across the entire system so staff immediately recognize status without reading labels:
  * **Green (`Available` / `Paid` / `In Stock` / `Ready`):** Actionable or complete.
  * **Amber (`Preparing` / `Pending Review` / `Low Stock`):** Requires monitoring or approval.
  * **Red (`Occupied` / `Delayed > 15m` / `Out of Stock` / `Overdue`):** Immediate attention required.
  * **Blue (`Reserved` / `Draft` / `In Transit`):** Scheduled or in-progress state.
* **Non-Destructive Slide-Over Drawers:** Creation and editing workflows (`Add/Edit Food Item`, `Add/Edit SFG`, `Review Requisition Receive`, `Send Return PO`) open in right-aligned drawers (`480px`–`640px` width) rather than full-page redirects, preserving filter and scroll context in the underlying table.
* **Error Prevention & Auditability:** Confirmation modals with variance highlights for destructive or financial actions (`Purchase Return`, `Physical Stock Count` adjustments, `Void Bill`).

---

### 🧭 Information Architecture & Navigation Flow

```text
Global App Shell
├── Left Collapsible Rail (260px expanded / 72px collapsed)
│   ├── Dashboard & Financial Reports (P&L)
│   ├── Front-of-House (POS, Floor Plan, Billing, Waiting Display)
│   ├── Kitchen & Menu (KDS, Food Items & Recipes, SFG, Categories)
│   ├── Inventory & Procurement (Ingredients, Requisitions, PO/PE, Returns, Stock Count)
│   ├── Suppliers (Directory, Due Management)
│   └── Settings (Company Setup, Waiter/Table Setup, Roles & Permissions, Sales Channels)
├── Top Utility Bar (64px)
│   ├── Branch / Outlet Switcher
│   ├── Global Quick Search (Cmd/Ctrl + K — jump to SKU, Order #, or Supplier)
│   ├── Shift Status & Live KDS/Stock Alerts
│   └── User Profile & Quick POS Launch Button
└── Main Workspace Canvas
```

---

### 🖥️ Key Module UX Workflows

#### 1. Point of Sale (POS) & Floor Plan

* **Layout:** 2-column split screen (`65%` Menu/Floor Grid | `35%` Active Order Cart).
* **UX Flow:** Select Table from Floor Plan → Filter Food Category → Tap Food Items (auto-triggers modifier modal if required) → Apply Discount/Channel (`Dine-in`, `Takeaway`, `Delivery`) → Send to KDS or Split Bill & Settle.

#### 2. Kitchen Display System (KDS)

* **Layout:** Full-bleed dark-mode grid (`4–5` ticket columns) with auto-aging header timers.
* **UX Flow:** Orders appear automatically upon POS firing → Station cooks bump individual items or whole tickets → Color shifts from Neutral → Amber (`10m`) → Red (`15m+`) → Bumping updates the **Customer Waiting Display** in real time.

#### 3. Recipe & Semi-Finished Goods (SFG) Engineering

* **Layout:** Master list with real-time food cost percentage badges + slide-over recipe builder.
* **UX Flow:** Select raw ingredients or prepped SFGs → Enter net yield & waste percentage → System auto-calculates unit cost and suggested menu price margin.

#### 4. Procurement Lifecycle (`RE → PO → PE → Return`)

* **Layout:** Tabbed pipeline view showing document progression (`Requisition` → `Purchase Order` → `Purchase Entry` → `Purchase Return`).
* **UX Flow:** Kitchen submits Requisition (`RE`) → Manager reviews & converts to `PO` → Receiving clerk verifies quantities against `PO` to generate `Purchase Entry (PE)` → Discrepancies trigger a one-click `Send Return PO/RE` pre-filled with rejected items.

---

### 🎨 UI Component & Design System Tokens

#### Typography Scale (`Inter` / `Plus Jakarta Sans`)

| Token | Size / Line-Height | Weight | Usage |
| --- | --- | --- | --- |
| `--text-display` | `28px / 36px` | `700` | POS totals, KPI big numbers |
| `--text-h1` | `22px / 28px` | `600` | Page & module headers |
| `--text-h2` | `16px / 24px` | `600` | Card titles, drawer headers |
| `--text-body` | `14px / 20px` | `400` | Data tables, form inputs, general UI |
| `--text-caption` | `12px / 16px` | `500` | Badges, timestamps, table column headers |
| `--font-mono` | `13px / 20px` | `500` | SKUs, invoice numbers, currency (`tabular-nums`) |

#### Spacing, Elevation & Radii

* **Base Grid:** `4px` (`4`, `8`, `12`, `16`, `24`, `32px`).
* **Cards & Panels:** `1px solid var(--border-default)`, `border-radius: 10px`, subtle elevation `0 1px 3px rgba(15, 23, 42, 0.05)`.
* **Drawers & Modals:** `border-radius: 12px` (modals), backdrop blur `rgba(15, 23, 42, 0.4)`, elevation `0 20px 25px -5px rgba(15, 23, 42, 0.1)`.
* **Interactive States:** Clear `2px` focus rings (`--color-primary-500`) for keyboard accessibility across rapid data-entry forms.
