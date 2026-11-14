import React, { useState, useEffect } from "react";
import PageHeader from "@components/PageHeader";
import Alert from "@components/Alert";
import PinPad from "@components/PinPad";
import "./Orders.css";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Users,
  Package,
  DollarSign,
  ChefHat,
  CheckCircle,
  XCircle,
  CreditCard,
  UserPlus,
  ShieldCheck,
  Wallet,
  Banknote,
  Globe,
  Truck,
  LogIn,
  Utensils,
  ShoppingBag,
  Bike,
  LayoutGrid,
  User,
  X,
  ArrowLeft,
  Megaphone,
  Split,
  History,
  ClipboardList,
  Monitor,
  Printer,
  FileText,
  Minus,
} from "lucide-react";
import paymentService from "@services/paymentService";
import orderService from "@services/orderService";
import invoiceService from "@services/invoiceService";
import tableService from "@services/tableService";
import staffService from "@services/staffService";
import customerService from "@services/customerService";
import menuService from "@services/menuService";
import categoryService from "@services/categoryService";
import CustomerModal from "@components/CustomerModal";
import {
  ProtectedElement,
  ProtectedButton,
} from "@components/ProtectedElement";
import { PERMISSIONS } from "@utils/permissionUtils";
import { useRestaurant } from "@hooks/useRestaurant";
import { formatMoney } from "../../utils/money";

const formatOpeningStamp = (date) => {
  const hours = date.getHours();
  const hour12 = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(hour12).padStart(2, "0")}:${minutes}${hours >= 12 ? "PM" : "AM"} ${String(date.getDate()).padStart(2, "0")}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

const Orders = () => {
  const { t, i18n } = useTranslation();
  const { getCurrency, getTaxPercent, getServiceCharge } = useRestaurant();
  const currency = getCurrency();
  const [orders, setOrders] = useState([]);
  const [pinUnlocked, setPinUnlocked] = useState(
    () => sessionStorage.getItem("posPinUnlocked") === "1",
  );
  const [showOpeningCash, setShowOpeningCash] = useState(
    () => !sessionStorage.getItem("posOpeningCash") && !sessionStorage.getItem("posOpeningCashClosed"),
  );
  const [openingAmount, setOpeningAmount] = useState("0.00");
  const [openingStamp] = useState(() => formatOpeningStamp(new Date()));
  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [channel, setChannel] = useState("dineIn");
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedWaiter, setSelectedWaiter] = useState("");
  const [categories, setCategories] = useState([]);
  const [showPos, setShowPos] = useState(false);
  const [draftOrder, setDraftOrder] = useState(null);
  const [posCategoryId, setPosCategoryId] = useState("");
  const [posSearch, setPosSearch] = useState("");
  const [posItemChip, setPosItemChip] = useState("");
  const [posPanel, setPosPanel] = useState("");
  const [covers, setCovers] = useState("1");
  const [splitWays, setSplitWays] = useState("2");
  const [discountMode, setDiscountMode] = useState("group");
  const [discountAmount, setDiscountAmount] = useState("");
  const [noteIndex, setNoteIndex] = useState(null);
  const [moreItemId, setMoreItemId] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    type: "dineIn",
    table: "",
    customer: "",
    deliveryAddress: "",
    items: [],
    notes: "",
  });

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Payment modal state
  const [paymentData, setPaymentData] = useState({
    orderId: "",
    method: "cash",
    status: "paid",
  });
  const [gateways, setGateways] = useState([]);
  const [loadingGateways, setLoadingGateways] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchTables();
    fetchWaiters();
    fetchMenuItems();
    fetchCategories();
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setLoadingGateways(true);
      const response = await paymentService.getSupportedGateways();
      setGateways(response.data || []);
    } catch (error) {
      console.error("Failed to fetch gateways:", error);
    } finally {
      setLoadingGateways(false);
    }
  };

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, message.type === "error" ? 8000 : 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchOrders = async () => {
    try {
      const result = await orderService.getAll();
      console.log("API Result:", result);
      console.log("Orders array:", result?.data);
      setOrders(result?.data || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch orders",
      });
    }
  };

  const fetchWaiters = async () => {
    try {
      const response = await staffService.getAll();
      const people = response.data || response || [];
      setWaiters(
        people.filter((person) => {
          const roleName =
            person.role && typeof person.role === "object"
              ? person.role.name
              : person.role;
          return String(roleName || "").toLowerCase() === "waiter" && person.isActive !== false;
        }),
      );
    } catch (error) {
      console.error("Failed to fetch waiters:", error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await tableService.getAll();
      setTables(response.data || response);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await menuService.getAll();
      setMenuItems(response.data || response || []);
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      const rows = (response.data || response || []).filter(
        (category) => category.isActive !== false,
      );
      setCategories(rows);
      setPosCategoryId((current) => current || rows[0]?._id || "");
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Search customers by phone or name
  const searchCustomers = async (query) => {
    if (!query || query.length < 3) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    try {
      setSearchingCustomers(true);
      const response = await customerService.search(query);
      setCustomerSearchResults(response.data || response);
      setShowCustomerDropdown(true);
    } catch (error) {
      console.error("Error searching customers:", error);
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
    } finally {
      setSearchingCustomers(false);
    }
  };

  // Handle customer search input
  const handleCustomerSearch = (value) => {
    setCustomerSearch(value);
    searchCustomers(value);
  };

  // Select customer from search results
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.phone);
    setFormData({
      ...formData,
      customer: customer._id,
      deliveryAddress: formData.deliveryAddress || customer.address || "",
    });
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  // Clear customer selection
  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setFormData({ ...formData, customer: "" });
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  // Create new customer
  const createNewCustomer = () => {
    setShowCustomerModal(true);
  };

  // Handle customer creation success
  const handleCustomerCreated = (newCustomer) => {
    setSelectedCustomer(newCustomer);
    setCustomerSearch(newCustomer.phone);
    setFormData({
      ...formData,
      customer: newCustomer._id,
      deliveryAddress: formData.deliveryAddress || newCustomer.address || "",
    });
    setShowCustomerModal(false);
    setMessage({
      type: "success",
      text: "Customer created and selected successfully!",
    });
  };

  // Order items management
  const addOrderItem = (menuItem, modifiers = []) => {
    if (menuItem.isActive === false || menuItem.isAvailable === false) return;
    setFormData((current) => {
      const modifierKey = modifiers.map((modifier) => modifier.name).join("|");
      const existing = current.items.findIndex((item) => {
        const itemKey = (item.modifiers || []).map((modifier) => modifier.name).join("|");
        return item.menuItem === menuItem._id && itemKey === modifierKey && !item.notes;
      });
      if (existing >= 0) {
        return {
          ...current,
          items: current.items.map((item, index) =>
            index === existing ? { ...item, quantity: (item.quantity || 1) + 1 } : item,
          ),
        };
      }
      return {
        ...current,
        items: [
          ...current.items,
          {
            menuItem: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
            modifiers,
            notes: "",
          },
        ],
      };
    });
  };

  const removeOrderItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateOrderItem = (index, field, value) => {
    const newItems = formData.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    setFormData({ ...formData, items: newItems });
  };

  const recordId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value._id || value.id || "";
  };

  const calculateOrderTotal = () => {
    return formData.items.reduce((total, item) => {
      const qty = item.quantity || item.qty || 1;
      const modifiersTotal =
        item.modifiers?.reduce(
          (modTotal, mod) => modTotal + (mod.price || 0),
          0,
        ) || 0;
      return total + (item.price + modifiersTotal) * qty;
    }, 0);
  };

  const billFigures = () => {
    const subtotal = calculateOrderTotal();
    const requested = discountMode === "custom" ? Number(discountAmount) || 0 : 0;
    const discountValue = Math.min(Math.max(requested, 0), subtotal);
    const taxable = subtotal - discountValue;
    const vatAmount = (taxable * getTaxPercent()) / 100;
    const serviceAmount = (taxable * getServiceCharge()) / 100;
    return {
      subtotal,
      discountValue,
      vatAmount,
      serviceAmount,
      sdAmount: 0,
      total: taxable + vatAmount + serviceAmount,
    };
  };

  const buildOrderPayload = (status) => {
    const { discountValue } = billFigures();
    const discountNote =
      discountValue > 0 ? `Discount: ${discountValue.toFixed(2)} ${currency}` : "";
    const payload = {
      type: formData.type,
      table: formData.type === "dineIn" ? recordId(formData.table) : null,
      customer: recordId(formData.customer) || null,
      deliveryAddress:
        formData.type === "delivery" ? formData.deliveryAddress.trim() : "",
      notes: [formData.notes.trim(), discountNote].filter(Boolean).join("\n"),
      items: formData.items.map((item) => ({
        menuItem: recordId(item.menuItem),
        qty: Number(item.quantity || item.qty) || 1,
        notes: item.notes || "",
        modifiers: item.modifiers || [],
      })),
    };
    if (status) payload.status = status;

    if (!payload.items.length) {
      setMessage({ type: "error", text: t("nav.orders_no_items") });
      return null;
    }
    if (payload.type === "dineIn" && !payload.table) {
      setMessage({ type: "error", text: t("nav.orders_select_table") });
      return null;
    }
    if (payload.type === "delivery" && !payload.customer) {
      setMessage({ type: "error", text: t("nav.orders_delivery_needs_customer") });
      return null;
    }
    if (payload.type === "delivery" && !payload.deliveryAddress) {
      setMessage({ type: "error", text: t("nav.orders_delivery_needs_address") });
      return null;
    }
    return payload;
  };

  const saveOrder = async (status) => {
    const payload = buildOrderPayload(status);
    if (!payload) return null;
    const editingId = draftOrder?._id || selectedOrder?._id;
    try {
      const result = editingId
        ? await orderService.update(editingId, payload)
        : await orderService.create(payload);
      const saved = result?.data || result;
      if (showPos) setDraftOrder(saved);
      setMessage({
        type: "success",
        text:
          status === "in_kitchen"
            ? t("nav.orders_sent_kitchen")
            : editingId
              ? "Order updated successfully!"
              : "Order created successfully!",
      });
      fetchOrders();
      return saved;
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Operation failed",
      });
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const saved = await saveOrder();
    if (!saved) return;
    setShowAddModal(false);
    setShowEditModal(false);
    setShowPos(false);
    setDraftOrder(null);
    resetForm();
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setFormData({
      type: order.type || "dineIn",
      table: recordId(order.table),
      customer: recordId(order.customer),
      deliveryAddress: order.deliveryAddress || order.customer?.address || "",
      items: (order.items || []).map((item) => ({
        menuItem: recordId(item.menuItem),
        name: item.menuItem?.name || item.name || "",
        price: item.price,
        quantity: item.qty || item.quantity || 1,
        modifiers: item.modifiers || [],
        notes: item.notes || "",
      })),
      notes: order.notes || "",
    });

    if (order.customer && typeof order.customer === "object") {
      setCustomerSearch(order.customer.phone || order.customer.name || "");
      setSelectedCustomer(order.customer);
    }

    setShowEditModal(true);
  };

  const handleDelete = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await orderService.delete(orderId);
        setMessage({ type: "success", text: "Order deleted successfully!" });
        fetchOrders();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Delete failed",
        });
      }
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, { status: newStatus });
      setMessage({
        type: "success",
        text: "Order status updated successfully!",
      });
      fetchOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Status update failed",
      });
    }
  };

  const handleGenerateInvoice = async (order) => {
    try {
      await invoiceService.create({ orderId: order._id });
      setMessage({ type: "success", text: "Invoice generated successfully!" });
      fetchOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Invoice generation failed",
      });
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      // If payment method is online, get a payment link
      if (paymentData.method === "online") {
        const response = await orderService.getPaymentLink(paymentData.orderId);
        if (response && response.data && response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl;
          return;
        } else if (response && response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
          return;
        }
      }

      await orderService.update(paymentData.orderId, {
        paymentStatus: paymentData.status,
        paymentMethod: paymentData.method,
      });

      setMessage({ type: "success", text: "Payment processed successfully!" });
      setShowPaymentModal(false);
      setPaymentData({ orderId: "", method: "cash", status: "paid" });
      fetchOrders();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Payment failed",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: "dineIn",
      table: "",
      customer: "",
      deliveryAddress: "",
      items: [],
      notes: "",
    });
    setSelectedOrder(null);
    setCustomerSearch("");
    setSelectedCustomer(null);
    setCustomerSearchResults([]);
    setShowCustomerDropdown(false);
  };

  const filteredOrders = orders.filter((order) => {
    const customerName =
      order.customer?.name ||
      (typeof order.customer === "string" ? order.customer : "");
    const matchesSearch =
      (customerName &&
        customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.notes &&
        order.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "in_kitchen":
        return "text-blue-600 bg-blue-50";
      case "served":
      case "delivered":
        return "text-green-600 bg-green-50";
      case "out_for_delivery":
        return "text-teal-700 bg-teal-50";
      case "paid":
        return "text-purple-600 bg-purple-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "in_kitchen":
        return <ChefHat size={16} />;
      case "served":
      case "delivered":
        return <CheckCircle size={16} />;
      case "out_for_delivery":
        return <Truck size={16} />;
      case "paid":
        return <DollarSign size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const orderTypeLabel = (type) => {
    if (type === "dineIn") return t("nav.orders_dine_in");
    if (type === "takeaway") return t("nav.orders_takeaway");
    if (type === "delivery") return t("nav.orders_delivery");
    return type || "-";
  };

  const getOrderTypeColor = (type) => {
    switch (type) {
      case "dineIn":
        return "text-blue-600 bg-blue-50";
      case "takeaway":
        return "text-orange-600 bg-orange-50";
      case "delivery":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTableName = (table) => {
    if (!table) return "-";
    if (typeof table === "object" && table.number) {
      return table.number;
    }
    return "Unassigned";
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => {
      const itemPrice = item.menuItem?.price || item.price || 0;
      const qty = item.qty || item.quantity || 1;
      const modifiersTotal = item.modifiers
        ? item.modifiers.reduce((sum, mod) => sum + (mod.price || 0), 0)
        : 0;
      return total + (itemPrice + modifiersTotal) * qty;
    }, 0);
  };

  const tableLabel = (table) => {
    const number = String(table.number ?? "");
    return /^\d+$/.test(number) ? `T${number}` : number;
  };

  const closeOpeningCash = () => {
    sessionStorage.setItem("posOpeningCashClosed", "1");
    setShowOpeningCash(false);
  };

  const startBusiness = () => {
    const amount = Number(openingAmount);
    sessionStorage.setItem(
      "posOpeningCash",
      JSON.stringify({
        amount: Number.isFinite(amount) ? amount : 0,
        currency,
        startedAt: new Date().toISOString(),
      }),
    );
    setShowOpeningCash(false);
  };

  const channels = [
    { id: "dineIn", label: t("nav.orders_dine_in"), icon: Utensils },
    { id: "takeaway", label: t("nav.orders_parcel"), icon: ShoppingBag },
    { id: "delivery", label: t("nav.orders_delivery"), icon: Bike },
  ];

  const categoryIdOf = (item) => {
    if (item.category && typeof item.category === "object") {
      return item.category._id || item.category.id || "";
    }
    return item.category || "";
  };

  const itemsForCategory = (categoryId) =>
    menuItems.filter((item) => categoryIdOf(item) === categoryId);

  const openPos = () => {
    const table = tables.find((item) => item._id === selectedTable);
    resetForm();
    setDraftOrder(null);
    setDiscountMode("group");
    setDiscountAmount("");
    setPosSearch("");
    setPosItemChip("");
    setPosPanel("");
    setNoteIndex(null);
    setMoreItemId("");
    setCovers(String(table?.seats || 1));
    setSplitWays(String(Math.max(table?.seats || 2, 1)));
    setFormData({
      type: channel,
      table: channel === "dineIn" ? selectedTable : "",
      customer: "",
      deliveryAddress: "",
      items: [],
      notes: "",
    });
    setShowPos(true);
  };

  const startNewTicket = () => {
    setDraftOrder(null);
    setDiscountMode("group");
    setDiscountAmount("");
    setNoteIndex(null);
    setMoreItemId("");
    setPosItemChip("");
    setFormData((current) => ({ ...current, items: [], notes: "" }));
  };

  const cancelPosOrder = async () => {
    if (draftOrder?._id) {
      if (!window.confirm(t("nav.orders_cancel_order"))) return;
      try {
        await orderService.updateStatus(draftOrder._id, { status: "cancelled" });
        setMessage({ type: "success", text: t("nav.orders_cancel_order") });
        fetchOrders();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Status update failed",
        });
        return;
      }
    }
    setDraftOrder(null);
    setDiscountMode("group");
    setDiscountAmount("");
    setNoteIndex(null);
    setFormData((current) => ({ ...current, items: [], notes: "" }));
  };

  const loadOrder = (order) => {
    setDraftOrder(order);
    setSelectedOrder(null);
    setFormData({
      type: order.type || "dineIn",
      table: recordId(order.table),
      customer: recordId(order.customer),
      deliveryAddress: order.deliveryAddress || order.customer?.address || "",
      items: (order.items || []).map((item) => ({
        menuItem: recordId(item.menuItem),
        name: item.menuItem?.name || item.name || "",
        price: item.price,
        quantity: item.qty || item.quantity || 1,
        modifiers: item.modifiers || [],
        notes: item.notes || "",
      })),
      notes: String(order.notes || "").replace(/\n?Discount:.*$/, ""),
    });
    if (order.customer && typeof order.customer === "object") {
      setSelectedCustomer(order.customer);
      setCustomerSearch(order.customer.phone || order.customer.name || "");
    } else {
      setSelectedCustomer(null);
      setCustomerSearch("");
    }
    setChannel(order.type || "dineIn");
    setPosPanel("");
    const firstId = recordId(order.items?.[0]?.menuItem);
    const match = menuItems.find((item) => item._id === firstId);
    const categoryId = match ? categoryIdOf(match) : "";
    if (categoryId) {
      setPosCategoryId(categoryId);
      setPosItemChip("");
      setPosSearch("");
    }
    setShowPos(true);
  };

  const restoreOrder = async (order) => {
    if (order.status !== "cancelled") {
      loadOrder(order);
      return;
    }
    try {
      const result = await orderService.updateStatus(order._id, { status: "pending" });
      const saved = result?.data || { ...order, status: "pending" };
      setMessage({ type: "success", text: t("nav.orders_restored") });
      fetchOrders();
      loadOrder(saved.items ? saved : { ...order, ...saved, status: "pending" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Status update failed",
      });
    }
  };

  const changeQty = (index, delta) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
          : item,
      ),
    }));
  };

  const togglePanel = (name) => setPosPanel((current) => (current === name ? "" : name));

  const activeOrders = orders.filter(
    (order) => order.status !== "paid" && order.status !== "cancelled",
  );
  const selectedTableRecord = tables.find((table) => table._id === formData.table);
  const selectedWaiterRecord = waiters.find((waiter) => waiter._id === selectedWaiter);
  const selectedCategory = categories.find((category) => category._id === posCategoryId);
  const categoryItems = itemsForCategory(posCategoryId);
  const itemChips = [...new Set(categoryItems.map((item) => item.name).filter(Boolean))];
  const visibleMenu = categoryItems.filter((item) => {
    const query = posSearch.trim().toLowerCase();
    const matchesSearch = !query || String(item.name || "").toLowerCase().includes(query);
    const matchesChip = !posItemChip || item.name === posItemChip;
    return matchesSearch && matchesChip;
  });
  const figures = billFigures();
  const shareCount = Math.max(1, Number(splitWays) || 1);
  const channelMeta = channels.find((item) => item.id === formData.type) || channels[0];
  const ChannelIcon = channelMeta.icon;
  const ticketNumber = draftOrder
    ? draftOrder.orderNumber
      ? `#${draftOrder.orderNumber}`
      : `#${String(draftOrder._id || "").slice(0, 8)}`
    : t("nav.orders_new_ticket");

  if (!pinUnlocked) {
    return (
      <PinPad
        onComplete={() => {
          sessionStorage.setItem("posPinUnlocked", "1");
          setPinUnlocked(true);
        }}
      />
    );
  }

  const orderLabel = (order) =>
    order.orderNumber
      ? `#${order.orderNumber}`
      : `#${String(order._id || "").slice(0, 8)}`;

  return (
    <div data-direction={i18n.dir()}>
      <Alert type={message.type} message={message.text} />
      {showPos ? (
        <section className="pos-screen">
          <div className="pos-toolbar">
            <button
              type="button"
              className="pos-back"
              onClick={() => {
                setShowPos(false);
                setPosPanel("");
              }}
              aria-label={t("nav.orders_back")}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="pos-chips">
              <button type="button" className="pos-chip" onClick={() => togglePanel("channel")}>
                <ChannelIcon size={15} />
                {channelMeta.label}
              </button>
              {formData.type === "dineIn" && (
                <button type="button" className="pos-chip" onClick={() => togglePanel("table")}>
                  <LayoutGrid size={15} />
                  {selectedTableRecord ? tableLabel(selectedTableRecord) : t("nav.orders_select_table")}
                </button>
              )}
              <button type="button" className="pos-chip" onClick={() => togglePanel("waiter")}>
                <User size={15} />
                {selectedWaiterRecord?.name || t("nav.orders_waiter")}
              </button>
              <button type="button" className="pos-chip pos-chip-customer" onClick={() => togglePanel("customer")}>
                <User size={15} />
                {selectedCustomer
                  ? `${selectedCustomer.name} (${selectedCustomer.phone || ""})`
                  : t("nav.orders_select_customer")}
              </button>
              <label className="pos-chip pos-covers">
                <Users size={15} />
                <input
                  inputMode="numeric"
                  aria-label={t("nav.orders_covers")}
                  value={covers}
                  onChange={(event) => setCovers(event.target.value.replace(/\D/g, "").slice(0, 2))}
                />
              </label>
            </div>
            <div className="pos-actions">
              <button type="button" className="pos-action promo" onClick={() => togglePanel("promotion")}>
                <Megaphone size={15} />
                {t("nav.orders_promotion")}
                <span>0</span>
              </button>
              <button type="button" className="pos-action split" onClick={() => togglePanel("split")}>
                <Split size={15} />
                {t("nav.orders_split_bill")}
              </button>
              <button type="button" className="pos-action history" onClick={() => togglePanel("history")}>
                <History size={15} />
                {t("nav.orders_order_history")}
                <span>{orders.length}</span>
              </button>
              <button type="button" className="pos-action active-order" onClick={() => togglePanel("active")}>
                <ClipboardList size={15} />
                {t("nav.orders_active_order")}
                <span>{activeOrders.length}</span>
              </button>
              <button type="button" className="pos-action new-order" onClick={startNewTicket}>
                <Plus size={15} />
                {t("nav.orders_new_order")}
              </button>
            </div>
          </div>

          {posPanel && (
            <div className="pos-panel">
              {posPanel === "channel" &&
                channels.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={formData.type === item.id ? "active" : ""}
                      onClick={() => {
                        setChannel(item.id);
                        setFormData((current) => ({
                          ...current,
                          type: item.id,
                          table: item.id === "dineIn" ? current.table : "",
                        }));
                        setPosPanel("");
                      }}
                    >
                      <Icon size={15} />
                      {item.label}
                    </button>
                  );
                })}
              {posPanel === "table" &&
                (tables.length === 0 ? (
                  <p>{t("nav.orders_no_tables")}</p>
                ) : (
                  tables.map((table) => (
                    <button
                      key={table._id}
                      type="button"
                      className={formData.table === table._id ? "active" : ""}
                      onClick={() => {
                        setSelectedTable(table._id);
                        setFormData((current) => ({ ...current, table: table._id }));
                        setCovers(String(table.seats || 1));
                        setPosPanel("");
                      }}
                    >
                      {tableLabel(table)}
                    </button>
                  ))
                ))}
              {posPanel === "waiter" &&
                (waiters.length === 0 ? (
                  <p>{t("nav.orders_no_waiters")}</p>
                ) : (
                  waiters.map((waiter) => (
                    <button
                      key={waiter._id}
                      type="button"
                      className={selectedWaiter === waiter._id ? "active" : ""}
                      onClick={() => {
                        setSelectedWaiter(waiter._id);
                        setPosPanel("");
                      }}
                    >
                      {waiter.name}
                    </button>
                  ))
                ))}
              {posPanel === "customer" && (
                <div className="pos-customer-search">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(event) => handleCustomerSearch(event.target.value)}
                    placeholder={t("nav.orders_customer_placeholder")}
                  />
                  {showCustomerDropdown &&
                    customerSearchResults.map((customer) => (
                      <button key={customer._id} type="button" onClick={() => selectCustomer(customer)}>
                        {customer.name} · {customer.phone}
                      </button>
                    ))}
                  {selectedCustomer && (
                    <button type="button" onClick={clearCustomerSelection}>
                      {t("common.close")}
                    </button>
                  )}
                </div>
              )}
              {posPanel === "promotion" && <p>{t("nav.orders_no_promotions")}</p>}
              {posPanel === "split" && (
                <div className="pos-split">
                  <label>
                    {t("nav.orders_ways")}
                    <input
                      inputMode="numeric"
                      value={splitWays}
                      onChange={(event) => setSplitWays(event.target.value.replace(/\D/g, "").slice(0, 2))}
                    />
                  </label>
                  <strong>
                    {t("nav.orders_split_each")}: {formatMoney(figures.total / shareCount, currency)}
                  </strong>
                </div>
              )}
              {posPanel === "history" &&
                (orders.length === 0 ? (
                  <p>{t("nav.orders_none")}</p>
                ) : (
                  [...orders]
                    .sort((a, b) => Number(b.status === "cancelled") - Number(a.status === "cancelled"))
                    .slice(0, 8)
                    .map((order) => (
                    <button
                      key={order._id}
                      type="button"
                      onClick={() =>
                        order.status === "cancelled" ? restoreOrder(order) : loadOrder(order)
                      }
                    >
                      {orderLabel(order)} ·{" "}
                      {order.status === "cancelled"
                        ? t("nav.orders_restore")
                        : order.customer?.name || t("nav.orders_guest_customer")}{" "}
                      · {formatMoney(order.total || calculateTotal(order.items || []), currency)}
                    </button>
                  ))
                ))}
              {posPanel === "active" &&
                (activeOrders.length === 0 ? (
                  <p>{t("nav.orders_none")}</p>
                ) : (
                  activeOrders.slice(0, 8).map((order) => (
                    <button key={order._id} type="button" onClick={() => loadOrder(order)}>
                      {orderLabel(order)} · {orderTypeLabel(order.type)} ·{" "}
                      {formatMoney(order.total || calculateTotal(order.items || []), currency)}
                    </button>
                  ))
                ))}
            </div>
          )}

          <div className="pos-layout">
            <aside className="pos-categories">
              <h2>
                {t("nav.orders_food_categories")} ({String(categories.length).padStart(2, "0")})
              </h2>
              {categories.map((category) => {
                const count = itemsForCategory(category._id).length;
                return (
                  <button
                    key={category._id}
                    type="button"
                    className={posCategoryId === category._id ? "active" : ""}
                    onClick={() => {
                      setPosCategoryId(category._id);
                      setPosItemChip("");
                      setMoreItemId("");
                    }}
                  >
                    <span className="pos-cat-thumb">
                      {category.image ? <img src={category.image} alt="" /> : <Utensils size={16} />}
                    </span>
                    <span>
                      <strong>{category.name}</strong>
                      <small>{t("nav.orders_item_count", { count })}</small>
                    </span>
                  </button>
                );
              })}
            </aside>

            <div className="pos-menu">
              <div className="pos-menu-head">
                <h2>
                  {selectedCategory?.name || t("nav.menu")} (
                  {String(itemsForCategory(posCategoryId).length).padStart(2, "0")})
                </h2>
                <label className="pos-search">
                  <Search size={15} />
                  <input
                    type="search"
                    value={posSearch}
                    onChange={(event) => setPosSearch(event.target.value)}
                    placeholder={t("nav.orders_quick_search")}
                  />
                </label>
              </div>
              {itemChips.length > 0 && (
                <div className="pos-item-chips">
                  {itemChips.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={posItemChip === name ? "active" : ""}
                      onClick={() => setPosItemChip((current) => (current === name ? "" : name))}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
              {visibleMenu.length === 0 ? (
                <p className="pos-empty">{t("nav.orders_no_menu_items")}</p>
              ) : (
                <div className="pos-item-grid">
                  {visibleMenu.map((item) => {
                    const modifiers = Array.isArray(item.modifiers) ? item.modifiers : [];
                    const unavailable = item.isActive === false || item.isAvailable === false;
                    const inTicket = formData.items.some((line) => line.menuItem === item._id);
                    return (
                      <article
                        key={item._id}
                        className={`pos-product ${inTicket ? "in-ticket" : ""} ${unavailable ? "unavailable" : ""}`}
                      >
                        <button
                          type="button"
                          disabled={unavailable}
                          onClick={() => addOrderItem(item)}
                        >
                          <span className="pos-product-photo">
                            {item.image ? <img src={item.image} alt="" /> : <Utensils size={20} />}
                          </span>
                          <span className="pos-product-copy">
                            <strong>{item.name}</strong>
                            <em>{formatMoney(item.price, currency)}</em>
                          </span>
                        </button>
                        {modifiers.length > 0 && (
                          <button
                            type="button"
                            className="pos-more"
                            onClick={() => setMoreItemId((current) => (current === item._id ? "" : item._id))}
                          >
                            {t("nav.orders_more")}
                          </button>
                        )}
                        {moreItemId === item._id && (
                          <div className="pos-modifiers">
                            {modifiers.map((modifier, index) => (
                              <button
                                key={`${modifier.name}-${index}`}
                                type="button"
                                onClick={() => {
                                  addOrderItem(item, [modifier]);
                                  setMoreItemId("");
                                }}
                              >
                                {modifier.name || t("nav.orders_add_ons")}
                                {modifier.price ? ` · ${formatMoney(modifier.price, currency)}` : ""}
                              </button>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="pos-ticket">
              <div className="pos-ticket-head">
                <strong>{ticketNumber}</strong>
                <button type="button" className="pos-kot" onClick={() => saveOrder("in_kitchen")}>
                  <Monitor size={15} />
                  {t("nav.orders_kot")}
                </button>
                <button
                  type="button"
                  className="pos-bill"
                  onClick={async () => {
                    const saved = await saveOrder();
                    if (saved) handleGenerateInvoice(saved);
                  }}
                >
                  <Printer size={15} />
                  {t("nav.orders_customer_bill")}
                </button>
                <button
                  type="button"
                  className="pos-settle"
                  onClick={async () => {
                    const saved = await saveOrder();
                    if (!saved) return;
                    setPaymentData({ orderId: saved._id, method: "cash", status: "paid" });
                    setShowPaymentModal(true);
                  }}
                >
                  <FileText size={15} />
                  {t("nav.orders_settle_bill")}
                </button>
              </div>
              {formData.type === "delivery" && (
                <label className="pos-address">
                  {t("nav.orders_delivery_address")}
                  <textarea
                    rows={2}
                    value={formData.deliveryAddress}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, deliveryAddress: event.target.value }))
                    }
                    placeholder={t("nav.orders_delivery_address_placeholder")}
                  />
                </label>
              )}
              <div className="pos-ticket-columns">
                <span>{t("nav.orders_food")}</span>
                <span>{t("nav.orders_quantity")}</span>
                <span>{t("nav.orders_price")}</span>
                <span>{t("nav.orders_subtotal")}</span>
              </div>
              <div className="pos-lines">
                {formData.items.length === 0 && <p className="pos-empty">{t("nav.orders_no_items")}</p>}
                {formData.items.map((item, index) => {
                  const modifiers = item.modifiers || [];
                  const extra = modifiers.reduce((sum, modifier) => sum + (Number(modifier.price) || 0), 0);
                  const lineTotal = (Number(item.price) + extra) * (item.quantity || 1);
                  return (
                    <div key={`${item.menuItem}-${index}`} className="pos-line">
                      <div>
                        <strong>{item.name}</strong>
                        {modifiers.length > 0 && (
                          <em className="pos-addons">{t("nav.orders_add_ons")}</em>
                        )}
                        <button type="button" className="pos-note" onClick={() => setNoteIndex(index)}>
                          + {t("nav.orders_add_note")}
                        </button>
                        {noteIndex === index && (
                          <input
                            value={item.notes || ""}
                            onChange={(event) => updateOrderItem(index, "notes", event.target.value)}
                            placeholder={t("nav.orders_item_notes")}
                          />
                        )}
                      </div>
                      <div className="pos-qty">
                        <button type="button" onClick={() => changeQty(index, -1)} aria-label="-">
                          <Minus size={12} />
                        </button>
                        <span>{item.quantity || 1}</span>
                        <button type="button" onClick={() => changeQty(index, 1)} aria-label="+">
                          <Plus size={12} />
                        </button>
                      </div>
                      <span>{formatMoney(Number(item.price) + extra, currency)}</span>
                      <span>{formatMoney(lineTotal, currency)}</span>
                      <button
                        type="button"
                        className="pos-remove"
                        onClick={() => removeOrderItem(index)}
                        aria-label={t("nav.orders_delete_order")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="pos-summary">
                <div className="pos-discount">
                  <span>{t("nav.orders_discount")}</span>
                  <div>
                    <button
                      type="button"
                      className={discountMode === "group" ? "active" : ""}
                      onClick={() => setDiscountMode("group")}
                    >
                      {t("nav.orders_group")}
                    </button>
                    <button
                      type="button"
                      className={discountMode === "custom" ? "active" : ""}
                      onClick={() => setDiscountMode("custom")}
                    >
                      {t("nav.orders_custom")}
                    </button>
                  </div>
                  {discountMode === "custom" && (
                    <input
                      inputMode="decimal"
                      value={discountAmount}
                      onChange={(event) => setDiscountAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                      aria-label={t("nav.orders_discount")}
                    />
                  )}
                  <span>-{formatMoney(figures.discountValue, currency)}</span>
                </div>
                <p>
                  <span>{t("nav.orders_vat")}</span>
                  <span>{formatMoney(figures.vatAmount, currency)}</span>
                </p>
                <p>
                  <span>{t("nav.orders_sd")}</span>
                  <span>{formatMoney(figures.sdAmount, currency)}</span>
                </p>
                <p>
                  <span>{t("nav.orders_service_charge")}</span>
                  <span>{formatMoney(figures.serviceAmount, currency)}</span>
                </p>
              </div>
              <button type="button" className="pos-cancel" onClick={cancelPosOrder}>
                <X size={14} />
                {t("nav.orders_cancel_order")}
              </button>
              <div className="pos-total">
                <span>{t("nav.orders_total_bill")}</span>
                <strong>{formatMoney(figures.total, currency)}</strong>
              </div>
            </aside>
          </div>
        </section>
      ) : (
      <>
      <section className="floor-selection">
        <div className="floor-selection-tab">
          <LogIn size={16} />
          <span>{t("nav.orders_selection")}</span>
        </div>
        <div className="floor-selection-grid">
          <div className="floor-card">
            <h2>{t("nav.orders_sales_channel")}</h2>
            {channels.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`channel-btn ${channel === item.id ? "active" : ""}`}
                  onClick={() => setChannel(item.id)}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="floor-card">
            <h2>
              <LayoutGrid size={16} />
              {t("nav.orders_table")}
            </h2>
            {tables.length === 0 ? (
              <p className="floor-empty">{t("nav.orders_no_tables")}</p>
            ) : (
              <div className="table-grid">
                {tables.map((table) => (
                  <button
                    key={table._id}
                    type="button"
                    className={`table-tile ${selectedTable === table._id ? "active" : ""}`}
                    onClick={() =>
                      setSelectedTable((current) => (current === table._id ? "" : table._id))
                    }
                  >
                    {tableLabel(table)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="floor-card">
            <h2>
              <User size={16} />
              {t("nav.orders_waiter")}
            </h2>
            {waiters.length === 0 ? (
              <p className="floor-empty">{t("nav.orders_no_waiters")}</p>
            ) : (
              <div className="waiter-grid">
                {waiters.map((waiter) => (
                  <button
                    key={waiter._id}
                    type="button"
                    className={`waiter-btn ${selectedWaiter === waiter._id ? "active" : ""}`}
                    onClick={() =>
                      setSelectedWaiter((current) => (current === waiter._id ? "" : waiter._id))
                    }
                  >
                    {waiter.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <PageHeader
        icon={Package}
        title={t("nav.orders")}
        subtitle={t("nav.orders_manage_description")}
      >
        <ProtectedElement permission={PERMISSIONS.MANAGE_ORDERS}>
          <button onClick={openPos} className="btn-primary">
            <Plus size={20} />
            {t("nav.orders_add_new")}
          </button>
        </ProtectedElement>
      </PageHeader>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Package />
          </div>
          <div className="stat-content">
            <h3>{orders.length}</h3>
            <p>{t("nav.orders_total_orders")}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-content">
            <h3>{orders.filter((o) => o.status === "pending").length}</h3>
            <p>{t("nav.orders_pending_orders")}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <ChefHat />
          </div>
          <div className="stat-content">
            <h3>{orders.filter((o) => o.status === "in_kitchen").length}</h3>
            <p>{t("nav.orders_in_kitchen")}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign />
          </div>
          <div className="stat-content">
            <h3>{orders.filter((o) => o.status === "paid").length}</h3>
            <p>{t("nav.orders_paid_orders")}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder={t("nav.orders_search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            {t("nav.orders_filter_all")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            {t("nav.orders_filter_pending")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "in_kitchen" ? "active" : ""}`}
            onClick={() => setFilterStatus("in_kitchen")}
          >
            {t("nav.orders_filter_in_kitchen")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "served" ? "active" : ""}`}
            onClick={() => setFilterStatus("served")}
          >
            {t("nav.orders_filter_served")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "out_for_delivery" ? "active" : ""}`}
            onClick={() => setFilterStatus("out_for_delivery")}
          >
            {t("nav.orders_filter_out_for_delivery")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "delivered" ? "active" : ""}`}
            onClick={() => setFilterStatus("delivered")}
          >
            {t("nav.orders_filter_delivered")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "paid" ? "active" : ""}`}
            onClick={() => setFilterStatus("paid")}
          >
            {t("nav.orders_filter_paid")}
          </button>
          <button
            className={`filter-btn ${filterStatus === "cancelled" ? "active" : ""}`}
            onClick={() => setFilterStatus("cancelled")}
          >
            {t("nav.orders_filter_cancelled")}
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th data-direction={i18n.dir()}>{t("nav.orders_order_id")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_customer")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_type")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_table")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_items")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_total")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_status")}</th>
              <th data-direction={i18n.dir()}>{t("nav.orders_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td data-direction={i18n.dir()}>
                  <span className="order-id">#{order._id.slice(-6)}</span>
                </td>
                <td data-direction={i18n.dir()}>
                  <div className="customer-info">
                    <Users size={16} />
                    <span>
                      {order.customer?.name ||
                        (typeof order.customer === "string" ? order.customer : "") ||
                        t("nav.orders_guest_customer")}
                      {order.type === "delivery" && order.deliveryAddress && (
                        <span className="order-address">{order.deliveryAddress}</span>
                      )}
                    </span>
                  </div>
                </td>
                <td data-direction={i18n.dir()}>
                  <span
                    className={`status-badge ${getOrderTypeColor(order.type)}`}
                  >
                    {orderTypeLabel(order.type)}
                  </span>
                </td>
                <td data-direction={i18n.dir()}>
                  {order.type === "dineIn" ? getTableName(order.table) : "-"}
                </td>
                <td data-direction={i18n.dir()}>
                  <div className="items-info">
                    <span>
                      {order.items?.length || 0}{" "}
                      {order.items?.length === 1
                        ? t("nav.orders_item")
                        : t("nav.orders_items")}
                    </span>
                    {order.items?.length > 0 && (
                      <span className="items-total">
                        {order.items[0].menuItem?.name ||
                          order.items[0].name ||
                          ""}
                        {order.items.length > 1
                          ? ` +${order.items.length - 1}`
                          : ""}
                      </span>
                    )}
                  </div>
                </td>
                <td data-direction={i18n.dir()}>
                  <div className="total-info">
                    <span>
                      {formatMoney(
                        order.total ?? calculateTotal(order.items || []),
                        currency,
                      )}
                    </span>
                  </div>
                </td>
                <td data-direction={i18n.dir()}>
                  <span
                    className={`status-badge ${getStatusColor(order.status)}`}
                  >
                    {getStatusIcon(order.status)}
                    {t(`nav.orders_status_${order.status}`)}
                  </span>
                </td>
                <td data-direction={i18n.dir()}>
                  <div className="action-buttons">
                    <ProtectedButton
                      permission={PERMISSIONS.MANAGE_ORDERS}
                      onClick={() => handleEdit(order)}
                      className="btn-edit"
                      title={t("nav.orders_edit_order")}
                    >
                      <Edit2 size={16} />
                    </ProtectedButton>
                    <ProtectedButton
                      permission={PERMISSIONS.MANAGE_ORDERS}
                      onClick={() => handleDelete(order._id)}
                      className="btn-delete"
                      title={t("nav.orders_delete_order")}
                    >
                      <Trash2 size={16} />
                    </ProtectedButton>
                    <ProtectedElement permission={PERMISSIONS.MANAGE_ORDERS}>
                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "in_kitchen")
                          }
                          className="btn-status"
                          title={t("nav.orders_start_preparation")}
                        >
                          <ChefHat size={16} />
                        </button>
                      )}
                      {order.status === "in_kitchen" && order.type === "delivery" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "out_for_delivery")
                          }
                          className="btn-status"
                          title={t("nav.orders_out_for_delivery")}
                        >
                          <Truck size={16} />
                        </button>
                      )}
                      {order.status === "in_kitchen" && order.type !== "delivery" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "served")
                          }
                          className="btn-status"
                          title={t("nav.orders_mark_served")}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {order.status === "out_for_delivery" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "delivered")
                          }
                          className="btn-status"
                          title={t("nav.orders_mark_delivered")}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {order.status !== "paid" && order.status !== "cancelled" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(order._id, "cancelled")
                          }
                          className="btn-status"
                          title={t("nav.orders_cancel_order")}
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      {(order.status === "served" || order.status === "delivered") && (
                        <>
                          <ProtectedButton
                            permission={PERMISSIONS.MANAGE_INVOICES}
                            onClick={() => handleGenerateInvoice(order)}
                            className="btn-invoice"
                            title={t("nav.orders_generate_invoice")}
                          >
                            <DollarSign size={16} />
                          </ProtectedButton>
                          <button
                            onClick={() => {
                              setPaymentData({
                                ...paymentData,
                                orderId: order._id,
                              });
                              setShowPaymentModal(true);
                            }}
                            className="btn-payment"
                            title={t("nav.orders_process_payment")}
                          >
                            <CreditCard size={16} />
                          </button>
                        </>
                      )}
                    </ProtectedElement>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      {/* Add/Edit Order Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {showEditModal ? (
                  <>
                    <Edit2 size={20} />
                    {t("nav.orders_edit_order")}
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    {t("nav.orders_add_new_order")}
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="btn-close"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="order-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t("nav.orders_order_type")}</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option value="dineIn">{t("nav.orders_dine_in")}</option>
                    <option value="takeaway">{t("nav.orders_takeaway")}</option>
                    <option value="delivery">{t("nav.orders_delivery")}</option>
                  </select>
                </div>

                {formData.type === "dineIn" && (
                  <div className="form-group">
                    <label>{t("nav.orders_table")}</label>
                    <select
                      value={formData.table}
                      onChange={(e) =>
                        setFormData({ ...formData, table: e.target.value })
                      }
                    >
                      <option value="">{t("nav.orders_select_table")}</option>
                      {tables.map((table) => (
                        <option key={table._id} value={table._id}>
                          {table.number} ({table.seats} seats)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.type === "delivery" && (
                  <div className="form-group full-width">
                    <label>{t("nav.orders_delivery_address")}</label>
                    <textarea
                      value={formData.deliveryAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, deliveryAddress: e.target.value })
                      }
                      placeholder={t("nav.orders_delivery_address_placeholder")}
                      rows={2}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>{t("nav.orders_customer")}</label>
                  <div className="customer-search-container">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      placeholder={t("nav.orders_customer_placeholder")}
                      className="customer-search-input"
                    />
                    {showCustomerDropdown && (
                      <div className="customer-dropdown">
                        {searchingCustomers ? (
                          <div className="customer-loading">Searching...</div>
                        ) : (
                          customerSearchResults.map((customer) => (
                            <div
                              key={customer._id}
                              className="customer-option"
                              onClick={() => selectCustomer(customer)}
                            >
                              <div className="customer-info">
                                <div className="customer-name">
                                  {customer.name}
                                </div>
                                <div className="customer-phone">
                                  {customer.phone}
                                </div>
                                {customer.email && (
                                  <div className="customer-email">
                                    {customer.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}

                        {customerSearchResults.length === 0 &&
                          customerSearch.length >= 3 &&
                          !searchingCustomers && (
                            <div
                              className="customer-option create-customer-option"
                              onClick={createNewCustomer}
                            >
                              <div className="customer-info">
                                <div className="customer-name">
                                  <UserPlus size={16} />
                                  Create New Customer
                                </div>
                                <div className="customer-phone">
                                  {customerSearch}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {selectedCustomer && (
                      <div className="selected-customer-info">
                        <div className="customer-details">
                          <strong>{selectedCustomer.name}</strong>
                          <span>{selectedCustomer.phone}</span>
                          {selectedCustomer.email && (
                            <span>{selectedCustomer.email}</span>
                          )}
                          <button
                            type="button"
                            onClick={clearCustomerSelection}
                            className="clear-customer-btn"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items Section */}
                <div className="form-group full-width order-items-section">
                  <label>{t("nav.orders_items")}</label>

                  {/* Menu Items Selection */}
                  <div className="menu-items-selection">
                    <select
                      onChange={(e) => {
                        const selectedItem = menuItems.find(
                          (item) => item._id === e.target.value,
                        );
                        if (selectedItem) {
                          addOrderItem(selectedItem);
                          e.target.value = ""; // Reset selection
                        }
                      }}
                      value=""
                    >
                      <option value="">{t("nav.orders_select_item")}</option>
                      {menuItems.map((item) => {
                        const unavailable = item.isActive === false || item.isAvailable === false;
                        return (
                          <option key={item._id} value={item._id} disabled={unavailable}>
                            {item.name} - {formatMoney(item.price, currency)}
                            {unavailable ? ` (${t("nav.orders_out_of_stock")})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Selected Items List */}
                  {formData.items.length > 0 && (
                    <div className="selected-items-list">
                      {formData.items.map((item, index) => (
                        <div key={index} className="order-item-row">
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            <span className="item-price">
                              {formatMoney(item.price, currency)}
                            </span>
                          </div>
                          <div className="item-controls">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateOrderItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="quantity-input"
                            />
                            <input
                              type="text"
                              placeholder={t("nav.orders_item_notes")}
                              value={item.notes || ""}
                              onChange={(e) =>
                                updateOrderItem(index, "notes", e.target.value)
                              }
                              className="item-notes-input"
                            />
                            <button
                              type="button"
                              onClick={() => removeOrderItem(index)}
                              className="btn-icon btn-delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Order Total */}
                      <div className="order-total">
                        <strong>{t("nav.orders_total")}:</strong>
                        <span>{formatMoney(calculateOrderTotal(), currency)}</span>
                      </div>
                    </div>
                  )}

                  {formData.items.length === 0 && (
                    <p className="no-items-message">
                      {t("nav.orders_no_items")}
                    </p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>{t("nav.orders_notes")}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder={t("nav.orders_notes_placeholder")}
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  {showEditModal ? t("common.update") : t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                <CreditCard size={20} />
                {t("nav.orders_process_payment")}
              </h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentData({
                    orderId: "",
                    method: "cash",
                    status: "paid",
                  });
                }}
                className="btn-close"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handlePayment} className="payment-form">
              <div className="mb-8">
                <label className="block mb-4 font-semibold text-[var(--text-primary)] text-lg">
                  {t("nav.orders_payment_method")}
                </label>
                <div className="payment-method-grid">
                  {[
                    { id: "cash", icon: <Banknote size={24} />, label: t("nav.orders_cash") },
                    { id: "card", icon: <CreditCard size={24} />, label: t("nav.orders_card") },
                    { id: "online", icon: <Globe size={24} />, label: t("nav.orders_online") },
                    { id: "wallet", icon: <Wallet size={24} />, label: t("nav.orders_wallet") },
                  ].map((method) => (
                    <div
                      key={method.id}
                      className={`payment-method-card ${paymentData.method === method.id ? "active" : ""}`}
                      onClick={() => setPaymentData({ ...paymentData, method: method.id })}
                    >
                      <div className="method-icon">{method.icon}</div>
                      <span className="method-label">{method.label}</span>
                      {paymentData.method === method.id && (
                        <div className="method-active-check">
                          <CheckCircle size={14} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group pb-4">
                  <label className="block mb-3 font-medium text-[var(--text-secondary)]">
                    {t("nav.orders_payment_status")}
                  </label>
                  <select
                    value={paymentData.status}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, status: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
                  >
                    <option value="paid">{t("nav.orders_paid")}</option>
                    <option value="unpaid">{t("nav.orders_unpaid")}</option>
                  </select>
                </div>
              </div>

              {paymentData.method === "online" && gateways.length > 0 && (
                <div className="online-payment-indicator p-4 mb-6 rounded-xl bg-green-50/50 border border-green-100 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                        Secure Online Payment
                      </p>
                      <p className="text-sm text-green-600">
                        {t("landing.secure_notice")}
                      </p>
                    </div>
                  </div>
                  {gateways[0].logo && (
                    <img 
                      src={gateways[0].logo} 
                      alt={gateways[0].name} 
                      className="h-8 w-auto object-contain opacity-80" 
                    />
                  )}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentData({
                      orderId: "",
                      method: "cash",
                      status: "paid",
                    });
                  }}
                  className="btn-secondary"
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  {t("nav.orders_process_payment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showOpeningCash && (
        <div className="opening-cash-overlay">
          <div
            className="opening-cash"
            role="dialog"
            aria-modal="true"
            aria-labelledby="opening-cash-title"
          >
            <div className="opening-cash-header">
              <h2 id="opening-cash-title">{t("nav.orders_opening_cash")}</h2>
              <button
                type="button"
                className="opening-cash-close"
                onClick={closeOpeningCash}
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>
            <label htmlFor="opening-cash-amount">{t("nav.orders_enter_current_cash")}</label>
            <div className="opening-cash-field">
              <input
                id="opening-cash-amount"
                inputMode="decimal"
                value={openingAmount}
                onChange={(event) =>
                  setOpeningAmount(event.target.value.replace(/[^0-9.]/g, ""))
                }
              />
              <span>{currency}</span>
              <button
                type="button"
                className="opening-cash-clear"
                onClick={() => setOpeningAmount("0.00")}
                aria-label={t("common.close")}
              >
                <X size={14} />
              </button>
            </div>
            <p className="opening-cash-time">
              {t("nav.orders_opening_time")}: {openingStamp}
            </p>
            <div className="opening-cash-actions">
              <button type="button" className="btn-primary" onClick={startBusiness}>
                {t("nav.orders_start_business")}
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerCreated={handleCustomerCreated}
        initialData={{
          phone: customerSearch,
        }}
      />
    </div>
  );
};

export default Orders;
