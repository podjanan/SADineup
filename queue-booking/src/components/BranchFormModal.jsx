import { useEffect, useState } from "react";

export default function BranchFormModal({
  title = "เพิ่มสาขา",
  brands = [],
  defaultValues,
  onClose,
  onSubmit,
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [address, setAddress] = useState(defaultValues?.address || "");
  const [phone, setPhone] = useState(defaultValues?.phone || "");
  const [brandId, setBrandId] = useState(
    defaultValues?.brand_id != null ? String(defaultValues.brand_id) : ""
  );

  // file + preview
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(defaultValues?.image_url || ""); // ถ้ามีรูปเดิม

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handlePickFile(f) {
    if (!f) {
      setImageFile(null);
      setPreview("");
      return;
    }
    const okTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!okTypes.includes(f.type)) {
      alert("กรุณาอัปโหลดไฟล์ PNG / JPG / WEBP เท่านั้น");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      alert("ไฟล์ควรมีขนาดไม่เกิน 2MB");
      return;
    }
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const submit = () => {
    if (!name.trim() || !address.trim()) {
      alert("กรุณากรอกชื่อสาขาและที่อยู่");
      return;
    }
    const payload = {
      name: name.trim(),
      address: address.trim(),
      phone: phone || null,
      brand_id: brandId ? Number(brandId) : null,
      image: imageFile || undefined, // สำคัญ! ส่งเป็น File กลับไป
    };
    onSubmit?.(payload);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4">
          {/* ชื่อสาขา */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">ชื่อสาขา *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น สาขา Tiwanon"
            />
          </div>

          {/* ที่อยู่ */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">ที่อยู่ *</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ที่อยู่สาขา"
            />
          </div>

          {/* โทร */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">เบอร์โทร</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เช่น 02-123-4567"
            />
          </div>

          {/* เลือกแบรนด์ */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">แบรนด์</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
            >
              <option value="">— ไม่ระบุแบรนด์ —</option>
              {brands.map((b) => (
                <option key={b.brand_id} value={String(b.brand_id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* อัปโหลดรูปสาขา */}
          <div>
            <label className="mb-1 block text-sm text-gray-700">
              รูปสาขา (PNG/JPG/WEBP ≤ 2MB)
            </label>
            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handlePickFile(e.target.files?.[0] || null)}
                />
                เลือกไฟล์
              </label>

              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-12 w-12 rounded object-cover ring-1 ring-gray-200"
                />
              ) : (
                <span className="text-xs text-gray-500">ยังไม่ได้เลือกไฟล์</span>
              )}

              {preview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
                    setPreview("");
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  ลบรูป
                </button>
              )}
            </div>

            {defaultValues?.image_url && !imageFile ? (
              <p className="mt-2 text-xs text-gray-500">
                รูปปัจจุบัน: <span className="underline">{defaultValues.image_url}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            ยกเลิก
          </button>
          <button
            onClick={submit}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
