import React, { useState, useEffect, useCallback } from "react";
import "./Menu.css";
import { useTranslation } from "react-i18next";
import { useRestaurant } from "@hooks/useRestaurant";
import { useAuth } from "@hooks/useAuth";
import { RoleBasedUI } from "@utils/roleUtils";
import {
  Utensils,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Filter,
  DollarSign,
  Image,
  CheckCircle,
  XCircle,
  ChefHat,
  Loader2,
  Package,
  AlertTriangle,
} from "lucide-react";
import menuService from "@services/menuService";
import inventoryService from "@services/inventoryService";
import uploadService from "@services/uploadService";
import categoryService from "@services/categoryService";

const Menu = () => {
  const { t, i18n } = useTranslation();
  const { getThemeColors } = useRestaurant();
  const { user } = useAuth();
  const currentLang = i18n.language;
  console.log("current", currentLang);

  // Get theme colors for dynamic styling
  const themeColors = getThemeColors();
  const primaryColor = themeColors.primary || "#f59e0b";

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRecipeItem, setSelectedRecipeItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category form state
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    isActive: true,
    image: "",
    recipe: [],
    modifiers: [],
  });

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const categoryId = filterCategory === "all" ? null : filterCategory;
      const response = await menuService.getAll(categoryId);
      setMenuItems(response.data || response || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch menu items",
      });
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data || response || []);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || t("menu.error_fetching_categories"),
      });
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await inventoryService.getAll();
      setInventoryItems(response.data || response || []);
    } catch (error) {
      console.error("Failed to fetch inventory items", error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchInventoryItems();
  }, [fetchMenuItems]);

  // Category CRUD operations
  const handleCreateCategory = async (categoryData) => {
    try {
      await categoryService.create(categoryData);
      setMessage({ type: "success", text: t("menu.category_created") });
      fetchCategories();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || t("menu.error_creating_category"),
      });
    }
  };

  const handleUpdateCategory = async (id, categoryData) => {
    try {
      await categoryService.update(id, categoryData);
      setMessage({ type: "success", text: t("menu.category_updated") });
      fetchCategories();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || t("menu.error_updating_category"),
      });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm(t("menu.confirm_delete_category"))) {
      try {
        await categoryService.delete(id);
        setMessage({ type: "success", text: t("menu.category_deleted") });
        fetchCategories();
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error.response?.data?.message || t("menu.error_deleting_category"),
        });
      }
    }
  };

  const handleOpenCategoryModal = (category = null) => {
    setSelectedCategory(category);
    if (category) {
      setCategoryFormData({
        name: category.name,
        description: category.description || "",
        isActive: category.isActive,
      });
    } else {
      setCategoryFormData({
        name: "",
        description: "",
        isActive: true,
      });
    }
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCategory) {
        await handleUpdateCategory(selectedCategory._id, categoryFormData);
      } else {
        await handleCreateCategory(categoryFormData);
      }
      setShowCategoryModal(false);
      setSelectedCategory(null);
      setCategoryFormData({
        name: "",
        description: "",
        isActive: true,
      });
    } catch (error) {
      console.error("Category submission error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category || null, // Handle empty category
        isActive: formData.isActive,
        recipe: formData.recipe,
        modifiers: formData.modifiers,
      };

      // Only include image field if it has a value
      if (formData.image && formData.image.trim() !== "") {
        data.image = formData.image;
      }

      // Validate required fields
      if (!data.name || !data.price || !data.category || data.category === "") {
        setMessage({
          type: "error",
          text: "Please fill in all required fields (name, price, category)",
        });
        return;
      }

      if (selectedItem) {
        const updatedItem = await menuService.update(selectedItem._id, data);
        setMessage({
          type: "success",
          text: "Menu item updated successfully!",
        });
      } else {
        const createdItem = await menuService.create(data);
        setMessage({
          type: "success",
          text: "Menu item created successfully!",
        });
      }
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchMenuItems();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Operation failed",
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("menu.confirm_delete"))) {
      try {
        await menuService.delete(id);
        setMessage({
          type: "success",
          text: "Menu item deleted successfully!",
        });
        fetchMenuItems();
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Delete failed",
        });
      }
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || "",
      description: item.description || "",
      price: item.price?.toString() || "",
      category: item.category?._id || item.category || "",
      isActive: item.isActive !== false,
      image: item.image || "",
      recipe: item.recipe || [],
      modifiers: item.modifiers || [],
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      isActive: true,
      image: "",
      recipe: [],
      modifiers: [],
    });
    setSelectedItem(null);
  };

  const handleAddRecipeItem = () => {
    setFormData({
      ...formData,
      recipe: [...formData.recipe, { inventoryItem: "", qty: 1 }],
    });
  };

  const handleRemoveRecipeItem = (index) => {
    const newRecipe = formData.recipe.filter((_, i) => i !== index);
    setFormData({ ...formData, recipe: newRecipe });
  };

  const handleUpdateRecipeItem = (index, field, value) => {
    const newRecipe = formData.recipe.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    setFormData({ ...formData, recipe: newRecipe });
  };

  // Recipe management functions
  const handleOpenRecipeModal = async (item) => {
    try {
      setSelectedRecipeItem(item);
      const recipeData = await menuService.getRecipe(item._id);
      setFormData({
        ...item,
        recipe: recipeData.data?.recipe || [],
      });
      setShowRecipeModal(true);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch recipe",
      });
    }
  };

  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    try {
      await menuService.updateRecipe(selectedRecipeItem._id, {
        recipe: formData.recipe,
      });
      setMessage({ type: "success", text: "Recipe updated successfully!" });
      setShowRecipeModal(false);
      setSelectedRecipeItem(null);
      fetchMenuItems();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update recipe",
      });
    }
  };

  const handleAddModifier = () => {
    setFormData({
      ...formData,
      modifiers: [...formData.modifiers, { name: "", price: 0 }],
    });
  };

  const handleRemoveModifier = (index) => {
    const newModifiers = formData.modifiers.filter((_, i) => i !== index);
    setFormData({ ...formData, modifiers: newModifiers });
  };

  const handleUpdateModifier = (index, field, value) => {
    const newModifiers = formData.modifiers.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    setFormData({ ...formData, modifiers: newModifiers });
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: t("menu.invalid_image_type"),
      });
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: t("menu.image_too_large"),
      });
      return;
    }

    try {
      setUploadingImage(true);
      const response = await uploadService.uploadImage(file);

      if (response.success && response.data?.url) {
        setFormData({ ...formData, image: response.data.url });
        setMessage({
          type: "success",
          text: t("menu.image_uploaded"),
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || t("menu.image_upload_failed"),
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const activeItemsCount = menuItems.filter((item) => item.isActive).length;
  const inactiveItemsCount = menuItems.filter((item) => !item.isActive).length;

  return (
    <div className="menu-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Utensils size={28} />
            {t("menu.title")}
          </h1>
          <p>{t("menu.page_description")}</p>
        </div>
        <RoleBasedUI user={user} allowedRoles={["admin", "manager"]}>
          <div className="header-actions">
            <button
              onClick={() => handleOpenCategoryModal()}
              className="btn-secondary"
            >
              <Filter size={20} />
              {t("menu.manage_categories")}
            </button>
            <button
              onClick={() => {
                setShowAddModal(true);
                setSelectedItem(null);
                resetForm();
              }}
              className="btn-primary"
            >
              <Plus size={20} />
              {t("menu.add_item")}
            </button>
          </div>
        </RoleBasedUI>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: `${primaryColor}20` }}
          >
            <Utensils style={{ color: primaryColor }} />
          </div>
          <div className="stat-content">
            <h3>{menuItems.length}</h3>
            <p>{t("menu.total_items")}</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon" style={{ background: "#22c55e20" }}>
            <CheckCircle style={{ color: "#22c55e" }} />
          </div>
          <div className="stat-content">
            <h3>{activeItemsCount}</h3>
            <p>{t("menu.active_items")}</p>
          </div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-icon" style={{ background: "#ef444420" }}>
            <XCircle style={{ color: "#ef4444" }} />
          </div>
          <div className="stat-content">
            <h3>{inactiveItemsCount}</h3>
            <p>{t("menu.inactive_items")}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder={t("menu.search_placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterCategory === "all" ? "active" : ""}`}
            onClick={() => setFilterCategory("all")}
          >
            {t("menu.all_categories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              className={`filter-btn ${filterCategory === cat._id ? "active" : ""}`}
              onClick={() => setFilterCategory(cat._id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Menu Items Grid */}
      {loading ? (
        <div className="loading">{t("common.loading")}</div>
      ) : filteredItems.length === 0 ? (
        <div className="no-data">{t("menu.no_items_found")}</div>
      ) : (
        <div className="menu-grid">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`menu-card ${!item.isActive ? "inactive" : ""}`}
            >
              <div className="menu-card-image">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className="placeholder-image">
                    <Image size={40} />
                  </div>
                )}
                {!item.isActive && (
                  <span className="inactive-badge">{t("menu.inactive")}</span>
                )}
              </div>
              <div className="menu-card-content">
                <div className="menu-card-header">
                  <h3>{item.name}</h3>
                  <span className="price">
                    <DollarSign size={14} />
                    {item.price?.toFixed(2)}
                  </span>
                </div>
                <p className="description">{item.description}</p>
                <div className="menu-card-meta">
                  <span className="category">
                    <ChefHat size={14} />
                    {item.category?.name || t("menu.uncategorized")}
                  </span>
                  <span
                    className={`availability-status ${item.isAvailable ? "available" : "unavailable"}`}
                  >
                    {item.isAvailable ? (
                      <>
                        <CheckCircle size={14} />
                        {t("menu.available")}
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        {t("menu.out_of_stock")}
                      </>
                    )}
                  </span>
                </div>
                <div className="menu-card-actions">
                  <RoleBasedUI user={user} allowedRoles={["admin", "manager"]}>
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn-icon btn-edit"
                      title={t("common.edit")}
                    >
                      <Edit size={16} />
                    </button>
                  </RoleBasedUI>
                  <button
                    onClick={() => handleOpenRecipeModal(item)}
                    className="btn-icon btn-recipe"
                    title={t("menu.manage_recipe")}
                  >
                    <Package size={16} />
                  </button>
                  <RoleBasedUI user={user} allowedRoles={["admin"]}>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="btn-icon btn-delete"
                      title={t("common.delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </RoleBasedUI>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>
                {showEditModal ? (
                  <>
                    <Edit size={20} />
                    {t("menu.edit_item")}
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    {t("menu.add_item")}
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
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="menu-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t("menu.name")} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t("menu.price")} *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t("menu.category")} *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    <option value="">{t("menu.select_category")}</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image Upload */}
                <div className="form-group full-width">
                  <label>{t("menu.image")}</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="image-file-input"
                    />
                    {uploadingImage && (
                      <div className="upload-loading">
                        <Loader2 size={20} className="spinner" />
                        <span>{t("menu.uploading")}</span>
                      </div>
                    )}
                    {formData.image && !uploadingImage && (
                      <div className="image-preview">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="preview-img"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, image: "" })
                          }
                          className="btn-remove-image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>{t("menu.description")}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows="3"
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  {t("menu.is_active")}
                </label>
              </div>

              {/* Recipe Section */}
              <div className="recipe-section">
                <div className="section-header">
                  <label>{t("menu.recipe")}</label>
                  <button
                    type="button"
                    onClick={handleAddRecipeItem}
                    className="btn-small btn-secondary"
                  >
                    <Plus size={14} />
                    {t("menu.add_ingredient")}
                  </button>
                </div>
                {formData.recipe.map((recipeItem, index) => (
                  <div key={index} className="recipe-row">
                    {recipeItem.inventoryItem &&
                    (typeof recipeItem.inventoryItem === "object"
                      ? recipeItem.inventoryItem._id
                      : recipeItem.inventoryItem) ? (
                      // Show selected item as text when editing
                      <div className="recipe-item-display">
                        {typeof recipeItem.inventoryItem === "object"
                          ? recipeItem.inventoryItem.name
                          : inventoryItems.find(
                              (item) => item._id === recipeItem.inventoryItem,
                            )?.name || t("menu.select_ingredient")}
                      </div>
                    ) : (
                      // Show dropdown for new items
                      <select
                        value={
                          typeof recipeItem.inventoryItem === "object"
                            ? recipeItem.inventoryItem._id
                            : recipeItem.inventoryItem
                        }
                        onChange={(e) =>
                          handleUpdateRecipeItem(
                            index,
                            "inventoryItem",
                            e.target.value,
                          )
                        }
                        className="recipe-select"
                      >
                        <option value="">{t("menu.select_ingredient")}</option>
                        {inventoryItems.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} ({item.stock} {item.unit})
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t("menu.quantity")}
                      value={recipeItem.qty}
                      onChange={(e) =>
                        handleUpdateRecipeItem(
                          index,
                          "qty",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="recipe-qty"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipeItem(index)}
                      className="btn-icon btn-delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Modifiers Section */}
              <div className="modifiers-section">
                <div className="section-header">
                  <label>{t("menu.modifiers")}</label>
                  <button
                    type="button"
                    onClick={handleAddModifier}
                    className="btn-small btn-secondary"
                  >
                    <Plus size={14} />
                    {t("menu.add_modifier")}
                  </button>
                </div>
                {formData.modifiers.map((modifier, index) => (
                  <div key={index} className="modifier-row">
                    <input
                      type="text"
                      placeholder={t("menu.modifier_name")}
                      value={modifier.name}
                      onChange={(e) =>
                        handleUpdateModifier(index, "name", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder={t("menu.modifier_price")}
                      value={modifier.price}
                      onChange={(e) =>
                        handleUpdateModifier(
                          index,
                          "price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveModifier(index)}
                      className="btn-icon btn-delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
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
                  {showEditModal ? (
                    <>
                      <Save size={16} />
                      {t("common.update")}
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      {t("common.create")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Management Modal */}
      {showRecipeModal && selectedRecipeItem && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>
                <Package size={20} />
                {t("menu.manage_recipe")} - {selectedRecipeItem.name}
              </h2>
              <button
                onClick={() => {
                  setShowRecipeModal(false);
                  setSelectedRecipeItem(null);
                }}
                className="btn-close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRecipeSubmit} className="recipe-form">
              <div className="modal-body">
                <div className="recipe-section">
                  <div className="section-header">
                    <label>{t("menu.recipe")}</label>
                    <button
                      type="button"
                      onClick={handleAddRecipeItem}
                      className="btn-small btn-secondary"
                    >
                      <Plus size={14} />
                      {t("menu.add_ingredient")}
                    </button>
                  </div>
                  {formData.recipe.map((recipeItem, index) => (
                    <div key={index} className="recipe-row">
                      <select
                        value={recipeItem.inventoryItem}
                        onChange={(e) =>
                          handleUpdateRecipeItem(
                            index,
                            "inventoryItem",
                            e.target.value,
                          )
                        }
                        className="recipe-select"
                        disabled={
                          recipeItem.inventoryItem !== "" &&
                          recipeItem.inventoryItem !== undefined
                        }
                      >
                        <option value="">{t("menu.select_ingredient")}</option>
                        {inventoryItems.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} ({item.stock} {item.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t("menu.quantity")}
                        value={recipeItem.qty}
                        onChange={(e) =>
                          handleUpdateRecipeItem(
                            index,
                            "qty",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="recipe-qty"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipeItem(index)}
                        className="btn-icon btn-delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecipeModal(false);
                    setSelectedRecipeItem(null);
                  }}
                  className="btn-secondary"
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  {t("menu.update_recipe")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                <Filter size={20} />
                {selectedCategory
                  ? t("menu.edit_category")
                  : t("menu.add_category")}
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setSelectedCategory(null);
                  setCategoryFormData({
                    name: "",
                    description: "",
                    isActive: true,
                  });
                }}
                className="btn-close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="category-form">
              <div className="modal-body">
                {/* Existing Categories List */}
                <div className="existing-categories">
                  <h3>{t("menu.existing_categories")}</h3>
                  {categories.length === 0 ? (
                    <p className="no-categories">{t("menu.no_categories")}</p>
                  ) : (
                    <div className="categories-list">
                      {categories.map((category) => (
                        <div key={category._id} className="category-item">
                          <div className="category-info">
                            <h4>{category.name}</h4>
                            {category.description && (
                              <p>{category.description}</p>
                            )}
                            <span
                              className={`status-badge ${category.isActive ? "active" : "inactive"}`}
                            >
                              {category.isActive
                                ? t("menu.active")
                                : t("menu.inactive")}
                            </span>
                          </div>
                          <div className="category-actions">
                            <button
                              type="button"
                              onClick={() => handleOpenCategoryModal(category)}
                              className="btn-icon btn-edit"
                              title={t("common.edit")}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(category._id)}
                              className="btn-icon btn-delete"
                              title={t("common.delete")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add/Edit Category Form */}
                <div className="category-form-section">
                  <h3>
                    {selectedCategory
                      ? t("menu.edit_category")
                      : t("menu.add_category")}
                  </h3>
                  <div className="form-group">
                    <label>{t("menu.category_name")} *</label>
                    <input
                      type="text"
                      value={categoryFormData.name}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          name: e.target.value,
                        })
                      }
                      required
                      placeholder={t("menu.category_name_placeholder")}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("menu.category_description")}</label>
                    <textarea
                      value={categoryFormData.description}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          description: e.target.value,
                        })
                      }
                      rows="3"
                      placeholder={t("menu.category_description_placeholder")}
                    />
                  </div>
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={categoryFormData.isActive}
                        onChange={(e) =>
                          setCategoryFormData({
                            ...categoryFormData,
                            isActive: e.target.checked,
                          })
                        }
                      />
                      {t("menu.category_active")}
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setSelectedCategory(null);
                    setCategoryFormData({
                      name: "",
                      description: "",
                      isActive: true,
                    });
                  }}
                  className="btn-secondary"
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  {selectedCategory
                    ? t("menu.update_category")
                    : t("menu.create_category")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Category Management Modal Component
const CategoryManagementModal = ({
  categories,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  t,
  user,
}) => {
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      onUpdate(editingCategory._id, { name: categoryName });
      setEditingCategory(null);
    } else {
      onCreate({ name: categoryName });
    }
    setCategoryName("");
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setCategoryName("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>
            <Filter size={20} />
            {t("menu.manage_categories")}
          </h2>
          <button onClick={onClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="category-modal-content">
          {/* Category Form */}
          <RoleBasedUI user={user} allowedRoles={["admin", "manager"]}>
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label>
                  {editingCategory
                    ? t("menu.edit_category")
                    : t("menu.new_category")}
                </label>
                <div className="category-input-row">
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder={t("menu.category_name_placeholder")}
                    required
                  />
                  {editingCategory ? (
                    <>
                      <button type="submit" className="btn-primary">
                        <Save size={16} />
                        {t("common.update")}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="btn-secondary"
                      >
                        <X size={16} />
                        {t("common.cancel")}
                      </button>
                    </>
                  ) : (
                    <button type="submit" className="btn-primary">
                      <Plus size={16} />
                      {t("common.add")}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </RoleBasedUI>

          {/* Categories List */}
          <div className="categories-list">
            <h3>{t("menu.existing_categories")}</h3>
            {categories.length === 0 ? (
              <p className="no-categories">{t("menu.no_categories")}</p>
            ) : (
              categories.map((category) => (
                <div key={category._id} className="category-item">
                  <span className="category-name">{category.name}</span>
                  <div className="category-actions">
                    <RoleBasedUI
                      user={user}
                      allowedRoles={["admin", "manager"]}
                    >
                      <button
                        onClick={() => handleEdit(category)}
                        className="btn-icon btn-edit"
                        title={t("common.edit")}
                      >
                        <Edit size={16} />
                      </button>
                    </RoleBasedUI>
                    <RoleBasedUI user={user} allowedRoles={["admin"]}>
                      <button
                        onClick={() => onDelete(category._id)}
                        className="btn-icon btn-delete"
                        title={t("common.delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </RoleBasedUI>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
