import { useState } from 'react';
import { ImagePlus, Loader2, Upload } from 'lucide-react';
import Field from '../components/Field.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { api, getErrorMessage, getFieldErrors } from '../utils/api.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function toForm(product) {
  if (!product) return { name: '', description: '', price: '', categoryId: '', stock: '', imageUrl: '' };
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    categoryId: String(product.categoryId),
    stock: String(product.stock),
    imageUrl: product.imageUrl || '',
  };
}

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2 || f.name.trim().length > 120) e.name = 'Name must be between 2 and 120 characters';
  if (f.description.length > 2000) e.description = 'Description must be 2000 characters or fewer';
  const price = Number(f.price);
  if (f.price === '' || !Number.isFinite(price) || price <= 0) e.price = 'Enter a price greater than 0';
  else if (Math.abs(Math.round(price * 1000) - price * 1000) > 1e-6) e.price = 'Use at most 3 decimal places';
  if (!f.categoryId) e.categoryId = 'Choose a category';
  const stock = Number(f.stock);
  if (f.stock === '' || !Number.isInteger(stock) || stock < 0) e.stock = 'Stock must be a whole number, 0 or more';
  if (f.imageUrl && !/^(https?:\/\/\S+|\/(uploads|products)\/[\w\-./]+)$/.test(f.imageUrl.trim())) {
    e.imageUrl = 'Enter a full http(s) image URL, or upload an image';
  }
  return e;
}

/** Create / edit form for a product. Validates locally, and the API validates again. */
export default function ProductForm({ product, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(() => toForm(product));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setErrors((prev) => ({ ...prev, imageUrl: 'Only JPG, PNG, WEBP or GIF images are allowed' }));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, imageUrl: 'Image must be 3 MB or smaller' }));
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const { data } = await api.post('/uploads/product-image', body);
      setForm((f) => ({ ...f, imageUrl: data.url }));
      setErrors((prev) => ({ ...prev, imageUrl: undefined }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, imageUrl: getErrorMessage(err, 'Upload failed') }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const local = validate(form);
    setErrors(local);
    setFormError('');
    if (Object.keys(local).length) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      categoryId: Number(form.categoryId),
      stock: Number(form.stock),
      imageUrl: form.imageUrl.trim(),
    };
    setSaving(true);
    try {
      const saved = product
        ? (await api.put(`/products/${product.id}`, payload)).data
        : (await api.post('/products', payload)).data;
      onSaved(saved, Boolean(product));
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'The product could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const preview = form.imageUrl.trim();

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2" id="product-form">
      {formError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2">{formError}</div>
      )}

      <Field label="Product name" htmlFor="p-name" error={errors.name} className="sm:col-span-2">
        <input id="p-name" className="input" value={form.name} onChange={set('name')} maxLength={120} aria-invalid={Boolean(errors.name)} placeholder="e.g. Samsung Galaxy A55 5G" />
      </Field>

      <Field label="Description" htmlFor="p-desc" error={errors.description} className="sm:col-span-2" hint={!errors.description ? `${form.description.length}/2000 characters` : undefined}>
        <textarea id="p-desc" rows={4} className="input resize-y" value={form.description} onChange={set('description')} maxLength={2000} aria-invalid={Boolean(errors.description)} />
      </Field>

      <Field label="Price (TND)" htmlFor="p-price" error={errors.price} hint={!errors.price ? 'Up to 3 decimal places' : undefined}>
        <input id="p-price" type="number" inputMode="decimal" step="0.001" min="0" className="input" value={form.price} onChange={set('price')} aria-invalid={Boolean(errors.price)} />
      </Field>

      <Field label="Stock quantity" htmlFor="p-stock" error={errors.stock}>
        <input id="p-stock" type="number" inputMode="numeric" step="1" min="0" className="input" value={form.stock} onChange={set('stock')} aria-invalid={Boolean(errors.stock)} />
      </Field>

      <Field label="Category" htmlFor="p-cat" error={errors.categoryId} className="sm:col-span-2">
        <select id="p-cat" className="input" value={form.categoryId} onChange={set('categoryId')} aria-invalid={Boolean(errors.categoryId)}>
          <option value="">Select a category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>

      <div className="sm:col-span-2">
        <span className="label">Product image</span>
        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 sm:flex-row sm:items-start">
          <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-2 ring-1 ring-slate-200">
            <ProductImage key={preview} src={preview} alt="Image preview" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <label className={`btn-secondary btn-sm cursor-pointer ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {uploading ? 'Uploading…' : 'Upload image'}
              <input type="file" accept={ALLOWED.join(',')} className="sr-only" onChange={handleFile} disabled={uploading} />
            </label>
            <Field htmlFor="p-image" error={errors.imageUrl} hint={!errors.imageUrl ? 'Or paste an image URL (https://…). JPG, PNG, WEBP or GIF up to 3 MB when uploading.' : undefined}>
              <div className="relative">
                <ImagePlus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input id="p-image" className="input pl-9" placeholder="https://example.com/product.jpg" value={form.imageUrl} onChange={set('imageUrl')} aria-invalid={Boolean(errors.imageUrl)} />
              </div>
            </Field>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
}
