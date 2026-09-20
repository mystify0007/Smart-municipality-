import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function MyProducts() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [businessStatus, setBusinessStatus] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  async function loadData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/products/mine"),
        api.get("/products/categories"),
      ]);
      setProducts(productsRes.data.products);
      setBusinessStatus(productsRes.data.business_status);
      setCategories(categoriesRes.data.categories);
      if (categoriesRes.data.categories.length > 0) {
        setCategoryId(categoriesRes.data.categories[0].category_id);
      }
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("product_name", name);
      formData.append("price", price);
      formData.append("stock", stock || 0);
      formData.append("category_id", categoryId);
      formData.append("description", description);
      if (image) formData.append("image", image);

      await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: "Product listed!" });
      setName(""); setPrice(""); setStock(""); setDescription(""); setImage(null);
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to create listing" });
    }
  }

  if (notFound) {
    return (
      <DashboardLayout title={t("title.myProducts")}>
        <p className="text-portal-danger">No business profile found for this account.</p>
      </DashboardLayout>
    );
  }

  const isApproved = businessStatus === "Approved";

  return (
    <DashboardLayout title={t("title.myProducts")}>
      {businessStatus && businessStatus !== "Approved" && (
        <p className="mb-6 text-sm text-portal-accent bg-portal-accent/10 border border-portal-accent/30 rounded-lg px-4 py-3 inline-block">
          Your business is currently <strong>{businessStatus}</strong>. An admin must approve
          your profile before you can list products.
        </p>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">List a New Product</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Product Name</label>
              <input
                required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Category</label>
              <select
                required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              >
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Price (Rs.)</label>
                <input
                  type="number" required value={price} onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Stock</label>
                <input
                  type="number" value={stock} onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Description</label>
              <textarea
                rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Product Image</label>
              <input
                type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])}
                className="w-full text-sm text-portal-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-portal-primary file:text-white file:text-sm hover:file:bg-portal-primary-hover"
              />
            </div>
            {message && (
              <p className={`text-sm rounded-lg px-3 py-2 border ${
                message.type === "success"
                  ? "text-portal-success bg-portal-success/10 border-portal-success/30"
                  : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
              }`}>
                {message.text}
              </p>
            )}
            <button
              disabled={!isApproved}
              className="w-full bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5"
            >
              List Product
            </button>
          </form>
        </div>

        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">My Listings</h3>
          {loading ? (
            <p className="text-portal-muted text-sm">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-portal-muted text-sm">No products listed yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {products.map((p) => (
                <li key={p.product_id} className="flex justify-between border-b border-portal-panel-border/50 pb-2">
                  <span className="text-portal-text">{p.product_name}</span>
                  <span className="text-portal-muted">Rs. {p.price} · Stock: {p.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
